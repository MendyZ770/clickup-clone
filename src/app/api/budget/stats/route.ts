import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth-helpers";

async function checkBudgetAccess(userId: string, budgetId: string) {
  const budget = await prisma.budget.findFirst({
    where: {
      id: budgetId,
      workspace: { members: { some: { userId } } },
    },
    select: { id: true },
  });
  return !!budget;
}

export async function GET(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const budgetId = searchParams.get("budgetId");
    if (!budgetId) return NextResponse.json({ error: "budgetId required" }, { status: 400 });

    const hasAccess = await checkBudgetAccess(user.id, budgetId);
    if (!hasAccess) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const budget = await prisma.budget.findUnique({
      where: { id: budgetId },
      include: { transactions: true },
    });

    if (!budget) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const totalIncome = budget.transactions
      .filter((t) => t.type === "income")
      .reduce((sum, t) => sum + t.amount, 0);

    const totalExpense = budget.transactions
      .filter((t) => t.type === "expense")
      .reduce((sum, t) => sum + t.amount, 0);

    const balance = totalIncome - totalExpense;
    const remaining = budget.amount - totalExpense;
    const spentPercent = budget.amount > 0 ? (totalExpense / budget.amount) * 100 : 0;

    // Évolution mensuelle (12 derniers mois)
    const now = new Date();
    const monthlyEvolution = [];
    for (let i = 11; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthStr = date.toISOString().slice(0, 7); // YYYY-MM
      const monthTransactions = budget.transactions.filter((t) =>
        t.date.toISOString().startsWith(monthStr)
      );
      const income = monthTransactions
        .filter((t) => t.type === "income")
        .reduce((sum, t) => sum + t.amount, 0);
      const expense = monthTransactions
        .filter((t) => t.type === "expense")
        .reduce((sum, t) => sum + t.amount, 0);
      monthlyEvolution.push({
        month: monthStr,
        income,
        expense,
      });
    }

    // Répartition par catégorie (dépenses uniquement)
    const categoryMap = new Map<string, { name: string; color: string; amount: number }>();
    const expenseTransactions = budget.transactions.filter((t) => t.type === "expense");

    // Récupérer les noms de catégories
    const categoryIds = [...new Set(expenseTransactions.map((t) => t.categoryId).filter(Boolean))];
    const categories = await prisma.budgetCategory.findMany({
      where: { id: { in: categoryIds as string[] } },
    });
    const categoryById = new Map(categories.map((c) => [c.id, c]));

    for (const t of expenseTransactions) {
      const cat = t.categoryId ? categoryById.get(t.categoryId) : null;
      const key = cat?.name ?? "Sans catégorie";
      const existing = categoryMap.get(key);
      if (existing) {
        existing.amount += t.amount;
      } else {
        categoryMap.set(key, {
          name: key,
          color: cat?.color ?? "#9CA3AF",
          amount: t.amount,
        });
      }
    }

    return NextResponse.json({
      totalIncome,
      totalExpense,
      balance,
      remaining,
      spentPercent,
      budgetAmount: budget.amount,
      monthlyEvolution,
      categoryBreakdown: Array.from(categoryMap.values()),
    });
  } catch (error) {
    console.error("[BUDGET_STATS]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
