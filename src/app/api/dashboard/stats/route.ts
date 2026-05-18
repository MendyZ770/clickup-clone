import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth-helpers";

export async function GET(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const workspaceId = searchParams.get("workspaceId");

    if (!workspaceId) {
      return NextResponse.json(
        { error: "workspaceId query param is required" },
        { status: 400 }
      );
    }

    // Verify membership
    const membership = await prisma.workspaceMember.findUnique({
      where: {
        workspaceId_userId: { workspaceId, userId: user.id },
      },
    });

    if (!membership) {
      return NextResponse.json(
        { error: "Workspace not found" },
        { status: 404 }
      );
    }

    const now = new Date();
    const endOfWeek = new Date(now);
    endOfWeek.setDate(now.getDate() + (7 - now.getDay()));
    endOfWeek.setHours(23, 59, 59, 999);

    // Common filter for tasks in this workspace
    const workspaceTaskFilter = {
      list: { space: { workspaceId } },
    };

    // ─── Fire all independent queries in parallel ──────────────────
    const [
      totalTasks,
      completedTasks,
      overdueTasks,
      tasksDueThisWeek,
      tasksByStatusRaw,
      tasksByPriorityRaw,
      recentActivities,
      upcomingDeadlines,
    ] = await Promise.all([
      // 1. Total tasks
      prisma.task.count({ where: workspaceTaskFilter }),

      // 2. Completed tasks
      prisma.task.count({
        where: {
          ...workspaceTaskFilter,
          status: { type: { in: ["done", "closed"] } },
        },
      }),

      // 3. Overdue tasks
      prisma.task.count({
        where: {
          ...workspaceTaskFilter,
          dueDate: { lt: now },
          status: { type: { notIn: ["done", "closed"] } },
        },
      }),

      // 4. Tasks due this week
      prisma.task.count({
        where: {
          ...workspaceTaskFilter,
          dueDate: { gte: now, lte: endOfWeek },
          status: { type: { notIn: ["done", "closed"] } },
        },
      }),

      // 5. Tasks grouped by status — single groupBy query
      prisma.task.groupBy({
        by: ["statusId"],
        where: workspaceTaskFilter,
        _count: { id: true },
      }),

      // 6. Tasks grouped by priority — single groupBy query
      prisma.task.groupBy({
        by: ["priority"],
        where: workspaceTaskFilter,
        _count: { id: true },
      }),

      // 7. Recent activities
      prisma.activity.findMany({
        where: {
          task: { list: { space: { workspaceId } } },
        },
        include: {
          user: {
            select: { id: true, name: true, email: true, image: true },
          },
          task: {
            select: { id: true, title: true },
          },
        },
        orderBy: { createdAt: "desc" },
        take: 10,
      }),

      // 8. Upcoming deadlines
      prisma.task.findMany({
        where: {
          ...workspaceTaskFilter,
          dueDate: { gte: now },
          status: { type: { notIn: ["done", "closed"] } },
        },
        include: {
          status: true,
          assignee: {
            select: { id: true, name: true, email: true, image: true },
          },
          list: {
            select: { id: true, name: true },
          },
        },
        orderBy: { dueDate: "asc" },
        take: 5,
      }),
    ]);

    // ─── Post-process groupBy results ──────────────────────────────

    // Resolve status names/colors for the groupBy result
    const statusIds = tasksByStatusRaw.map((s) => s.statusId);
    const statuses = await prisma.status.findMany({
      where: { id: { in: statusIds } },
      select: { id: true, name: true, color: true },
    });
    const statusMap = new Map(statuses.map((s) => [s.id, s]));

    const statusAgg = new Map<string, { name: string; color: string; count: number }>();
    for (const row of tasksByStatusRaw) {
      const s = statusMap.get(row.statusId);
      if (!s) continue;
      const existing = statusAgg.get(s.name);
      if (existing) {
        existing.count += row._count.id;
      } else {
        statusAgg.set(s.name, { name: s.name, color: s.color, count: row._count.id });
      }
    }
    const tasksByStatus = Array.from(statusAgg.values()).filter((s) => s.count > 0);

    // Priority aggregation
    const priorityOrder = ["urgent", "high", "normal", "low"];
    const priorityMap = new Map(tasksByPriorityRaw.map((r) => [r.priority, r._count.id]));
    const tasksByPriority = priorityOrder.map((priority) => ({
      priority,
      count: priorityMap.get(priority) ?? 0,
    }));

    return NextResponse.json(
      {
        totalTasks,
        completedTasks,
        overdueTasks,
        tasksDueThisWeek,
        tasksByStatus,
        tasksByPriority,
        recentActivities,
        upcomingDeadlines,
      },
      {
        headers: {
          "Cache-Control": "private, max-age=30, stale-while-revalidate=300",
        },
      }
    );
  } catch (error) {
    console.error("GET /api/dashboard/stats error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
