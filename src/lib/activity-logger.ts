import { prisma } from "@/lib/prisma";

interface LogActivityParams {
  action: string;
  taskId: string;
  userId: string;
  field?: string;
  oldValue?: string;
  newValue?: string;
  notifyUserIds?: string[];
  notificationType?: string;
  notificationMessage?: string;
  notificationLink?: string;
}

export async function logActivity({
  action,
  taskId,
  userId,
  field,
  oldValue,
  newValue,
  notifyUserIds,
  notificationType,
  notificationMessage,
  notificationLink,
}: LogActivityParams) {
  const activity = await prisma.activity.create({
    data: {
      action,
      taskId,
      userId,
      field: field ?? null,
      oldValue: oldValue ?? null,
      newValue: newValue ?? null,
    },
  });

  if (notifyUserIds && notifyUserIds.length > 0 && notificationMessage) {
    await prisma.notification.createMany({
      data: notifyUserIds
        .filter((id) => id !== userId) // Don't notify the actor
        .map((notifyUserId) => ({
          type: notificationType ?? action,
          message: notificationMessage,
          link: notificationLink ?? null,
          userId: notifyUserId,
        })),
    });
  }

  return activity;
}
