import { prisma } from "@/lib/prisma";
import type { Task } from "@prisma/client";

export type EventType = "STATUS_CHANGED" | "PRIORITY_CHANGED" | "TASK_CREATED";

export async function evaluateAutomations(
  listId: string,
  taskId: string,
  eventType: EventType,
  oldTask: Partial<Task> | null,
  newTask: Partial<Task>
) {
  // Fetch active automations for the list and this event type
  const automations = await prisma.automation.findMany({
    where: {
      listId,
      isActive: true,
      triggerType: eventType,
    },
  });

  if (automations.length === 0) return;

  for (const automation of automations) {
    try {
      const condition = automation.triggerCondition as Record<string, any>;
      const payload = automation.actionPayload as Record<string, any>;

      let triggerMatched = false;

      // Check condition based on event type
      if (eventType === "STATUS_CHANGED") {
        if (
          condition.statusId &&
          newTask.statusId === condition.statusId &&
          (!oldTask || oldTask.statusId !== condition.statusId)
        ) {
          triggerMatched = true;
        }
      } else if (eventType === "PRIORITY_CHANGED") {
        if (
          condition.priority &&
          newTask.priority === condition.priority &&
          (!oldTask || oldTask.priority !== condition.priority)
        ) {
          triggerMatched = true;
        }
      } else if (eventType === "TASK_CREATED") {
        if (!condition.statusId || newTask.statusId === condition.statusId) {
          triggerMatched = true;
        }
      }

      if (triggerMatched) {
        // Execute Action
        if (automation.actionType === "SET_ASSIGNEE") {
          if (payload.assigneeId) {
            await prisma.taskAssignee.upsert({
              where: {
                taskId_userId: { taskId, userId: payload.assigneeId },
              },
              create: { taskId, userId: payload.assigneeId },
              update: {},
            });
          }
        } else if (automation.actionType === "SET_STATUS") {
          if (payload.statusId) {
            await prisma.task.update({
              where: { id: taskId },
              data: { statusId: payload.statusId },
            });
          }
        } else if (automation.actionType === "SET_PRIORITY") {
          if (payload.priority) {
            await prisma.task.update({
              where: { id: taskId },
              data: { priority: payload.priority },
            });
          }
        }
        
        // Activity log for automation
        await prisma.activity.create({
          data: {
            taskId,
            action: "Automation Triggered",
            field: automation.name,
            newValue: automation.actionType,
            userId: automation.creatorId,
          }
        });
      }
    } catch (error) {
      console.error(`Automation ${automation.id} failed:`, error);
    }
  }
}
