import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth-helpers";
import { parseMoney, serializeMoney } from "@/lib/money";

export async function GET(request: Request, { params }: { params: Promise<{ goalId: string }> }) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { goalId } = await params;

    const goal = await prisma.financeGoal.findFirst({
      where: { id: goalId, userId: user.id },
      include: {
        contributions: { orderBy: { date: "desc" } },
        account: { select: { id: true, name: true, currency: true } },
      },
    });

    if (!goal) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(serializeMoney(goal));
  } catch (error) {
    console.error("[FINANCE_GOAL_GET]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ goalId: string }> }) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { goalId } = await params;

    const body = await request.json();
    const { name, description, targetAmount, currentAmount, currency, color, deadline, isCompleted, accountId } = body;

    const existing = await prisma.financeGoal.findFirst({
      where: { id: goalId, userId: user.id },
      select: {
        id: true,
        currency: true,
        accountId: true,
        currentAmount: true,
        _count: { select: { contributions: true } },
      },
    });
    if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

    if (
      currentAmount !== undefined &&
      (typeof currentAmount !== "number" || !Number.isFinite(currentAmount) || currentAmount !== 0)
    ) {
      return NextResponse.json(
        { error: "Le montant actuel se met à jour uniquement via les contributions" },
        { status: 400 }
      );
    }

    if (name !== undefined && (typeof name !== "string" || name.trim().length === 0 || name.length > 100)) {
      return NextResponse.json({ error: "Nom invalide" }, { status: 400 });
    }
    if (description !== undefined && (typeof description !== "string" || description.length > 500)) {
      return NextResponse.json({ error: "Description invalide" }, { status: 400 });
    }
    if (color !== undefined && (typeof color !== "string" || !/^#[0-9A-Fa-f]{6}$/.test(color))) {
      return NextResponse.json({ error: "Couleur invalide" }, { status: 400 });
    }

    let parsedTarget = null;
    if (targetAmount !== undefined) {
      parsedTarget = parseMoney(targetAmount);
      if (!parsedTarget) {
        return NextResponse.json({ error: "Montant cible invalide" }, { status: 400 });
      }
    }

    let parsedDeadline: Date | null | undefined = undefined;
    if (deadline !== undefined) {
      if (deadline === null || deadline === "") {
        parsedDeadline = null;
      } else {
        parsedDeadline = new Date(deadline);
        if (Number.isNaN(parsedDeadline.getTime())) {
          return NextResponse.json({ error: "Date invalide" }, { status: 400 });
        }
      }
    }

    let newCurrency = existing.currency;
    if (currency !== undefined) {
      if (typeof currency !== "string" || !/^[A-Z]{3}$/.test(currency)) {
        return NextResponse.json({ error: "Devise invalide" }, { status: 400 });
      }
      newCurrency = currency;
    }

    let newAccountId = existing.accountId;
    if (accountId !== undefined) {
      if (accountId === null || accountId === "") {
        newAccountId = null;
      } else {
        if (typeof accountId !== "string") {
          return NextResponse.json({ error: "Compte invalide" }, { status: 400 });
        }
        const account = await prisma.financeAccount.findFirst({
          where: { id: accountId, userId: user.id },
          select: { id: true, currency: true },
        });
        if (!account) {
          return NextResponse.json({ error: "Compte introuvable" }, { status: 400 });
        }
        if (account.currency !== newCurrency) {
          return NextResponse.json(
            { error: "La devise de l'objectif doit correspondre à celle du compte" },
            { status: 400 }
          );
        }
        newAccountId = account.id;
      }
    }

    if (newCurrency !== existing.currency) {
      if (existing._count.contributions > 0) {
        return NextResponse.json(
          { error: "La devise ne peut plus être modifiée après des contributions" },
          { status: 400 }
        );
      }
      if (newAccountId) {
        const linked = await prisma.financeAccount.findFirst({
          where: { id: newAccountId, userId: user.id },
          select: { currency: true },
        });
        if (!linked || linked.currency !== newCurrency) {
          return NextResponse.json(
            { error: "La devise de l'objectif doit correspondre à celle du compte lié" },
            { status: 400 }
          );
        }
      }
    }

    if (isCompleted !== undefined && typeof isCompleted !== "boolean") {
      return NextResponse.json({ error: "Statut invalide" }, { status: 400 });
    }

    const goal = await prisma.financeGoal.update({
      where: { id: goalId },
      data: {
        ...(name !== undefined && { name: name.trim() }),
        ...(description !== undefined && { description: description || null }),
        ...(parsedTarget !== null && { targetAmount: parsedTarget }),
        ...(currency !== undefined && { currency: newCurrency }),
        ...(color !== undefined && { color }),
        ...(parsedDeadline !== undefined && { deadline: parsedDeadline }),
        ...(parsedTarget !== null
          ? { isCompleted: existing.currentAmount.gte(parsedTarget) }
          : isCompleted !== undefined && { isCompleted }),
        ...(accountId !== undefined && { accountId: newAccountId }),
      },
    });

    return NextResponse.json(serializeMoney(goal));
  } catch (error) {
    console.error("[FINANCE_GOAL_PATCH]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ goalId: string }> }) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { goalId } = await params;

    const existing = await prisma.financeGoal.findFirst({
      where: { id: goalId, userId: user.id },
      select: { id: true },
    });
    if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

    await prisma.financeGoal.delete({ where: { id: goalId } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[FINANCE_GOAL_DELETE]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
