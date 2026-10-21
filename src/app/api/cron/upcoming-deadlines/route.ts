import { NextResponse } from "next/server";
import { verifyCronSecret } from "@/lib/cron-auth";
import { prisma } from "@/lib/prisma";
import { sendNotificationToUsers } from "@/lib/notifications";
import { addHours, addDays } from "date-fns";

export const maxDuration = 60;

export async function GET(request: Request) {
  const denied = verifyCronSecret(request);
  if (denied) return denied;

  const now = new Date();
  // Tâches qui arrivent à échéance dans les prochaines 24h (bornes incluses)
  const windowStart = now;
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

    // Une seule requête de déduplication plutôt qu'un findFirst par tâche
    const taskLinks = tasks.map((task) => `/task/${task.id}`);
    const existingNotifications =
      taskLinks.length > 0
        ? await prisma.notification.findMany({
            where: {
              type: "taskDueSoon",
              link: { in: taskLinks },
              createdAt: { gte: addHours(now, -24) },
            },
            select: { userId: true, link: true },
          })
        : [];
    const alreadyNotified = new Set(
      existingNotifications.map((notification) => `${notification.userId}:${notification.link}`)
    );

    let notified = 0;
    for (const [userId, userTasks] of userTaskMap) {
      for (const task of userTasks) {
        const dedupeKey = `${userId}:/task/${task.id}`;
        if (alreadyNotified.has(dedupeKey)) continue;

        await sendNotificationToUsers(
          [userId],
          {
            type: "taskDueSoon",
            message: `Échéance dans moins de 24h : « ${task.title} »`,
            link: `/task/${task.id}`,
            title: "⚠️ Échéance proche",
            body: task.title,
            tag: "due-soon",
          }
        );
        alreadyNotified.add(dedupeKey);
        notified++;
      }
    }

    return NextResponse.json({ ok: true, notified, tasksFound: tasks.length });
  } catch (error) {
    console.error("[CRON] Upcoming deadlines error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
