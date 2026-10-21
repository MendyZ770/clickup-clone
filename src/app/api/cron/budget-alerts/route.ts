import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { verifyCronSecret } from "@/lib/cron-auth";
import { prisma } from "@/lib/prisma";
import { sendNotificationToUsers } from "@/lib/notifications";
import { addMonths, startOfMonth } from "date-fns";

export const maxDuration = 60;

const DEFAULT_THRESHOLDS = [80, 100];

export async function GET(request: Request) {
  const denied = verifyCronSecret(request);
  if (denied) return denied;

  const now = new Date();
  const monthStart = startOfMonth(now);
  const monthEnd = addMonths(monthStart, 1);

  try {
    // Les alertes portent sur le mois en cours, pas sur tout l'historique
    const budgets = await prisma.budget.findMany({
      include: {
        alerts: {
          where: { isActive: true },
          select: { threshold: true },
        },
        workspace: {
          include: {
            members: { select: { userId: true } },
          },
        },
      },
    });

    const expenseSums = await prisma.budgetTransaction.groupBy({
      by: ["budgetId"],
      where: {
        budgetId: { in: budgets.map((budget) => budget.id) },
        date: { gte: monthStart, lt: monthEnd },
        isTransfer: false,
        type: "expense",
      },
      _sum: { amount: true },
    });

    const expenseByBudget = new Map(
      expenseSums.map((row) => [row.budgetId, row._sum.amount ?? new Prisma.Decimal(0)])
    );

    let alertsSent = 0;
    let usersNotified = 0;

    for (const budget of budgets) {
      if (budget.amount.lte(0)) continue;

      const totalExpense = expenseByBudget.get(budget.id) ?? new Prisma.Decimal(0);
      const percent = totalExpense.div(budget.amount).times(100).toNumber();

      const configuredThresholds = budget.alerts
        .map((alert) => alert.threshold)
        .filter((threshold): threshold is Prisma.Decimal => threshold !== null)
        .map((threshold) => threshold.toNumber());
      const thresholds = (
        configuredThresholds.length > 0 ? configuredThresholds : DEFAULT_THRESHOLDS
      )
        .filter((threshold) => threshold > 0)
        .sort((a, b) => a - b);

      const crossedThresholds = thresholds.filter(
        (threshold) => percent >= threshold
      );
      if (crossedThresholds.length === 0) continue;

      // Une seule alerte par exécution, pour le seuil le plus élevé atteint
      const threshold = crossedThresholds[crossedThresholds.length - 1];
      const memberIds = budget.workspace.members.map((member) => member.userId);
      if (memberIds.length === 0) continue;

      const budgetLink = `/budget/${budget.id}`;
      const thresholdKey = `seuil de ${threshold}%`;

      // Idempotence par membre, budget, mois et seuil (le lien est unique)
      const alreadyNotified = await prisma.notification.findMany({
        where: {
          userId: { in: memberIds },
          type: "budgetAlert",
          link: budgetLink,
          message: { contains: thresholdKey },
          createdAt: { gte: monthStart },
        },
        select: { userId: true },
      });
      const notifiedIds = new Set(
        alreadyNotified.map((notification) => notification.userId)
      );
      const recipients = memberIds.filter((userId) => !notifiedIds.has(userId));
      if (recipients.length === 0) continue;

      const exceeded = threshold >= 100;
      await sendNotificationToUsers(
        recipients,
        {
          type: "budgetAlert",
          message: `Budget « ${budget.name} » : ${thresholdKey} atteint (${Math.round(percent)}% utilisé)`,
          link: budgetLink,
          title: exceeded ? "🚨 Budget dépassé" : "⚠️ Budget presque atteint",
          body: `« ${budget.name} » : ${Math.round(percent)}% du budget mensuel utilisé`,
          tag: "budget-alert",
        }
      );

      alertsSent++;
      usersNotified += recipients.length;
    }

    return NextResponse.json({
      ok: true,
      alertsSent,
      usersNotified,
      budgetsChecked: budgets.length,
      period: `${monthStart.getFullYear()}-${String(
        monthStart.getMonth() + 1
      ).padStart(2, "0")}`,
    });
  } catch (error) {
    console.error("[CRON] Budget alerts error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
