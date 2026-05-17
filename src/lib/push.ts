import webpush from "web-push";

const vapidPublic = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
const vapidPrivate = process.env.VAPID_PRIVATE_KEY;
const contactEmail = process.env.VAPID_CONTACT_EMAIL ?? "contact@done.app";

export function initWebPush() {
  if (!vapidPublic || !vapidPrivate) {
    console.warn("[PUSH] VAPID keys not configured");
    return false;
  }
  webpush.setVapidDetails(
    `mailto:${contactEmail}`,
    vapidPublic,
    vapidPrivate
  );
  return true;
}

export async function sendPushNotification({
  subscription,
  title,
  body,
  url,
}: {
  subscription: {
    endpoint: string;
    p256dh: string;
    auth: string;
  };
  title: string;
  body: string;
  url?: string;
}) {
  if (!initWebPush()) return;

  const pushSubscription = {
    endpoint: subscription.endpoint,
    keys: {
      p256dh: subscription.p256dh,
      auth: subscription.auth,
    },
  };

  const payload = JSON.stringify({
    title,
    body,
    tag: "done-reminder",
    data: { url: url || "/dashboard" },
  });

  try {
    await webpush.sendNotification(pushSubscription, payload);
  } catch (err) {
    // 410 = subscription expired or unsubscribed
    const error = err as { statusCode?: number; message?: string };
    if (error.statusCode === 410) {
      console.log("[PUSH] Subscription expired, will be cleaned up");
      throw new Error("GONE");
    }
    console.error("[PUSH] Failed to send:", err);
  }
}

export function getVapidPublicKey() {
  return vapidPublic;
}
