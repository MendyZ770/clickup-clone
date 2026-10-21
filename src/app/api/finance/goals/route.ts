import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, isWorkspaceMember } from "@/lib/auth-helpers";
import { parseMoney, serializeMoney } from "@/lib/money";

const DEFAULT_COLOR = "#10B981";

export async function GET(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const workspaceId = searchParams.get("workspaceId");

    if (!workspaceId) {
      return NextResponse.json({ error: "workspaceId required" }, { status: 400 });
    }

    if (!(await isWorkspaceMember(workspaceId, user.id))) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const goals = await prisma.financeGoal.findMany({
      where: { workspaceId, userId: user.id },
      include: {
        _count: { select: { contributions: true } },
        account: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(serializeMoney(goals));
  } catch (error) {
    console.error("[FINANCE_GOALS_GET]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const { name, description, currentAmount, deadline, workspaceId, accountId } = body;

    if (typeof name !== "string" || name.trim().length === 0 || name.length > 100) {
      return NextResponse.json({ error: "Nom invalide" }, { status: 400 });
    }
    if (typeof workspaceId !== "string" || !workspaceId) {
      return NextResponse.json({ error: "workspaceId required" }, { status: 400 });
    }

    if (!(await isWorkspaceMember(workspaceId, user.id))) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const targetAmount = parseMoney(body.targetAmount);
    if (!targetAmount) {
      return NextResponse.json({ error: "Montant cible invalide" }, { status: 400 });
    }

    if (currentAmount !== undefined && currentAmount !== null) {
      const initial = parseMoney(currentAmount, { allowZero: true });
      if (!initial || !initial.isZero()) {
        return NextResponse.json(
          { error: "Le montant actuel se met à jour uniquement via les contributions" },
          { status: 400 }
        );
      }
    }

    const currency = body.currency || "EUR";
    if (typeof currency !== "string" || !/^[A-Z]{3}$/.test(currency)) {
      return NextResponse.json({ error: "Devise invalide" }, { status: 400 });
    }

    if (body.color !== undefined && (typeof body.color !== "string" || !/^#[0-9A-Fa-f]{6}$/.test(body.color))) {
      return NextResponse.json({ error: "Couleur invalide" }, { status: 400 });
    }

    let parsedDeadline: Date | null = null;
    if (deadline) {
      parsedDeadline = new Date(deadline);
      if (Number.isNaN(parsedDeadline.getTime())) {
        return NextResponse.json({ error: "Date invalide" }, { status: 400 });
      }
    }

    let linkedAccountId: string | null = null;
    if (accountId) {
      if (typeof accountId !== "string") {
        return NextResponse.json({ error: "Compte invalide" }, { status: 400 });
      }
      const account = await prisma.financeAccount.findFirst({
        where: { id: accountId, userId: user.id, workspaceId },
        select: { id: true, currency: true },
      });
      if (!account) {
        return NextResponse.json({ error: "Compte introuvable" }, { status: 400 });
      }
      if (account.currency !== currency) {
        return NextResponse.json(
          { error: "La devise de l'objectif doit correspondre à celle du compte" },
          { status: 400 }
        );
      }
      linkedAccountId = account.id;
    }

    if (description !== undefined && (typeof description !== "string" || description.length > 500)) {
      return NextResponse.json({ error: "Description invalide" }, { status: 400 });
    }

    const goal = await prisma.financeGoal.create({
      data: {
        name: name.trim(),
        description: description || null,
        targetAmount,
        currentAmount: 0,
        currency,
        color: body.color || DEFAULT_COLOR,
        deadline: parsedDeadline,
        workspaceId,
        userId: user.id,
        accountId: linkedAccountId,
      },
    });

    return NextResponse.json(serializeMoney(goal), { status: 201 });
  } catch (error) {
    console.error("[FINANCE_GOALS_POST]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
