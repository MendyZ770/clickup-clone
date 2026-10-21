import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth-helpers";
import { parseMoney, serializeMoney } from "@/lib/money";

export async function POST(request: Request, { params }: { params: Promise<{ goalId: string }> }) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { goalId } = await params;

    const body = await request.json();
    const amount = parseMoney(body.amount);
    if (!amount) {
      return NextResponse.json({ error: "Montant invalide" }, { status: 400 });
    }

    const note = body.note;
    if (note !== undefined && (typeof note !== "string" || note.length > 500)) {
      return NextResponse.json({ error: "Note invalide" }, { status: 400 });
    }

    const result = await prisma.$transaction(async (tx) => {
      const goal = await tx.financeGoal.findFirst({
        where: { id: goalId, userId: user.id },
        select: {
          id: true,
          name: true,
          currency: true,
          targetAmount: true,
          currentAmount: true,
          isCompleted: true,
          accountId: true,
        },
      });
      if (!goal) throw new Error("GOAL_NOT_FOUND");
      if (goal.isCompleted) throw new Error("GOAL_COMPLETED");

      const remaining = goal.targetAmount.minus(goal.currentAmount);
      if (amount.gt(remaining)) throw new Error("OVER_TARGET");

      let linkedAccount = null;
      if (goal.accountId) {
        linkedAccount = await tx.financeAccount.findFirst({
          where: { id: goal.accountId, userId: user.id },
          select: { id: true, currency: true },
        });
        if (!linkedAccount) throw new Error("ACCOUNT_NOT_FOUND");
        if (linkedAccount.currency !== goal.currency) throw new Error("CURRENCY_MISMATCH");
      }

      const newAmount = goal.currentAmount.plus(amount);
      const updated = await tx.financeGoal.updateMany({
        where: {
          id: goal.id,
          userId: user.id,
          currentAmount: goal.currentAmount,
          isCompleted: false,
        },
        data: {
          currentAmount: newAmount,
          isCompleted: newAmount.gte(goal.targetAmount),
        },
      });
      if (updated.count === 0) throw new Error("GOAL_CHANGED");

      const contribution = await tx.financeGoalContribution.create({
        data: { amount, note: note || null, goalId: goal.id, userId: user.id },
      });

      if (linkedAccount) {
        await tx.financeAccount.update({
          where: { id: linkedAccount.id },
          data: { balance: { decrement: amount } },
        });
        await tx.financeTransaction.create({
          data: {
            amount,
            type: "transfer",
            description: `Contribution à l'objectif « ${goal.name} »`,
            accountId: linkedAccount.id,
            userId: user.id,
            isTransfer: true,
            targetAccountId: null,
          },
        });
      }

      return contribution;
    });

    return NextResponse.json(serializeMoney(result), { status: 201 });
  } catch (error) {
    if (error instanceof Error) {
      switch (error.message) {
        case "GOAL_NOT_FOUND":
          return NextResponse.json({ error: "Objectif introuvable" }, { status: 404 });
        case "GOAL_COMPLETED":
          return NextResponse.json({ error: "Cet objectif est déjà atteint" }, { status: 400 });
        case "OVER_TARGET":
          return NextResponse.json(
            { error: "Le montant dépasse le reste à épargner pour cet objectif" },
            { status: 400 }
          );
        case "ACCOUNT_NOT_FOUND":
          return NextResponse.json(
            { error: "Le compte lié à cet objectif est introuvable" },
            { status: 400 }
          );
        case "CURRENCY_MISMATCH":
          return NextResponse.json(
            { error: "La devise de l'objectif ne correspond pas à celle du compte" },
            { status: 400 }
          );
        case "GOAL_CHANGED":
          return NextResponse.json(
            { error: "L'objectif a été modifié entre-temps, veuillez réessayer" },
            { status: 409 }
          );
      }
    }
    console.error("[FINANCE_GOAL_CONTRIBUTE]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
