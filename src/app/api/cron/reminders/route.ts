import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { addMinutes } from "date-fns";
import { sendReminderEmail } from "@/lib/email";

const CRON_SECRET = process.env.CRON_SECRET;

export async function GET(request: Request) {
  // Auth by secret (Vercel Cron or manual curl)
  const { searchParams } = new URL(request.url);
  const secret = searchParams.get("secret") ?? request.headers.get("x-vercel-cron-secret");

  if (!CRON_SECRET || secret !== CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  const windowEnd = addMinutes(now, 5);

  try {
    // Find reminders due within next 5 minutes that are not completed
    const reminders = await prisma.reminder.findMany({
      where: {
        completed: false,
        remindAt: {
          lte: windowEnd,
        },
      },
      include: {
        user: { select: { id: true, name: true, email: true } },
        task: { select: { id: true, title: true } },
        workspace: { select: { id: true, name: true } },
      },
    });

    let created = 0;
    let skipped = 0;

    for (const reminder of reminders) {
      // Check if a notification already exists for this reminder
      const existing = await prisma.notification.findFirst({
        where: {
          userId: reminder.userId,
          type: "reminder",
          link: `/task/${reminder.taskId}`,
          createdAt: {
            gte: new Date(now.getTime() - 10 * 60 * 1000), // last 10 minutes
          },
        },
      });

      if (existing) {
        skipped++;
        continue;
      }

      // Create notification
      const message = reminder.description
        ? `${reminder.title} — ${reminder.description}`
        : reminder.title;

      await prisma.notification.create({
        data: {
          userId: reminder.userId,
          type: "reminder",
          message,
          link: reminder.taskId ? `/task/${reminder.taskId}` : undefined,
          read: false,
        },
      });

      // Send email notification (non-blocking)
      if (reminder.user?.email) {
        sendReminderEmail({
          to: reminder.user.email,
          title: reminder.title,
          description: reminder.description,
          taskTitle: reminder.task?.title,
          taskId: reminder.task?.id,
        }).catch((err) => console.error("[CRON] Email send failed:", err));
      }

      // Mark reminder as completed (since we notified)
      await prisma.reminder.update({
        where: { id: reminder.id },
        data: { completed: true },
      });

      created++;
    }

    return NextResponse.json({
      ok: true,
      processed: reminders.length,
      notificationsCreated: created,
      skipped,
      checkedAt: now.toISOString(),
    });
  } catch (error) {
    console.error("[CRON] Reminders error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
