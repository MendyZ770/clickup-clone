import { prisma } from "@/lib/prisma";
import { sendNotificationToUsers } from "@/lib/notifications";
import type { Automation, Task } from "@prisma/client";

export type EventType = "STATUS_CHANGED" | "PRIORITY_CHANGED" | "TASK_CREATED";

const VALID_PRIORITIES = new Set(["urgent", "high", "normal", "low"]);

function asObject(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function asNonEmptyString(value: unknown): string | null {
  return typeof value === "string" && value.trim().length > 0 ? value : null;
}

async function logAutomationActivity(
  taskId: string,
  automation: Automation,
  oldValue: string,
  newValue: string
) {
  await prisma.activity.create({
    data: {
      taskId,
      action: "Automation Triggered",
      field: automation.name,
      oldValue,
      newValue,
      userId: automation.creatorId,
    },
  });
}

/**
 * Applique les automatisations actives d'une liste pour un événement donné.
 * Retourne `true` si au moins une action a modifié la tâche.
 */
export async function evaluateAutomations(
  listId: string,
  taskId: string,
  eventType: EventType,
  oldTask: Partial<Task> | null,
  newTask: Partial<Task>,
  actorId?: string
): Promise<boolean> {
  const automations = await prisma.automation.findMany({
    where: {
      listId,
      isActive: true,
      triggerType: eventType,
    },
  });

  if (automations.length === 0) return false;

  const list = await prisma.list.findUnique({
    where: { id: listId },
    select: { space: { select: { workspaceId: true } } },
  });
  if (!list) return false;

  const workspaceId = list.space.workspaceId;
  let applied = false;

  for (const automation of automations) {
    try {
      const condition = asObject(automation.triggerCondition);
      const payload = asObject(automation.actionPayload);

      let triggerMatched = false;

      if (eventType === "STATUS_CHANGED") {
        const statusId = asNonEmptyString(condition.statusId);
        if (
          statusId &&
          newTask.statusId === statusId &&
          oldTask?.statusId !== statusId
        ) {
          triggerMatched = true;
        }
      } else if (eventType === "PRIORITY_CHANGED") {
        const priority = asNonEmptyString(condition.priority);
        if (
          priority &&
          newTask.priority === priority &&
          oldTask?.priority !== priority
        ) {
          triggerMatched = true;
        }
      } else if (eventType === "TASK_CREATED") {
        const statusId = asNonEmptyString(condition.statusId);
        if (!statusId || newTask.statusId === statusId) {
          triggerMatched = true;
        }
      }

      if (!triggerMatched) continue;

      if (automation.actionType === "SET_ASSIGNEE") {
        const assigneeId = asNonEmptyString(payload.assigneeId);
        if (!assigneeId) continue;

        const membership = await prisma.workspaceMember.findUnique({
          where: { workspaceId_userId: { workspaceId, userId: assigneeId } },
          select: { id: true },
        });
        if (!membership) {
          console.warn(
            `[Automation ${automation.id}] assignee ${assigneeId} is not a workspace member`
          );
          continue;
        }

        const existing = await prisma.taskAssignee.findUnique({
          where: { taskId_userId: { taskId, userId: assigneeId } },
          select: { id: true },
        });
        if (existing) continue;

        await prisma.taskAssignee.create({ data: { taskId, userId: assigneeId } });
        applied = true;

        await logAutomationActivity(
          taskId,
          automation,
          "",
          `Assigné à ${assigneeId}`
        );

        await sendNotificationToUsers(
          [assigneeId],
          {
            type: "taskAssigned",
            message: `Assignation automatique : « ${newTask.title ?? "une tâche"} »`,
            link: `/task/${taskId}`,
            title: "👤 Tâche assignée",
            body: newTask.title ?? "Nouvelle assignation",
            tag: "task-assigned",
          },
          actorId
        ).catch((error) => {
          console.error(`[Automation ${automation.id}] notification failed:`, error);
        });
      } else if (automation.actionType === "SET_STATUS") {
        const statusId = asNonEmptyString(payload.statusId);
        if (!statusId) continue;

        const status = await prisma.status.findFirst({
          where: { id: statusId, listId },
          select: { id: true, name: true },
        });
        if (!status) {
          console.warn(
            `[Automation ${automation.id}] status ${statusId} does not belong to list ${listId}`
          );
          continue;
        }
        if (newTask.statusId === status.id) continue;

        await prisma.task.update({
          where: { id: taskId },
          data: { statusId: status.id },
        });
        applied = true;
        await logAutomationActivity(
          taskId,
          automation,
          newTask.statusId ?? "",
          status.name
        );
      } else if (automation.actionType === "SET_PRIORITY") {
        const priority = asNonEmptyString(payload.priority);
        if (!priority || !VALID_PRIORITIES.has(priority)) {
          console.warn(
            `[Automation ${automation.id}] invalid priority ${String(payload.priority)}`
          );
          continue;
        }
        if (newTask.priority === priority) continue;

        await prisma.task.update({
          where: { id: taskId },
          data: { priority },
        });
        applied = true;
        await logAutomationActivity(
          taskId,
          automation,
          newTask.priority ?? "",
          priority
        );
      }
    } catch (error) {
      console.error(`Automation ${automation.id} failed:`, error);
    }
  }

  return applied;
}
