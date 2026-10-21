"use client";

import { useEffect, useCallback, useState } from "react";

const SW_READY_TIMEOUT_MS = 10_000;

function waitForServiceWorker(): Promise<ServiceWorkerRegistration> {
  return Promise.race([
    navigator.serviceWorker.ready,
    new Promise<never>((_, reject) => {
      setTimeout(
        () => reject(new Error("Service worker indisponible (délai dépassé)")),
        SW_READY_TIMEOUT_MS
      );
    }),
  ]);
}

async function readJson(res: Response): Promise<Record<string, unknown> | null> {
  try {
    return (await res.json()) as Record<string, unknown>;
  } catch {
    return null;
  }
}

export function usePushNotifications() {
  const [isSupported, setIsSupported] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);

  const checkSubscription = useCallback(async () => {
    try {
      const registration = await waitForServiceWorker();
      const subscription = await registration.pushManager.getSubscription();
      setIsSubscribed(!!subscription);
    } catch {
      setIsSubscribed(false);
    }
  }, []);

  useEffect(() => {
    if (
      typeof window !== "undefined" &&
      "serviceWorker" in navigator &&
      "PushManager" in window &&
      "Notification" in window
    ) {
      setIsSupported(true);
      checkSubscription();
    }
  }, [checkSubscription]);

  const subscribe = useCallback(async () => {
    if (!isSupported) return;

    try {
      const keyRes = await fetch("/api/push/vapid-public-key");
      if (!keyRes.ok) throw new Error("Clé VAPID indisponible");
      const keyData = await readJson(keyRes);
      const key = typeof keyData?.key === "string" ? keyData.key : null;
      if (!key) throw new Error("Clé VAPID absente");

      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        console.warn("[PUSH] Permission denied");
        return;
      }

      const registration = await waitForServiceWorker();
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(key),
      });

      const p256dh = subscription.getKey("p256dh");
      const auth = subscription.getKey("auth");
      if (!p256dh || !auth) {
        await subscription.unsubscribe().catch(() => {});
        throw new Error("Clés d'abonnement push manquantes");
      }

      const res = await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          endpoint: subscription.endpoint,
          p256dh: arrayBufferToBase64(p256dh),
          auth: arrayBufferToBase64(auth),
        }),
      });
      if (!res.ok) {
        await subscription.unsubscribe().catch(() => {});
        throw new Error("Enregistrement de l'abonnement push refusé");
      }

      setIsSubscribed(true);
    } catch (err) {
      console.error("[PUSH] Subscribe failed:", err);
      setIsSubscribed(false);
    }
  }, [isSupported]);

  const unsubscribe = useCallback(async () => {
    try {
      const registration = await waitForServiceWorker();
      const subscription = await registration.pushManager.getSubscription();
      if (subscription) {
        await subscription.unsubscribe();
        const res = await fetch("/api/push/unsubscribe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ endpoint: subscription.endpoint }),
        });
        if (!res.ok) {
          console.error("[PUSH] Unsubscribe rejected by server");
        }
      }
      setIsSubscribed(false);
    } catch (err) {
      console.error("[PUSH] Unsubscribe failed:", err);
    }
  }, []);

  return { isSupported, isSubscribed, subscribe, unsubscribe };
}

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/\-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  return Uint8Array.from(rawData.split("").map((c) => c.charCodeAt(0)));
}

function arrayBufferToBase64(buffer: ArrayBuffer) {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}
