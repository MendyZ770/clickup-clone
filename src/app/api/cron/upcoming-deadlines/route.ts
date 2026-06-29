import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendNotificationToUsers } from "@/lib/notifications";
import { addHours, addDays } from "date-fns";

const CRON_SECRET = process.env.CRON_SECRET;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const secret = searchParams.get("secret") ?? request.headers.get("x-vercel-cron-secret");
  if (!CRON_SECRET || secret !== CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  // Tâches qui arrivent à échéance dans les prochaines 24h
  const windowStart = addHours(now, 1);
  const windowEnd = addDays(now, 1);

  try {
    const tasks = await prisma.task.findMany({
      where: {
        dueDate: { gte: windowStart, lte: windowEnd },
        status: { type: { notIn: ["done", "closed"] } },
      },
      include: {
        status: { select: { name: true, type: true } },
        list: { select: { name: true } },
      },
    });

    const userTaskMap = new Map<string, typeof tasks>();

    const multiAssignees = await prisma.taskAssignee.findMany({
      where: { taskId: { in: tasks.map((t) => t.id) } },
      select: { userId: true, taskId: true },
    });
    for (const a of multiAssignees) {
      const task = tasks.find((t) => t.id === a.taskId);
      if (!task) continue;
      const existing = userTaskMap.get(a.userId) ?? [];
      if (!existing.find((t) => t.id === task.id)) existing.push(task);
      userTaskMap.set(a.userId, existing);
    }

    let notified = 0;
    for (const [userId, userTasks] of userTaskMap) {
      for (const task of userTasks) {
        // Éviter les doublons : vérifier si déjà notifié dans les 12h
        const existing = await prisma.notification.findFirst({
          where: {
            userId,
            type: "taskDueSoon",
            link: `/task/${task.id}`,
            createdAt: { gte: addHours(now, -12) },
          },
        });
        if (existing) continue;

        await sendNotificationToUsers(
          [userId],
          {
            type: "taskDueSoon",
            message: `Échéance dans moins de 24h : "${task.title}"`,
            link: `/task/${task.id}`,
            title: "⚠️ Échéance proche",
            body: task.title,
            tag: "due-soon",
          }
        );
        notified++;
      }
    }

    return NextResponse.json({ ok: true, notified, tasksFound: tasks.length });
  } catch (error) {
    console.error("[CRON] Upcoming deadlines error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
