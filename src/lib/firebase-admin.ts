import admin from "firebase-admin";

let initialized = false;

export function getFirebaseAdmin(): admin.app.App {
  if (initialized) return admin.app();

  const serviceAccountRaw = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (!serviceAccountRaw) {
    throw new Error("[FCM] FIREBASE_SERVICE_ACCOUNT env var not set");
  }

  const serviceAccount = JSON.parse(serviceAccountRaw) as admin.ServiceAccount;

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });

  initialized = true;
  return admin.app();
}

export async function sendFcmNotification({
  token,
  title,
  body,
  url,
  tag,
}: {
  token: string;
  title: string;
  body: string;
  url?: string;
  tag?: string;
}) {
  const app = getFirebaseAdmin();
  const messaging = app.messaging();

  await messaging.send({
    token,
    notification: { title, body },
    android: {
      priority: "high",
      notification: {
        channelId: "done-notifications",
        clickAction: "FLUTTER_NOTIFICATION_CLICK",
        tag: tag ?? "done",
      },
    },
    data: {
      url: url ?? "/dashboard",
      tag: tag ?? "done",
    },
  });
}
