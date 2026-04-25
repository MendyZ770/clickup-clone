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

    // Total tasks
    const totalTasks = await prisma.task.count({
      where: workspaceTaskFilter,
    });

    // Completed tasks (status type = "done" or "closed")
    const completedTasks = await prisma.task.count({
      where: {
        ...workspaceTaskFilter,
        status: { type: { in: ["done", "closed"] } },
      },
    });

    // Overdue tasks
    const overdueTasks = await prisma.task.count({
      where: {
        ...workspaceTaskFilter,
        dueDate: { lt: now },
        status: { type: { notIn: ["done", "closed"] } },
      },
    });

    // Tasks due this week
    const tasksDueThisWeek = await prisma.task.count({
      where: {
        ...workspaceTaskFilter,
        dueDate: { gte: now, lte: endOfWeek },
        status: { type: { notIn: ["done", "closed"] } },
      },
    });

    // Tasks grouped by status (for pie chart)
    const allStatuses = await prisma.status.findMany({
      where: {
        list: { space: { workspaceId } },
      },
      include: {
        _count: { select: { tasks: true } },
      },
    });

    // Aggregate by status name/type
    const statusMap = new Map<string, { name: string; color: string; count: number }>();
    for (const status of allStatuses) {
      const key = status.name;
      const existing = statusMap.get(key);
      if (existing) {
        existing.count += status._count.tasks;
      } else {
        statusMap.set(key, {
          name: status.name,
          color: status.color,
          count: status._count.tasks,
        });
      }
    }
    const tasksByStatus = Array.from(statusMap.values()).filter(
      (s) => s.count > 0
    );

    // Tasks grouped by priority (for bar chart)
    const priorities = ["urgent", "high", "normal", "low"];
    const tasksByPriority = await Promise.all(
      priorities.map(async (priority) => {
        const count = await prisma.task.count({
          where: {
            ...workspaceTaskFilter,
            priority,
          },
        });
        return { priority, count };
      })
    );

    // Recent activities (last 10)
    const recentActivities = await prisma.activity.findMany({
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
    });

    // Upcoming deadlines (next 5 tasks with due dates)
    const upcomingDeadlines = await prisma.task.findMany({
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
    });

    return NextResponse.json({
      totalTasks,
      completedTasks,
      overdueTasks,
      tasksDueThisWeek,
      tasksByStatus,
      tasksByPriority,
      recentActivities,
      upcomingDeadlines,
    });
  } catch (error) {
    console.error("GET /api/dashboard/stats error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
