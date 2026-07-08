import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth-helpers";
import { evaluateAutomations } from "@/lib/automation-engine";
import { createTaskSchema } from "@/lib/validations/task";
import { logActivity } from "@/lib/activity-logger";
import { triggerCalendarSync } from "@/lib/calendar-sync";
import { pusherServer } from "@/lib/pusher-server";
import { Prisma } from "@prisma/client";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const listId = searchParams.get("listId");
    const spaceId = searchParams.get("spaceId");
    const workspaceId = searchParams.get("workspaceId");
    const statusId = searchParams.get("statusId");
    const priority = searchParams.get("priority");
    const assigneeId = searchParams.get("assigneeId");
    const search = searchParams.get("search");
    const sortBy = searchParams.get("sortBy") ?? "position";
    const sortOrder = searchParams.get("sortOrder") ?? "asc";

    if (!listId && !spaceId && !workspaceId) {
      return NextResponse.json(
        { error: "listId, spaceId, or workspaceId query param is required" },
        { status: 400 }
      );
    }

    // Build where clause
    const where: Prisma.TaskWhereInput = {
      parentId: null, // Only top-level tasks
    };

    if (listId) {
      const listAccess = await prisma.list.findUnique({
        where: { id: listId },
        include: { space: { include: { workspace: { include: { members: { where: { userId: user.id } } } } } } },
      });
      if (!listAccess || listAccess.space.workspace.members.length === 0) {
        return NextResponse.json({ error: "Unauthorized access to list" }, { status: 403 });
      }
      where.listId = listId;
    } else if (spaceId) {
      const spaceAccess = await prisma.space.findUnique({
        where: { id: spaceId },
        include: { workspace: { include: { members: { where: { userId: user.id } } } } },
      });
      if (!spaceAccess || spaceAccess.workspace.members.length === 0) {
        return NextResponse.json({ error: "Unauthorized access to space" }, { status: 403 });
      }
      where.list = { spaceId };
    } else if (workspaceId) {
      const workspaceAccess = await prisma.workspaceMember.findUnique({
        where: { workspaceId_userId: { workspaceId, userId: user.id } },
      });
      if (!workspaceAccess) {
        return NextResponse.json({ error: "Unauthorized access to workspace" }, { status: 403 });
      }
      where.list = { space: { workspaceId } };
    }

    if (statusId) {
      // Pour le Kanban global, le statusId passé pourrait être un nom de statut. 
      // Si c'est le cas, on doit adapter le filtre ou s'attendre à recevoir une liste de statusIds ?
      // Dans ClickUp, le drag&drop filtre par statusId si listId, mais si global, c'est différent.
      // Pour l'instant, gardons le where.statusId tel quel, on changera le hook pour passer un tableau ou adapter.
      where.statusId = statusId;
    }
    if (priority) where.priority = priority;
    if (assigneeId) {
      const assigneeIds = assigneeId.split(",").filter(Boolean);
      if (assigneeIds.length > 0) {
        where.assignees = {
          some: { userId: { in: assigneeIds } }
        };
      }
    }
    if (search) {
      where.OR = [
        { title: { contains: search } },
        { description: { contains: search } },
      ];
    }

    // Build orderBy
    const validSortFields = [
      "position",
      "title",
      "priority",
      "dueDate",
      "createdAt",
      "updatedAt",
    ];
    const orderField = validSortFields.includes(sortBy) ? sortBy : "position";
    const orderDir = sortOrder === "desc" ? "desc" : "asc";

    const tasks = await prisma.task.findMany({
      where,
      include: {
        status: true,
        assignees: {
          include: {
            user: { select: { id: true, name: true, email: true, image: true } }
          }
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
      orderBy: { [orderField]: orderDir },
    });

    return NextResponse.json(tasks);
  } catch (error) {
    console.error("GET /api/tasks error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const parsed = createTaskSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const {
      title,
      description,
      priority,
      dueDate,
      startDate,
      timeEstimate,
      listId,
      statusId,
      assigneeIds,
      parentId,
      position,
    } = parsed.data;

    // Verify list exists and user has access
    const list = await prisma.list.findUnique({
      where: { id: listId },
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
    });

    if (!list || list.space.workspace.members.length === 0) {
      return NextResponse.json({ error: "List not found" }, { status: 404 });
    }

    // Determine status: use provided or first status of the list
    let taskStatusId = statusId;
    if (!taskStatusId) {
      if (list.statuses.length === 0) {
        return NextResponse.json(
          { error: "List has no statuses configured" },
          { status: 400 }
        );
      }
      taskStatusId = list.statuses[0].id;
    }

    // Calculate position if not provided
    let taskPosition = position;
    if (taskPosition === undefined) {
      const lastTask = await prisma.task.findFirst({
        where: { listId, statusId: taskStatusId },
        orderBy: { position: "desc" },
      });
      taskPosition = lastTask ? lastTask.position + 65536 : 65536;
    }

    const task = await prisma.task.create({
      data: {
        title,
        description: description ?? null,
        priority: priority ?? "normal",
        dueDate: dueDate ? new Date(dueDate) : null,
        startDate: startDate ? new Date(startDate) : null,
        timeEstimate: timeEstimate ?? null,
        position: taskPosition,
        listId,
        statusId: taskStatusId,
        creatorId: user.id,
        parentId: parentId ?? null,
        assignees: assigneeIds && assigneeIds.length > 0 ? {
          create: assigneeIds.map(id => ({ userId: id }))
        } : undefined,
      },
      include: {
        status: true,
        assignees: {
          include: {
            user: { select: { id: true, name: true, email: true, image: true } }
          }
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

    // Log activity
    await logActivity({
      action: "created",
      taskId: task.id,
      userId: user.id,
    });

    // Trigger calendar sync if task has a due date
    if (task.dueDate) {
      triggerCalendarSync();
    }

    try {
      await pusherServer.trigger(
        `workspace-${list.space.workspace.id}`,
        "task:created",
        task
      );
    } catch (e) {
      console.error("Pusher error:", e);
    }

    return NextResponse.json(task, { status: 201 });
  } catch (error) {
    console.error("POST /api/tasks error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
