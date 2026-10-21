import { prisma } from "@/lib/prisma";
import { sendPushNotification, initWebPush } from "@/lib/push";
import { sendFcmNotification } from "@/lib/firebase-admin";

export type NotificationType =
  | "taskAssigned"
  | "taskComment"
  | "taskStatusChanged"
  | "taskDueSoon"
  | "dailySummary"
  | "reminder"
  | "teamActivity"
  | "budgetAlert"
  | "mention";

interface NotificationPayload {
  type: NotificationType;
  message: string;
  link?: string;
  title?: string; // pour le push (titre court)
  body?: string;  // pour le push (corps court)
  tag?: string;   // pour grouper les notifs
}

/**
 * Envoie une notification à une liste d'utilisateurs :
 * 1. Crée la notification en base (in-app)
 * 2. Vérifie les préférences de chaque user
 * 3. Envoie le push (web VAPID + FCM) si activé
 */
export async function sendNotificationToUsers(
  userIds: string[],
  payload: NotificationPayload,
  actorId?: string // l'auteur de l'action (ne se notifie pas lui-même)
) {
  if (userIds.length === 0) return;

  const targets = actorId ? userIds.filter((id) => id !== actorId) : userIds;
  if (targets.length === 0) return;

  // 1. Récupérer les préférences + subscriptions de chaque user
  const users = await prisma.user.findMany({
    where: { id: { in: targets } },
    select: {
      id: true,
      notificationPreferences: true,
      pushSubscriptions: true,
    },
  });

  // 2. Ne créer la notification in-app que pour les types activés
  const eligibleUsers = users.filter(
    (user) =>
      !user.notificationPreferences ||
      isTypeEnabled(user.notificationPreferences, payload.type)
  );

  if (eligibleUsers.length > 0) {
    await prisma.notification.createMany({
      data: eligibleUsers.map((user) => ({
        type: payload.type,
        message: payload.message,
        link: payload.link ?? null,
        userId: user.id,
      })),
    });
  }

  const pushTitle = payload.title ?? "Done";
  const pushBody = payload.body ?? payload.message;
  const pushUrl = payload.link ?? "/dashboard";

  for (const user of eligibleUsers) {
    // pushEnabled ne coupe que le push, pas la notification in-app
    if (user.notificationPreferences && !user.notificationPreferences.pushEnabled) {
      continue;
    }

    // 3. Envoyer à chaque subscription
    for (const sub of user.pushSubscriptions) {
      if (sub.provider === "fcm" && sub.fcmToken) {
        // FCM (Capacitor Android)
        sendFcmNotification({
          token: sub.fcmToken,
          title: pushTitle,
          body: pushBody,
          url: pushUrl,
          tag: payload.tag ?? payload.type,
        }).catch(async (err: Error) => {
          if (err.message === "GONE" || err.message?.includes("registration-token-not-registered")) {
            await prisma.pushSubscription.delete({ where: { id: sub.id } });
          }
        });
      } else if (sub.provider === "web" && sub.endpoint && sub.p256dh && sub.auth) {
        // Web Push (VAPID)
        if (!initWebPush()) continue;
        sendPushNotification({
          subscription: { endpoint: sub.endpoint, p256dh: sub.p256dh, auth: sub.auth },
          title: pushTitle,
          body: pushBody,
          url: pushUrl,
        }).catch(async (err: Error) => {
          if (err.message === "GONE") {
            await prisma.pushSubscription.delete({ where: { id: sub.id } });
          }
        });
      }
    }
  }
}

function isTypeEnabled(
  prefs: {
    taskAssigned: boolean;
    taskComment: boolean;
    taskStatusChanged: boolean;
    taskDueSoon: boolean;
    dailySummary: boolean;
    reminders: boolean;
    teamActivity: boolean;
    budgetAlert: boolean;
  },
  type: NotificationType
): boolean {
  switch (type) {
    case "taskAssigned":     return prefs.taskAssigned;
    case "taskComment":      return prefs.taskComment;
    case "taskStatusChanged":return prefs.taskStatusChanged;
    case "taskDueSoon":      return prefs.taskDueSoon;
    case "dailySummary":     return prefs.dailySummary;
    case "reminder":         return prefs.reminders;
    case "teamActivity":     return prefs.teamActivity;
    case "budgetAlert":      return prefs.budgetAlert;
    default:                 return true;
  }
}
