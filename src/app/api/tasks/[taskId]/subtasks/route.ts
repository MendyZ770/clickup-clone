import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth-helpers";
import { createTaskSchema } from "@/lib/validations/task";
import { logActivity } from "@/lib/activity-logger";

interface RouteContext {
  params: Promise<{ taskId: string }>;
}

export async function GET(request: Request, context: RouteContext) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { taskId } = await context.params;

    const subtasks = await prisma.task.findMany({
      where: { parentId: taskId },
      include: {
        status: true,
        assignee: {
          select: { id: true, name: true, email: true, image: true },
        },
        _count: {
          select: { subtasks: true, comments: true },
        },
      },
      orderBy: { position: "asc" },
    });

    return NextResponse.json(subtasks);
  } catch (error) {
    console.error("GET /api/tasks/[id]/subtasks error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request, context: RouteContext) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { taskId } = await context.params;

    // Verify parent task exists and user has access
    const parentTask = await prisma.task.findUnique({
      where: { id: taskId },
      include: {
        list: {
          include: {
            space: {
              include: {
                workspace: {
                  include: { members: { where: { userId: user.id } } },
                },
              },
            },
            statuses: { orderBy: { order: "asc" } },
          },
        },
      },
    });

    if (!parentTask || parentTask.list.space.workspace.members.length === 0) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    const body = await request.json();
    // Override listId and parentId from the parent task
    const dataWithParent = {
      ...body,
      listId: parentTask.listId,
      parentId: taskId,
    };

    const parsed = createTaskSchema.safeParse(dataWithParent);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { title, description, priority, dueDate, statusId, assigneeId } =
      parsed.data;

    // Default to first status
    let taskStatusId = statusId;
    if (!taskStatusId && parentTask.list.statuses.length > 0) {
      taskStatusId = parentTask.list.statuses[0].id;
    }
    if (!taskStatusId) {
      return NextResponse.json(
        { error: "No statuses configured for this list" },
        { status: 400 }
      );
    }

    const lastSubtask = await prisma.task.findFirst({
      where: { parentId: taskId },
      orderBy: { position: "desc" },
    });

    const subtask = await prisma.task.create({
      data: {
        title,
        description: description ?? null,
        priority: priority ?? "normal",
        dueDate: dueDate ? new Date(dueDate) : null,
        position: lastSubtask ? lastSubtask.position + 65536 : 65536,
        listId: parentTask.listId,
        statusId: taskStatusId,
        assigneeId: assigneeId ?? null,
        creatorId: user.id,
        parentId: taskId,
      },
      include: {
        status: true,
        assignee: {
          select: { id: true, name: true, email: true, image: true },
        },
      },
    });

    await logActivity({
      action: "created",
      taskId: subtask.id,
      userId: user.id,
    });

    return NextResponse.json(subtask, { status: 201 });
  } catch (error) {
    console.error("POST /api/tasks/[id]/subtasks error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
