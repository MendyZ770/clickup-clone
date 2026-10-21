import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, isWorkspaceMember } from "@/lib/auth-helpers";
import { toMoneyNumber } from "@/lib/money";

interface CurrencyTotals {
  income: Prisma.Decimal;
  expense: Prisma.Decimal;
}

interface GoalTotals {
  count: number;
  target: Prisma.Decimal;
  saved: Prisma.Decimal;
}

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

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfNextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);

    const accounts = await prisma.financeAccount.findMany({
      where: { workspaceId, userId: user.id },
      select: { id: true, currency: true, balance: true },
    });

    const accountCurrency = new Map(accounts.map((account) => [account.id, account.currency]));

    const balancesByCurrency = new Map<string, Prisma.Decimal>();
    for (const account of accounts) {
      const current = balancesByCurrency.get(account.currency) ?? new Prisma.Decimal(0);
      balancesByCurrency.set(account.currency, current.plus(account.balance));
    }

    let primaryCurrency = "EUR";
    if (balancesByCurrency.size === 1) {
      primaryCurrency = Array.from(balancesByCurrency.keys())[0];
    } else if (balancesByCurrency.size > 1) {
      primaryCurrency = Array.from(balancesByCurrency.entries())
        .sort((a, b) => b[1].abs().comparedTo(a[1].abs()))[0][0];
    }

    const monthlySums = await prisma.financeTransaction.groupBy({
      by: ["accountId", "type"],
      where: {
        userId: user.id,
        account: { workspaceId },
        isTransfer: false,
        date: { gte: startOfMonth, lt: startOfNextMonth },
      },
      _sum: { amount: true },
    });

    const monthlyByCurrency = new Map<string, CurrencyTotals>();
    for (const row of monthlySums) {
      const currency = accountCurrency.get(row.accountId);
      if (!currency) continue;
      if (row.type !== "income" && row.type !== "expense") continue;

      const totals =
        monthlyByCurrency.get(currency) ??
        { income: new Prisma.Decimal(0), expense: new Prisma.Decimal(0) };
      const sum = row._sum.amount ?? new Prisma.Decimal(0);
      if (row.type === "income") totals.income = totals.income.plus(sum);
      else totals.expense = totals.expense.plus(sum);
      monthlyByCurrency.set(currency, totals);
    }

    const primaryMonthly =
      monthlyByCurrency.get(primaryCurrency) ??
      { income: new Prisma.Decimal(0), expense: new Prisma.Decimal(0) };

    const categorySums = await prisma.financeTransaction.groupBy({
      by: ["categoryId", "accountId"],
      where: {
        userId: user.id,
        account: { workspaceId },
        type: "expense",
        isTransfer: false,
        date: { gte: startOfMonth, lt: startOfNextMonth },
      },
      _sum: { amount: true },
    });

    const categoryAmounts = new Map<string | null, Prisma.Decimal>();
    for (const row of categorySums) {
      if (accountCurrency.get(row.accountId) !== primaryCurrency) continue;
      const current = categoryAmounts.get(row.categoryId) ?? new Prisma.Decimal(0);
      categoryAmounts.set(row.categoryId, current.plus(row._sum.amount ?? 0));
    }

    const categoryIds = Array.from(categoryAmounts.keys()).filter(
      (id): id is string => id !== null
    );
    const categories = await prisma.financeCategory.findMany({
      where: { workspaceId, id: { in: categoryIds } },
    });
    const categoryById = new Map(categories.map((category) => [category.id, category]));

    const categoryBreakdown = Array.from(categoryAmounts.entries())
      .map(([categoryId, amount]) => ({
        categoryId,
        amount: toMoneyNumber(amount),
        category: categoryId ? categoryById.get(categoryId) ?? null : null,
      }))
      .sort((a, b) => b.amount - a.amount);

    const goals = await prisma.financeGoal.findMany({
      where: { workspaceId, userId: user.id },
      select: { currency: true, targetAmount: true, currentAmount: true },
    });

    const goalsByCurrencyMap = new Map<string, GoalTotals>();
    for (const goal of goals) {
      const totals =
        goalsByCurrencyMap.get(goal.currency) ??
        { count: 0, target: new Prisma.Decimal(0), saved: new Prisma.Decimal(0) };
      totals.count += 1;
      totals.target = totals.target.plus(goal.targetAmount);
      totals.saved = totals.saved.plus(goal.currentAmount);
      goalsByCurrencyMap.set(goal.currency, totals);
    }

    const primaryGoals =
      goalsByCurrencyMap.get(primaryCurrency) ??
      { count: 0, target: new Prisma.Decimal(0), saved: new Prisma.Decimal(0) };

    const balances = Array.from(balancesByCurrency.entries())
      .map(([currency, balance]) => ({ currency, balance: toMoneyNumber(balance) }))
      .sort((a, b) => Math.abs(b.balance) - Math.abs(a.balance));

    const monthlyByCurrencyResponse = Array.from(monthlyByCurrency.entries()).map(
      ([currency, totals]) => ({
        currency,
        income: toMoneyNumber(totals.income),
        expense: toMoneyNumber(totals.expense),
        net: toMoneyNumber(totals.income.minus(totals.expense)),
      })
    );

    const goalsByCurrency = Array.from(goalsByCurrencyMap.entries()).map(
      ([currency, totals]) => ({
        currency,
        count: totals.count,
        totalTarget: toMoneyNumber(totals.target),
        totalSaved: toMoneyNumber(totals.saved),
        progress: totals.target.gt(0)
          ? Math.round(totals.saved.div(totals.target).times(100).toNumber())
          : 0,
      })
    );

    return NextResponse.json({
      currency: primaryCurrency,
      totalBalance: toMoneyNumber(
        balancesByCurrency.get(primaryCurrency) ?? new Prisma.Decimal(0)
      ),
      balances,
      accountsCount: accounts.length,
      monthlyIncome: toMoneyNumber(primaryMonthly.income),
      monthlyExpense: toMoneyNumber(primaryMonthly.expense),
      monthlyNet: toMoneyNumber(primaryMonthly.income.minus(primaryMonthly.expense)),
      monthlyByCurrency: monthlyByCurrencyResponse,
      categoryBreakdown,
      goalsCount: goals.length,
      totalTarget: toMoneyNumber(primaryGoals.target),
      totalSaved: toMoneyNumber(primaryGoals.saved),
      goalsProgress: primaryGoals.target.gt(0)
        ? Math.round(primaryGoals.saved.div(primaryGoals.target).times(100).toNumber())
        : 0,
      goalsByCurrency,
    });
  } catch (error) {
    console.error("[FINANCE_STATS_GET]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
