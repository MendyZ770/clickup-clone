import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth-helpers";

export async function GET(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const workspaceId = searchParams.get("workspaceId");

    if (!workspaceId) {
      return NextResponse.json({ error: "workspaceId required" }, { status: 400 });
    }

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    const accounts = await prisma.financeAccount.findMany({
      where: { workspaceId, userId: user.id },
    });

    const totalBalance = accounts.reduce((sum, a) => sum + a.balance, 0);

    const monthlyTransactions = await prisma.financeTransaction.findMany({
      where: {
        userId: user.id,
        account: { workspaceId },
        date: { gte: startOfMonth, lte: endOfMonth },
      },
    });

    const monthlyIncome = monthlyTransactions
      .filter((t) => t.type === "income")
      .reduce((sum, t) => sum + t.amount, 0);

    const monthlyExpense = monthlyTransactions
      .filter((t) => t.type === "expense")
      .reduce((sum, t) => sum + t.amount, 0);

    const expenseByCategory = await prisma.financeTransaction.groupBy({
      by: ["categoryId"],
      where: {
        userId: user.id,
        account: { workspaceId },
        type: "expense",
        date: { gte: startOfMonth, lte: endOfMonth },
      },
      _sum: { amount: true },
    });

    const categories = await prisma.financeCategory.findMany({
      where: { workspaceId, type: "expense" },
    });

    const categoryBreakdown = expenseByCategory.map((item) => ({
      categoryId: item.categoryId,
      amount: item._sum.amount ?? 0,
      category: categories.find((c) => c.id === item.categoryId) ?? null,
    }));

    const goals = await prisma.financeGoal.findMany({
      where: { workspaceId, userId: user.id },
    });

    const totalTarget = goals.reduce((sum, g) => sum + g.targetAmount, 0);
    const totalSaved = goals.reduce((sum, g) => sum + g.currentAmount, 0);

    return NextResponse.json({
      totalBalance,
      accountsCount: accounts.length,
      monthlyIncome,
      monthlyExpense,
      monthlyNet: monthlyIncome - monthlyExpense,
      categoryBreakdown,
      goalsCount: goals.length,
      totalTarget,
      totalSaved,
      goalsProgress: totalTarget > 0 ? Math.round((totalSaved / totalTarget) * 100) : 0,
    });
  } catch (error) {
    console.error("[FINANCE_STATS_GET]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
