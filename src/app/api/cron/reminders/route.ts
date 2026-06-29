import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { addMinutes, subMinutes } from "date-fns";
import { sendReminderEmail } from "@/lib/email";
import { sendNotificationToUsers } from "@/lib/notifications";

const CRON_SECRET = process.env.CRON_SECRET;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const secret = searchParams.get("secret") ?? request.headers.get("x-vercel-cron-secret");
  if (!CRON_SECRET || secret !== CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  const windowStart = subMinutes(now, 2);
  const windowEnd = addMinutes(now, 5);

  try {
    const reminders = await prisma.reminder.findMany({
      where: { completed: false, remindAt: { gte: windowStart, lte: windowEnd } },
      include: {
        user: { select: { id: true, name: true, email: true } },
        task: { select: { id: true, title: true } },
        workspace: { select: { id: true, name: true } },
      },
    });

    let created = 0;
    let skipped = 0;

    for (const reminder of reminders) {
      const existing = await prisma.notification.findFirst({
        where: {
          userId: reminder.userId,
          type: "reminder",
          link: reminder.taskId ? `/task/${reminder.taskId}` : null,
          createdAt: { gte: new Date(now.getTime() - 10 * 60 * 1000) },
        },
      });

      if (existing) { skipped++; continue; }

      const message = reminder.description
        ? `${reminder.title} — ${reminder.description}`
        : reminder.title;
      const pushUrl = reminder.taskId ? `/task/${reminder.taskId}` : "/reminders";

      // Notif en base + push (FCM + web)
      await sendNotificationToUsers(
        [reminder.userId],
        {
          type: "reminder",
          message,
          link: pushUrl,
          title: "⏰ Rappel",
          body: message,
          tag: "reminder",
        }
      );

      // Email (non-bloquant)
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

      created++;
    }

    const { count: cleanedUp } = await prisma.reminder.updateMany({
      where: { completed: false, remindAt: { lt: subMinutes(now, 60) } },
      data: { completed: true },
    });

    return NextResponse.json({ ok: true, processed: reminders.length, notificationsCreated: created, skipped, cleanedUp });
  } catch (error) {
    console.error("[CRON] Reminders error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
