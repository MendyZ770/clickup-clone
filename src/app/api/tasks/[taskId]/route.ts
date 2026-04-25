import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth-helpers";
import { updateTaskSchema } from "@/lib/validations/task";
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

    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: {
        status: true,
        assignee: {
          select: { id: true, name: true, email: true, image: true },
        },
        creator: {
          select: { id: true, name: true, email: true, image: true },
        },
        subtasks: {
          include: {
            status: true,
            assignee: {
              select: { id: true, name: true, email: true, image: true },
            },
          },
          orderBy: { position: "asc" },
        },
        checklists: {
          include: {
            items: { orderBy: { order: "asc" } },
          },
          orderBy: { order: "asc" },
        },
        comments: {
          include: {
            user: {
              select: { id: true, name: true, email: true, image: true },
            },
          },
          orderBy: { createdAt: "desc" },
        },
        activities: {
          include: {
            user: {
              select: { id: true, name: true, email: true, image: true },
            },
          },
          orderBy: { createdAt: "desc" },
        },
        taskTags: {
          include: { tag: true },
        },
        list: {
          include: {
            space: {
              include: {
                workspace: {
                  include: { members: { where: { userId: user.id } } },
                },
              },
            },
          },
        },
        _count: {
          select: { subtasks: true, comments: true },
        },
      },
    });

    if (!task || task.list.space.workspace.members.length === 0) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    // Remove nested access-check data from response
    const { list: _list, ...taskData } = task;
    void _list;
    return NextResponse.json({ ...taskData, listId: task.listId });
  } catch (error) {
    console.error("GET /api/tasks/[id] error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { taskId } = await context.params;

    // Fetch existing task
    const existingTask = await prisma.task.findUnique({
      where: { id: taskId },
      include: {
        status: true,
        list: {
          include: {
            space: {
              include: {
                workspace: {
                  include: { members: { where: { userId: user.id } } },
                },
              },
            },
          },
        },
      },
    });

    if (!existingTask || existingTask.list.space.workspace.members.length === 0) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    const body = await request.json();
    const parsed = updateTaskSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const updateData: Record<string, unknown> = {};
    const activities: Array<{ field: string; oldValue: string; newValue: string }> = [];

    const data = parsed.data;

    if (data.title !== undefined && data.title !== existingTask.title) {
      updateData.title = data.title;
      activities.push({
        field: "title",
        oldValue: existingTask.title,
        newValue: data.title,
      });
    }

    if (data.description !== undefined && data.description !== existingTask.description) {
      updateData.description = data.description ?? null;
      activities.push({
        field: "description",
        oldValue: existingTask.description ?? "",
        newValue: data.description ?? "",
      });
    }

    if (data.priority !== undefined && data.priority !== existingTask.priority) {
      updateData.priority = data.priority;
      activities.push({
        field: "priority",
        oldValue: existingTask.priority,
        newValue: data.priority,
      });
    }

    if (data.dueDate !== undefined) {
      const newDue = data.dueDate ? new Date(data.dueDate) : null;
      const oldDue = existingTask.dueDate;
      if (newDue?.toISOString() !== oldDue?.toISOString()) {
        updateData.dueDate = newDue;
        activities.push({
          field: "dueDate",
          oldValue: oldDue?.toISOString() ?? "",
          newValue: newDue?.toISOString() ?? "",
        });
      }
    }

    if (data.statusId !== undefined && data.statusId !== existingTask.statusId) {
      const newStatus = await prisma.status.findUnique({
        where: { id: data.statusId },
      });
      updateData.statusId = data.statusId;
      activities.push({
        field: "status",
        oldValue: existingTask.status.name,
        newValue: newStatus?.name ?? data.statusId,
      });
    }

    if (data.assigneeId !== undefined && data.assigneeId !== existingTask.assigneeId) {
      updateData.assigneeId = data.assigneeId ?? null;

      let oldAssigneeName = "Unassigned";
      let newAssigneeName = "Unassigned";

      if (existingTask.assigneeId) {
        const oldAssignee = await prisma.user.findUnique({
          where: { id: existingTask.assigneeId },
          select: { name: true },
        });
        oldAssigneeName = oldAssignee?.name ?? "Unknown";
      }

      if (data.assigneeId) {
        const newAssignee = await prisma.user.findUnique({
          where: { id: data.assigneeId },
          select: { name: true },
        });
        newAssigneeName = newAssignee?.name ?? "Unknown";
      }

      activities.push({
        field: "assignee",
        oldValue: oldAssigneeName,
        newValue: newAssigneeName,
      });

      // Notify new assignee
      if (data.assigneeId && data.assigneeId !== user.id) {
        await prisma.notification.create({
          data: {
            type: "assigned",
            message: `You were assigned to task "${existingTask.title}"`,
            link: `/tasks/${taskId}`,
            userId: data.assigneeId,
          },
        });
      }
    }

    if (data.position !== undefined) {
      updateData.position = data.position;
    }

    if (data.listId !== undefined && data.listId !== existingTask.listId) {
      updateData.listId = data.listId;
      activities.push({
        field: "list",
        oldValue: existingTask.listId,
        newValue: data.listId,
      });
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(existingTask);
    }

    const updatedTask = await prisma.task.update({
      where: { id: taskId },
      data: updateData,
      include: {
        status: true,
        assignee: {
          select: { id: true, name: true, email: true, image: true },
        },
        creator: {
          select: { id: true, name: true, email: true, image: true },
        },
        taskTags: {
          include: { tag: true },
        },
        _count: {
          select: { subtasks: true, comments: true },
        },
      },
    });

    // Log all field changes
    for (const activity of activities) {
      await logActivity({
        action: "updated",
        taskId,
        userId: user.id,
        field: activity.field,
        oldValue: activity.oldValue,
        newValue: activity.newValue,
      });
    }

    return NextResponse.json(updatedTask);
  } catch (error) {
    console.error("PATCH /api/tasks/[id] error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request, context: RouteContext) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { taskId } = await context.params;

    const task = await prisma.task.findUnique({
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
          },
        },
      },
    });

    if (!task || task.list.space.workspace.members.length === 0) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    // Log activity before deletion
    await logActivity({
      action: "deleted",
      taskId,
      userId: user.id,
      field: "task",
      oldValue: task.title,
      newValue: "",
    });

    await prisma.task.delete({ where: { id: taskId } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/tasks/[id] error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
