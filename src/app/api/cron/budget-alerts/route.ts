import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendNotificationToUsers } from "@/lib/notifications";
import { subHours } from "date-fns";

const CRON_SECRET = process.env.CRON_SECRET;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const secret = searchParams.get("secret") ?? request.headers.get("x-vercel-cron-secret");
  if (!CRON_SECRET || secret !== CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const budgets = await prisma.budget.findMany({
      include: {
        transactions: { select: { type: true, amount: true } },
        workspace: {
          include: {
            members: { select: { userId: true } },
          },
        },
      },
    });

    let alertsSent = 0;

    for (const budget of budgets) {
      const totalExpense = budget.transactions
        .filter((t) => t.type === "expense")
        .reduce((sum, t) => sum + t.amount, 0);

      const percent = budget.amount > 0 ? (totalExpense / budget.amount) * 100 : 0;

      // Alertes à 80% et 100%
      const thresholds = [
        { pct: 100, label: "dépassé", emoji: "🚨" },
        { pct: 80, label: "à 80%", emoji: "⚠️" },
      ];

      for (const threshold of thresholds) {
        if (percent < threshold.pct) continue;

        const memberIds = budget.workspace.members.map((m) => m.userId);
        if (memberIds.length === 0) continue;

        // Éviter les doublons : pas de re-notification dans les 24h
        const existing = await prisma.notification.findFirst({
          where: {
            userId: memberIds[0],
            type: "budgetAlert",
            message: { contains: budget.name },
            createdAt: { gte: subHours(new Date(), 24) },
          },
        });
        if (existing) break; // déjà notifié pour ce budget

        await sendNotificationToUsers(
          memberIds,
          {
            type: "budgetAlert",
            message: `Budget "${budget.name}" ${threshold.label} (${Math.round(percent)}%)`,
            link: `/budget/${budget.id}`,
            title: `${threshold.emoji} Budget ${threshold.label}`,
            body: `"${budget.name}" : ${Math.round(percent)}% utilisé`,
            tag: "budget-alert",
          }
        );
        alertsSent++;
        break; // une seule alerte par budget (la plus haute)
      }
    }

    return NextResponse.json({ ok: true, alertsSent, budgetsChecked: budgets.length });
  } catch (error) {
    console.error("[CRON] Budget alerts error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
