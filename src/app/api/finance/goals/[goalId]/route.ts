 
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth-helpers";

export async function GET(request: Request, { params }: { params: Promise<{ goalId: string }> }) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { goalId } = await params;

    const goal = await prisma.financeGoal.findUnique({
      where: { id: goalId, userId: user.id },
      include: {
        contributions: { orderBy: { date: "desc" } },
        account: { select: { id: true, name: true } },
      },
    });

    if (!goal) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(goal);
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

    const goal = await prisma.financeGoal.update({
      where: { id: goalId, userId: user.id },
      data: { name, description, targetAmount, currentAmount, currency, color, deadline: deadline ? new Date(deadline) : undefined, isCompleted, accountId },
    });

    return NextResponse.json(goal);
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

    await prisma.financeGoal.delete({
      where: { id: goalId, userId: user.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[FINANCE_GOAL_DELETE]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
