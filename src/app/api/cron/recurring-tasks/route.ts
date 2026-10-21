import { NextResponse } from "next/server";
import { verifyCronSecret } from "@/lib/cron-auth";
import { prisma } from "@/lib/prisma";
import { computeNextDueDate, shiftDate } from "@/lib/recurrence";
import { sendNotificationToUsers } from "@/lib/notifications";

export const maxDuration = 60;

const BATCH_SIZE = 50;

export async function GET(request: Request) {
  const denied = verifyCronSecret(request);
  if (denied) return denied;

  const now = new Date();

  try {
    const dueRecurrences = await prisma.taskRecurrence.findMany({
      where: { nextDueDate: { lte: now } },
      select: { id: true },
      orderBy: { nextDueDate: "asc" },
      take: BATCH_SIZE,
    });

    let created = 0;
    let failed = 0;

    for (const { id } of dueRecurrences) {
      try {
        const result = await prisma.$transaction(async (tx) => {
          const recurrence = await tx.taskRecurrence.findUnique({
            where: { id },
            include: {
              task: {
                include: {
                  assignees: { select: { userId: true } },
                  taskTags: { select: { tagId: true } },
                  list: {
                    include: {
                      statuses: { orderBy: { order: "asc" }, take: 1 },
                    },
                  },
                },
              },
            },
          });

          if (
            !recurrence ||
            !recurrence.nextDueDate ||
            recurrence.nextDueDate > now
          ) {
            return null;
          }

          // Revendication atomique : deux workers ne peuvent pas matérialiser
          // la même occurrence.
          const claim = await tx.taskRecurrence.updateMany({
            where: { id, nextDueDate: recurrence.nextDueDate },
            data: { nextDueDate: null },
          });
          if (claim.count === 0) return null;

          const source = recurrence.task;
          const firstStatus = source.list.statuses[0];
          if (!firstStatus) {
            throw new Error(`List ${source.listId} has no status configured`);
          }

          const lastTask = await tx.task.findFirst({
            where: { listId: source.listId, statusId: firstStatus.id },
            orderBy: { position: "desc" },
            select: { position: true },
          });

          const occurrenceDueDate = recurrence.nextDueDate;

          const newTask = await tx.task.create({
            data: {
              title: source.title,
              description: source.description,
              priority: source.priority,
              dueDate: occurrenceDueDate,
              startDate: shiftDate(
                source.startDate,
                source.dueDate,
                occurrenceDueDate
              ),
              timeEstimate: source.timeEstimate,
              position: lastTask ? lastTask.position + 65536 : 65536,
              listId: source.listId,
              statusId: firstStatus.id,
              creatorId: source.creatorId,
              assignees:
                source.assignees.length > 0
                  ? {
                      create: source.assignees.map((assignee) => ({
                        userId: assignee.userId,
                      })),
                    }
                  : undefined,
              taskTags:
                source.taskTags.length > 0
                  ? {
                      create: source.taskTags.map((taskTag) => ({
                        tagId: taskTag.tagId,
                      })),
                    }
                  : undefined,
            },
            select: { id: true, title: true },
          });

          const rule = {
            pattern: recurrence.pattern,
            interval: recurrence.interval,
            daysOfWeek: recurrence.daysOfWeek,
            dayOfMonth: recurrence.dayOfMonth,
            endDate: recurrence.endDate,
          };

          let following = computeNextDueDate(rule, occurrenceDueDate);
          // Rattrapage : ne pas empiler les occurrences passées après une panne.
          for (let guard = 0; following && following <= now && guard < 1000; guard++) {
            following = computeNextDueDate(rule, following);
          }

          await tx.taskRecurrence.delete({ where: { id } });
          if (following) {
            await tx.taskRecurrence.create({
              data: {
                taskId: newTask.id,
                pattern: recurrence.pattern,
                interval: recurrence.interval,
                daysOfWeek: recurrence.daysOfWeek,
                dayOfMonth: recurrence.dayOfMonth,
                endDate: recurrence.endDate,
                nextDueDate: following,
              },
            });
          }

          return {
            newTaskId: newTask.id,
            newTaskTitle: newTask.title,
            assigneeIds: source.assignees.map((assignee) => assignee.userId),
            actorId: source.creatorId ?? undefined,
          };
        });

        if (!result) continue;
        created++;

        if (result.assigneeIds.length > 0) {
          await sendNotificationToUsers(
            result.assigneeIds,
            {
              type: "taskAssigned",
              message: `Nouvelle occurrence : « ${result.newTaskTitle} »`,
              link: `/task/${result.newTaskId}`,
              title: "🔁 Tâche récurrente",
              body: result.newTaskTitle,
              tag: "task-recurrence",
            },
            result.actorId
          ).catch((error) => {
            console.error("[CRON] Recurrence notification failed:", error);
          });
        }
      } catch (error) {
        failed++;
        console.error(`[CRON] Recurrence ${id} failed:`, error);
      }
    }

    return NextResponse.json({
      ok: true,
      processed: dueRecurrences.length,
      created,
      failed,
    });
  } catch (error) {
    console.error("[CRON] Recurring tasks error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
