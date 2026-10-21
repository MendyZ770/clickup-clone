import { NextResponse } from "next/server";
import { workspaceChannelName } from "@/lib/pusher-channels";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth-helpers";
import { evaluateAutomations } from "@/lib/automation-engine";
import { updateTaskSchema } from "@/lib/validations/task";
import { logActivity } from "@/lib/activity-logger";
import { triggerCalendarSync } from "@/lib/calendar-sync";
import { pusherServer } from "@/lib/pusher-server";
import { sendNotificationToUsers } from "@/lib/notifications";
import type { Prisma } from "@prisma/client";

interface RouteContext {
  params: Promise<{ taskId: string }>;
}

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
        assignees: {
          include: {
            user: { select: { id: true, name: true, email: true, image: true } }
          }
        },
        creator: {
          select: { id: true, name: true, email: true, image: true },
        },
        subtasks: {
          include: {
            status: true,
            assignees: {
              include: {
                user: { select: { id: true, name: true, email: true, image: true } }
              }
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

    // Remove nested access-check data and the lock PIN from response
    const { list: _list, lockedPin: _lockedPin, ...taskData } = task;
    void _list;
    void _lockedPin;
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

    const data = parsed.data;

    // Si la tâche est verrouillée, seuls locked + lockedPin peuvent être modifiés
    if (existingTask.locked) {
      const allowedKeys = new Set(["locked", "lockedPin"]);
      const keys = Object.keys(data);
      if (!keys.every((k) => allowedKeys.has(k))) {
        return NextResponse.json(
          { error: "Cette tâche est verrouillée. Déverrouillez-la avant de la modifier." },
          { status: 403 }
        );
      }
      const pinMatches =
        !existingTask.lockedPin || data.lockedPin === existingTask.lockedPin;
      if (!pinMatches) {
        return NextResponse.json(
          { error: "Code de déverrouillage incorrect." },
          { status: 403 }
        );
      }
    }

    if (
      data.locked === true &&
      !existingTask.locked &&
      !data.lockedPin &&
      !existingTask.lockedPin
    ) {
      return NextResponse.json(
        { error: "Un code à 4 chiffres est requis pour verrouiller la tâche." },
        { status: 400 }
      );
    }

    const updateData: Record<string, unknown> = {};
    const activities: Array<{ field: string; oldValue: string; newValue: string }> = [];

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

    // Déplacer la tâche vers une autre liste n'est autorisé qu'au sein du même workspace
    let targetListId = existingTask.listId;
    if (data.listId !== undefined && data.listId !== existingTask.listId) {
      const targetList = await prisma.list.findUnique({
        where: { id: data.listId },
        select: { id: true, space: { select: { workspaceId: true } } },
      });
      if (
        !targetList ||
        targetList.space.workspaceId !== existingTask.list.space.workspace.id
      ) {
        return NextResponse.json(
          { error: "Liste cible introuvable" },
          { status: 403 }
        );
      }
      targetListId = targetList.id;
      updateData.listId = targetList.id;
      activities.push({
        field: "list",
        oldValue: existingTask.listId,
        newValue: targetList.id,
      });
    }

    const isMovingList = targetListId !== existingTask.listId;
    const requestedStatusId =
      data.statusId !== undefined &&
      (data.statusId !== existingTask.statusId || isMovingList)
        ? data.statusId
        : undefined;

    if (requestedStatusId !== undefined) {
      let targetStatusId: string;
      let newStatusName: string;

      if (requestedStatusId.startsWith("global:")) {
        const statusName = requestedStatusId.slice("global:".length).trim();
        if (!statusName) {
          return NextResponse.json(
            { error: "Nom de statut invalide" },
            { status: 400 }
          );
        }
        newStatusName = statusName;

        let targetStatus = await prisma.status.findFirst({
          where: {
            listId: targetListId,
            name: { equals: statusName, mode: "insensitive" },
          },
        });

        if (!targetStatus) {
          const last = await prisma.status.findFirst({
            where: { listId: targetListId },
            orderBy: { order: "desc" },
          });
          targetStatus = await prisma.status.create({
            data: {
              name: statusName,
              color: "#6B7280",
              type: "custom",
              order: last ? last.order + 1 : 0,
              listId: targetListId,
            },
          });
        }
        targetStatusId = targetStatus.id;
      } else {
        const newStatus = await prisma.status.findFirst({
          where: { id: requestedStatusId, listId: targetListId },
        });
        if (!newStatus) {
          return NextResponse.json(
            { error: "Statut invalide pour cette liste" },
            { status: 400 }
          );
        }
        targetStatusId = newStatus.id;
        newStatusName = newStatus.name;
      }

      updateData.statusId = targetStatusId;
      activities.push({
        field: "status",
        oldValue: existingTask.status.name,
        newValue: newStatusName,
      });
    } else if (isMovingList) {
      const firstStatus = await prisma.status.findFirst({
        where: { listId: targetListId },
        orderBy: { order: "asc" },
      });
      if (!firstStatus) {
        return NextResponse.json(
          { error: "La liste cible n'a aucun statut" },
          { status: 400 }
        );
      }
      updateData.statusId = firstStatus.id;
      activities.push({
        field: "status",
        oldValue: existingTask.status.name,
        newValue: firstStatus.name,
      });
    }

    // assigneeId removed from PATCH as we use dedicated POST/DELETE routes for assignees

    if (data.startDate !== undefined) {
      const newStart = data.startDate ? new Date(data.startDate) : null;
      updateData.startDate = newStart;
    }

    if (data.timeEstimate !== undefined) {
      updateData.timeEstimate = data.timeEstimate;
    }

    if (data.position !== undefined) {
      updateData.position = data.position;
    }

    if (data.locked !== undefined && data.locked !== existingTask.locked) {
      updateData.locked = data.locked;
      // Quand on déverrouille, on efface le PIN
      if (!data.locked) updateData.lockedPin = null;
      activities.push({
        field: "locked",
        oldValue: existingTask.locked ? "locked" : "unlocked",
        newValue: data.locked ? "locked" : "unlocked",
      });
    }

    if (data.locked !== false && data.lockedPin !== undefined) {
      updateData.lockedPin = data.lockedPin ?? null;
    }

    if (Object.keys(updateData).length === 0) {
      // Ne jamais renvoyer le PIN
      const { lockedPin: _, ...rest } = existingTask;
      void _;
      return NextResponse.json(rest);
    }

    const updatedTask = await prisma.task.update({
      where: { id: taskId },
      data: updateData,
      include: taskResponseInclude,
    });

    // Trigger calendar sync if dueDate was modified
    if (updateData.dueDate !== undefined) {
      triggerCalendarSync(user.id);
    }

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

    let automationApplied = false;
    if (activities.some((activity) => activity.field === "status")) {
      automationApplied =
        (await evaluateAutomations(
          updatedTask.listId,
          taskId,
          "STATUS_CHANGED",
          existingTask,
          updatedTask,
          user.id
        )) || automationApplied;
    }
    if (activities.some((activity) => activity.field === "priority")) {
      automationApplied =
        (await evaluateAutomations(
          updatedTask.listId,
          taskId,
          "PRIORITY_CHANGED",
          existingTask,
          updatedTask,
          user.id
        )) || automationApplied;
    }

    const finalTask = automationApplied
      ? (await prisma.task.findUnique({
          where: { id: taskId },
          include: taskResponseInclude,
        })) ?? updatedTask
      : updatedTask;

    // Notifier les assignés d'un changement de statut
    const statusChange = activities.find((activity) => activity.field === "status");
    if (statusChange) {
      const assigneeIds = finalTask.assignees.map((assignee) => assignee.userId);
      if (assigneeIds.length > 0) {
        await sendNotificationToUsers(
          assigneeIds,
          {
            type: "taskStatusChanged",
            message: `« ${finalTask.title} » : ${statusChange.oldValue} → ${finalTask.status.name}`,
            link: `/task/${taskId}`,
            title: "🔄 Statut modifié",
            body: `${statusChange.oldValue} → ${finalTask.status.name}`,
            tag: "task-status",
          },
          user.id
        ).catch((error) => {
          console.error("Status notification failed:", error);
        });
      }
    }

    // Ne jamais renvoyer le PIN dans la réponse
    const { lockedPin: _pin, ...taskWithoutPin } = finalTask;
    void _pin;

    try {
      await pusherServer.trigger(
        workspaceChannelName(existingTask.list.space.workspace.id),
        "task:updated",
        taskWithoutPin
      );
    } catch (e) {
      console.error("Pusher error:", e);
    }

    return NextResponse.json(taskWithoutPin);
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

    if (task.locked) {
      return NextResponse.json(
        { error: "Cette tâche est verrouillée. Déverrouillez-la avant de la supprimer." },
        { status: 403 }
      );
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

    // Trigger calendar sync if deleted task had a due date
    if (task.dueDate) {
      triggerCalendarSync(user.id);
    }

    try {
      await pusherServer.trigger(
        workspaceChannelName(task.list.space.workspace.id),
        "task:deleted",
        { id: taskId }
      );
    } catch (e) {
      console.error("Pusher error:", e);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/tasks/[id] error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
