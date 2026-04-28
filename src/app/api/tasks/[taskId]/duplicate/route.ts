import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth-helpers";
import { logActivity } from "@/lib/activity-logger";

interface RouteContext {
  params: Promise<{ taskId: string }>;
}

export async function POST(request: Request, context: RouteContext) {
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
        checklists: {
          include: { items: { orderBy: { order: "asc" } } },
        },
        taskTags: true,
      },
    });

    if (!task || task.list.space.workspace.members.length === 0) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    const body = await request.json().catch(() => ({}));
    const targetListId = body.listId ?? task.listId;

    const lastTask = await prisma.task.findFirst({
      where: { listId: targetListId, statusId: task.statusId },
      orderBy: { position: "desc" },
    });

    const duplicate = await prisma.task.create({
      data: {
        title: `${task.title} (copie)`,
        description: task.description,
        priority: task.priority,
        dueDate: task.dueDate,
        position: lastTask ? lastTask.position + 65536 : 65536,
        listId: targetListId,
        statusId: task.statusId,
        assigneeId: task.assigneeId,
        creatorId: user.id,
        parentId: task.parentId,
      },
      include: {
        status: true,
        assignee: {
          select: { id: true, name: true, email: true, image: true },
        },
      },
    });

    // Duplicate checklists
    for (const checklist of task.checklists) {
      const newChecklist = await prisma.checklist.create({
        data: {
          title: checklist.title,
          order: checklist.order,
          taskId: duplicate.id,
        },
      });
      for (const item of checklist.items) {
        await prisma.checklistItem.create({
          data: {
            text: item.text,
            completed: false,
            order: item.order,
            checklistId: newChecklist.id,
          },
        });
      }
    }

    // Duplicate tags
    for (const tt of task.taskTags) {
      await prisma.taskTag.create({
        data: {
          taskId: duplicate.id,
          tagId: tt.tagId,
        },
      });
    }

    await logActivity({
      action: "created",
      taskId: duplicate.id,
      userId: user.id,
      field: "duplicate",
      oldValue: task.title,
      newValue: duplicate.title,
    });

    return NextResponse.json(duplicate, { status: 201 });
  } catch (error) {
    console.error("POST /api/tasks/[taskId]/duplicate error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
