import { NextResponse } from "next/server";
import { verifyCronSecret } from "@/lib/cron-auth";
import { prisma } from "@/lib/prisma";
import { sendReminderEmail } from "@/lib/email";
import { sendNotificationToUsers } from "@/lib/notifications";

export const maxDuration = 60;

const CLAIM_TTL_MS = 15 * 60 * 1000;
const BATCH_SIZE = 100;

export async function GET(request: Request) {
  const denied = verifyCronSecret(request);
  if (denied) return denied;

  const now = new Date();
  const staleClaim = new Date(now.getTime() - CLAIM_TTL_MS);

  try {
    const reminders = await prisma.reminder.findMany({
      where: {
        completed: false,
        remindAt: { lte: now },
        OR: [
          { lastNotifiedAt: null },
          { lastNotifiedAt: { lt: staleClaim } },
        ],
      },
      include: {
        user: { select: { id: true, name: true, email: true } },
        task: { select: { id: true, title: true } },
      },
      orderBy: { remindAt: "asc" },
      take: BATCH_SIZE,
    });

    let sent = 0;
    let skipped = 0;
    let failed = 0;

    for (const reminder of reminders) {
      // Revendication atomique : empêche deux exécutions simultanées d'envoyer
      // le même rappel. Un claim plus vieux que CLAIM_TTL_MS est repris pour
      // rattraper un crash survenu entre l'envoi et la complétion.
      const claim = await prisma.reminder.updateMany({
        where: {
          id: reminder.id,
          completed: false,
          OR: [
            { lastNotifiedAt: null },
            { lastNotifiedAt: { lt: staleClaim } },
          ],
        },
        data: { lastNotifiedAt: now },
      });

      if (claim.count === 0) {
        skipped++;
        continue;
      }

      try {
        const message = reminder.description
          ? `${reminder.title} — ${reminder.description}`
          : reminder.title;
        const pushUrl = reminder.taskId ? `/task/${reminder.taskId}` : "/reminders";

        await sendNotificationToUsers([reminder.userId], {
          type: "reminder",
          message,
          link: pushUrl,
          title: "⏰ Rappel",
          body: message,
          tag: "reminder",
        });

        if (reminder.user?.email) {
          sendReminderEmail({
            to: reminder.user.email,
            title: reminder.title,
            description: reminder.description,
            taskTitle: reminder.task?.title,
            taskId: reminder.task?.id,
          }).catch((err) => console.error("[CRON] Email send failed:", err));
        }

        await prisma.reminder.update({
          where: { id: reminder.id },
          data: { completed: true },
        });
        sent++;
      } catch (error) {
        failed++;
        console.error(`[CRON] Reminder ${reminder.id} failed:`, error);
        await prisma.reminder.updateMany({
          where: { id: reminder.id, completed: false },
          data: { lastNotifiedAt: null },
        });
      }
    }

    return NextResponse.json({
      ok: true,
      processed: reminders.length,
      notificationsCreated: sent,
      skipped,
      failed,
    });
  } catch (error) {
    console.error("[CRON] Reminders error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
