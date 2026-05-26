 
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth-helpers";

export async function POST(request: Request, { params }: { params: Promise<{ goalId: string }> }) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { goalId } = await params;

    const body = await request.json();
    const { amount, note } = body;

    if (!amount || amount <= 0) {
      return NextResponse.json({ error: "Invalid amount" }, { status: 400 });
    }

    const result = await prisma.$transaction(async (tx: any) => {
      const contribution = await tx.financeGoalContribution.create({
        data: {
          amount,
          note,
          goalId,
          userId: user.id,
        },
      });

      await tx.financeGoal.update({
        where: { id: goalId },
        data: { currentAmount: { increment: amount } },
      });

      return contribution;
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("[FINANCE_GOAL_CONTRIBUTE]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
