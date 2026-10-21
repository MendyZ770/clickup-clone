import { NextResponse } from "next/server";
import { getCurrentUser, isWorkspaceMember } from "@/lib/auth-helpers";
import { fetchEnableBanking } from "@/lib/enablebanking";
import { prisma } from "@/lib/prisma";
import { verifySignedState } from "@/lib/signed-state";

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { code, state } = await req.json();

    if (!code || !state) {
      return NextResponse.json({ error: "Missing parameters" }, { status: 400 });
    }

    const stateData = verifySignedState<{
      workspaceId?: string;
      userId?: string;
    }>(state);

    if (!stateData?.workspaceId || stateData.userId !== user.id) {
      return NextResponse.json({ error: "Invalid state" }, { status: 403 });
    }

    const workspaceId = stateData.workspaceId;
    if (!(await isWorkspaceMember(workspaceId, user.id))) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Échanger le code contre une session
    const redirectUrl = process.env.NEXT_PUBLIC_APP_URL 
      ? `${process.env.NEXT_PUBLIC_APP_URL}/finance` 
      : "http://localhost:3000/finance";

    const sessionRes = await fetchEnableBanking("/sessions", {
      method: "POST",
      body: JSON.stringify({
        code: code,
        redirect_url: redirectUrl
      })
    });

    const sessionId = sessionRes.session_id;

    // Récupérer la liste des comptes depuis la réponse de session
    const accountsData = sessionRes.accounts_data || sessionRes.accounts || [];

    if (accountsData.length === 0) {
      return NextResponse.json({ error: "No accounts found" }, { status: 400 });
    }

    // Sauvegarder chaque compte en BDD sans créer de doublons lors des reconnexions
    const seenIds = new Set<string>();
    for (const acc of accountsData) {
      // identification_hash est stable entre sessions ; à défaut on retombe sur l'uid
      const accountId =
        (typeof acc === "object" && acc !== null
          ? acc.identification_hash || acc.uid || acc.account_id || acc.id || acc.iban
          : acc) ?? acc;
      if (accountId === undefined || accountId === null || accountId === "") {
        console.warn("Enable Banking account without usable identifier, skipping", acc);
        continue;
      }
      const stableId = String(accountId);
      if (seenIds.has(stableId)) continue;
      seenIds.add(stableId);

      // On récupère les infos basiques (IBAN ou nom)
      let name = "Compte Bancaire";
      if (typeof acc === "object" && acc !== null) {
        if (acc.iban) name = `Compte ${String(acc.iban).slice(-4)}`;
        else if (acc.name) name = String(acc.name);
      } else if (typeof acc === "string" && acc.length > 0) {
        name = `Compte ${acc.slice(-4)}`;
      }

      // Ancien format d'identifiant : `${sessionId}:${accountId}`
      const existing = await prisma.financeAccount.findFirst({
        where: {
          userId: user.id,
          workspaceId,
          OR: [
            { ebAccountId: stableId },
            { ebAccountId: { endsWith: `:${stableId}` } },
          ],
        },
        select: { id: true, ebAccountId: true },
      });

      if (existing) {
        if (existing.ebAccountId !== stableId) {
          // Migration vers l'identifiant stable pour survivre aux prochaines sessions
          await prisma.financeAccount.update({
            where: { id: existing.id },
            data: { ebAccountId: stableId },
          });
        }
        continue;
      }

      await prisma.financeAccount.create({
        data: {
          name: name,
          type: "bank",
          balance: 0,
          workspaceId,
          userId: user.id,
          ebAccountId: stableId,
          color: "#4F46E5", // Indigo color for Enable Banking
        },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error in Enable Banking callback:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
