import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendNotificationToUsers } from "@/lib/notifications";
import { startOfDay, endOfDay } from "date-fns";

const CRON_SECRET = process.env.CRON_SECRET;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const secret = searchParams.get("secret") ?? request.headers.get("x-vercel-cron-secret");
  if (!CRON_SECRET || secret !== CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  const todayStart = startOfDay(now);
  const todayEnd = endOfDay(now);

  try {
    // Récupérer toutes les tâches dues aujourd'hui, groupées par assigné
    const tasks = await prisma.task.findMany({
      where: {
        dueDate: { gte: todayStart, lte: todayEnd },
        status: { type: { notIn: ["done", "closed"] } },
      },
      include: {
        status: { select: { name: true, type: true } },
        list: { select: { name: true } },
      },
    });

    // Grouper par assigné (assigneeId + multi-assignees)
    const userTaskMap = new Map<string, typeof tasks>();

    for (const task of tasks) {
      if (task.assigneeId) {
        const existing = userTaskMap.get(task.assigneeId) ?? [];
        existing.push(task);
        userTaskMap.set(task.assigneeId, existing);
      }
    }

    // Aussi les multi-assignees
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
      const count = userTasks.length;
      const taskList = userTasks.slice(0, 3).map((t) => `• ${t.title}`).join("\n");
      const more = count > 3 ? `\n+ ${count - 3} autre(s)` : "";

      await sendNotificationToUsers(
        [userId],
        {
          type: "dailySummary",
          message: `${count} tâche${count > 1 ? "s" : ""} à faire aujourd'hui`,
          link: "/my-tasks",
          title: `📋 ${count} tâche${count > 1 ? "s" : ""} aujourd'hui`,
          body: taskList + more,
          tag: "daily-summary",
        }
      );
      notified++;
    }

    return NextResponse.json({ ok: true, usersNotified: notified, tasksFound: tasks.length });
  } catch (error) {
    console.error("[CRON] Daily tasks error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
