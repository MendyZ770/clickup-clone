import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { fetchEnableBanking } from "@/lib/enablebanking";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { code, state } = await req.json();

    if (!code || !state) {
      return NextResponse.json({ error: "Missing parameters" }, { status: 400 });
    }

    // Décoder le state
    let stateData: any;
    try {
      stateData = JSON.parse(Buffer.from(state, 'base64').toString('utf8'));
    } catch (e) {
      return NextResponse.json({ error: "Invalid state" }, { status: 400 });
    }

    if (stateData.userId !== session.user.id) {
      return NextResponse.json({ error: "State mismatch" }, { status: 403 });
    }

    const workspaceId = stateData.workspaceId;

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

    // Récupérer la liste des comptes associés à cette session
    const accountsRes = await fetchEnableBanking(`/sessions/${sessionId}/accounts`);

    if (!accountsRes.accounts || accountsRes.accounts.length === 0) {
      return NextResponse.json({ error: "No accounts found" }, { status: 400 });
    }

    // Sauvegarder chaque compte en BDD
    for (const acc of accountsRes.accounts) {
      const accountId = acc.account_id;
      // On génère un identifiant unique combinant la session et l'account pour Enable Banking
      const ebId = `${sessionId}:${accountId}`;

      // On récupère les infos basiques (IBAN ou nom)
      let name = "Compte Bancaire";
      if (acc.iban) name = `Compte ${acc.iban.slice(-4)}`;
      else if (acc.name) name = acc.name;

      await prisma.financeAccount.create({
        data: {
          name: name,
          type: "bank",
          balance: 0,
          workspaceId,
          userId: session.user.id,
          ebAccountId: ebId,
          color: "#4F46E5", // Indigo color for Enable Banking
        },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error in Enable Banking callback:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
