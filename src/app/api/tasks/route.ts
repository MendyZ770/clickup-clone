import { NextResponse } from "next/server";
import { workspaceChannelName } from "@/lib/pusher-channels";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth-helpers";
import { evaluateAutomations } from "@/lib/automation-engine";
import { createTaskSchema } from "@/lib/validations/task";
import { logActivity } from "@/lib/activity-logger";
import { triggerCalendarSync } from "@/lib/calendar-sync";
import { pusherServer } from "@/lib/pusher-server";
import { sendNotificationToUsers } from "@/lib/notifications";
import { Prisma } from "@prisma/client";

export const dynamic = "force-dynamic";

const taskResponseInclude = {
  status: true,
  assignees: {
    include: {
      user: { select: { id: true, name: true, email: true, image: true } },
    },
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
} satisfies Prisma.TaskInclude;

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
    const dateFilter = searchParams.get("dateFilter");
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
    if (dateFilter) {
      const now = new Date();
      const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const endOfDay = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000 - 1);
      const weekStartOffset = (startOfDay.getDay() + 6) % 7; // Monday = 0
      const startOfWeek = new Date(startOfDay.getTime() - weekStartOffset * 24 * 60 * 60 * 1000);
      const startOfNextWeek = new Date(startOfWeek.getTime() + 7 * 24 * 60 * 60 * 1000);
      const endOfWeek = new Date(startOfNextWeek.getTime() - 1);
      const endOfNextWeek = new Date(startOfNextWeek.getTime() + 7 * 24 * 60 * 60 * 1000 - 1);

      switch (dateFilter) {
        case "overdue":
          where.dueDate = { lt: startOfDay };
          break;
        case "today":
          where.dueDate = { gte: startOfDay, lte: endOfDay };
          break;
        case "this_week":
          where.dueDate = { gte: startOfWeek, lte: endOfWeek };
          break;
        case "next_week":
          where.dueDate = { gte: startOfNextWeek, lte: endOfNextWeek };
          break;
        case "no_date":
          where.dueDate = null;
          break;
      }
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

    const tasksWithoutPin = tasks.map(({ lockedPin: _lockedPin, ...task }) => {
      void _lockedPin;
      return task;
    });
    return NextResponse.json(tasksWithoutPin);
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

    if (parentId) {
      const parent = await prisma.task.findFirst({
        where: {
          id: parentId,
          list: { space: { workspaceId: list.space.workspaceId } },
        },
        select: { id: true },
      });
      if (!parent) {
        return NextResponse.json(
          { error: "Tâche parente introuvable dans ce workspace" },
          { status: 400 }
        );
      }
    }

    const uniqueAssigneeIds = [...new Set(assigneeIds ?? [])];
    if (uniqueAssigneeIds.length > 0) {
      const memberCount = await prisma.workspaceMember.count({
        where: {
          workspaceId: list.space.workspaceId,
          userId: { in: uniqueAssigneeIds },
        },
      });
      if (memberCount !== uniqueAssigneeIds.length) {
        return NextResponse.json(
          { error: "Un ou plusieurs assignés n'appartiennent pas au workspace" },
          { status: 400 }
        );
      }
    }

    // Determine status: use provided or first status of the list
    let taskStatusId = statusId;
    if (taskStatusId?.startsWith("global:")) {
      const statusName = taskStatusId.slice("global:".length).trim().toLowerCase();
      taskStatusId = list.statuses.find(
        (s) => s.name.toLowerCase() === statusName
      )?.id;
    }
    if (taskStatusId && !list.statuses.some((s) => s.id === taskStatusId)) {
      return NextResponse.json(
        { error: "Statut invalide pour cette liste" },
        { status: 400 }
      );
    }
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
        assignees: uniqueAssigneeIds.length > 0 ? {
          create: uniqueAssigneeIds.map(id => ({ userId: id }))
        } : undefined,
      },
      include: taskResponseInclude,
    });

    // Log activity
    await logActivity({
      action: "created",
      taskId: task.id,
      userId: user.id,
    });

    // Notifier les assignés initiaux (hors auteur de la création)
    const initialAssigneeIds = uniqueAssigneeIds.filter((id) => id !== user.id);
    if (initialAssigneeIds.length > 0) {
      await sendNotificationToUsers(
        initialAssigneeIds,
        {
          type: "taskAssigned",
          message: `Vous avez été assigné à « ${task.title} »`,
          link: `/task/${task.id}`,
          title: "👤 Nouvelle assignation",
          body: task.title,
          tag: "task-assigned",
        },
        user.id
      ).catch((error) => {
        console.error("Assignee notification failed:", error);
      });
    }

    const automationApplied = await evaluateAutomations(
      listId,
      task.id,
      "TASK_CREATED",
      null,
      task,
      user.id
    );

    const finalTask = automationApplied
      ? (await prisma.task.findUnique({
          where: { id: task.id },
          include: taskResponseInclude,
        })) ?? task
      : task;

    // Trigger calendar sync if task has a due date
    if (finalTask.dueDate) {
      triggerCalendarSync(user.id);
    }

    try {
      await pusherServer.trigger(
        workspaceChannelName(list.space.workspace.id),
        "task:created",
        finalTask
      );
    } catch (e) {
      console.error("Pusher error:", e);
    }

    return NextResponse.json(finalTask, { status: 201 });
  } catch (error) {
    console.error("POST /api/tasks error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
