import { prisma } from "@/lib/prisma";
import { sendNotificationToUsers, NotificationType } from "@/lib/notifications";

interface LogActivityParams {
  action: string;
  taskId: string;
  userId: string;
  field?: string;
  oldValue?: string;
  newValue?: string;
  notifyUserIds?: string[];
  notificationType?: NotificationType;
  notificationMessage?: string;
  notificationLink?: string;
  notificationTitle?: string;
  notificationBody?: string;
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
  notificationTitle,
  notificationBody,
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
    await sendNotificationToUsers(
      notifyUserIds,
      {
        type: notificationType ?? ("teamActivity" as NotificationType),
        message: notificationMessage,
        link: notificationLink,
        title: notificationTitle,
        body: notificationBody ?? notificationMessage,
      },
      userId // actorId — ne se notifie pas lui-même
    );
  }

  return activity;
}
