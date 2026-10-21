import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth-helpers";
import { toMoneyNumber } from "@/lib/money";

async function checkBudgetAccess(userId: string, budgetId: string) {
  const budget = await prisma.budget.findFirst({
    where: {
      id: budgetId,
      workspace: { members: { some: { userId } } },
    },
    select: { id: true, workspaceId: true },
  });
  return !!budget;
}

function monthKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
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

    const transactions = budget.transactions.filter((transaction) => !transaction.isTransfer);

    let totalIncome = new Prisma.Decimal(0);
    let totalExpense = new Prisma.Decimal(0);
    for (const transaction of transactions) {
      if (transaction.type === "income") totalIncome = totalIncome.plus(transaction.amount);
      else if (transaction.type === "expense") totalExpense = totalExpense.plus(transaction.amount);
    }

    const balance = totalIncome.minus(totalExpense);
    const remaining = budget.amount.minus(totalExpense);
    const spentPercent = budget.amount.gt(0)
      ? totalExpense.div(budget.amount).times(100).toNumber()
      : 0;

    const now = new Date();
    const monthlyEvolution = [];
    for (let i = 11; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = monthKey(date);
      let income = new Prisma.Decimal(0);
      let expense = new Prisma.Decimal(0);
      for (const transaction of transactions) {
        if (monthKey(transaction.date) !== key) continue;
        if (transaction.type === "income") income = income.plus(transaction.amount);
        else if (transaction.type === "expense") expense = expense.plus(transaction.amount);
      }
      monthlyEvolution.push({
        month: key,
        income: toMoneyNumber(income),
        expense: toMoneyNumber(expense),
      });
    }

    const categoryIds = Array.from(
      new Set(
        transactions
          .filter((transaction) => transaction.type === "expense" && transaction.categoryId)
          .map((transaction) => transaction.categoryId as string)
      )
    );

    const categories = await prisma.budgetCategory.findMany({
      where: { id: { in: categoryIds }, workspaceId: budget.workspaceId },
    });
    const categoryById = new Map(categories.map((category) => [category.id, category]));

    const categoryMap = new Map<string, { name: string; color: string; amount: Prisma.Decimal }>();
    for (const transaction of transactions) {
      if (transaction.type !== "expense") continue;
      const category = transaction.categoryId ? categoryById.get(transaction.categoryId) : null;
      const key = category?.name ?? "Sans catégorie";
      const existing = categoryMap.get(key);
      if (existing) {
        existing.amount = existing.amount.plus(transaction.amount);
      } else {
        categoryMap.set(key, {
          name: key,
          color: category?.color ?? "#9CA3AF",
          amount: new Prisma.Decimal(transaction.amount),
        });
      }
    }

    const subTypeMap = new Map<string, { name: string; amount: Prisma.Decimal; type: string }>();
    for (const transaction of transactions) {
      if (!transaction.subType) continue;
      const existing = subTypeMap.get(transaction.subType);
      if (existing) {
        existing.amount = existing.amount.plus(transaction.amount);
      } else {
        subTypeMap.set(transaction.subType, {
          name: transaction.subType,
          amount: new Prisma.Decimal(transaction.amount),
          type: transaction.type,
        });
      }
    }

    return NextResponse.json({
      totalIncome: toMoneyNumber(totalIncome),
      totalExpense: toMoneyNumber(totalExpense),
      balance: toMoneyNumber(balance),
      remaining: toMoneyNumber(remaining),
      spentPercent,
      budgetAmount: toMoneyNumber(budget.amount),
      monthlyEvolution,
      categoryBreakdown: Array.from(categoryMap.values())
        .map((entry) => ({ ...entry, amount: toMoneyNumber(entry.amount) }))
        .sort((a, b) => b.amount - a.amount),
      subTypeBreakdown: Array.from(subTypeMap.values())
        .map((entry) => ({ ...entry, amount: toMoneyNumber(entry.amount) }))
        .sort((a, b) => b.amount - a.amount),
    });
  } catch (error) {
    console.error("[BUDGET_STATS]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
