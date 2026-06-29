"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

// Détecte si on est dans une app Capacitor native
function isCapacitor(): boolean {
  if (typeof window === "undefined") return false;
  // @ts-expect-error Capacitor global
  return !!(window.Capacitor?.isNativePlatform?.());
}

export function useCapacitorPush() {
  const router = useRouter();

  useEffect(() => {
    if (!isCapacitor()) return;

    let cleanup: (() => void) | undefined;

    async function init() {
      try {
        const { PushNotifications } = await import("@capacitor/push-notifications");

        // Demander la permission
        const permResult = await PushNotifications.requestPermissions();
        if (permResult.receive !== "granted") {
          console.warn("[FCM] Permission refusée");
          return;
        }

        // Enregistrer auprès de FCM
        await PushNotifications.register();

        // Recevoir le token FCM et l'envoyer au serveur
        const tokenListener = await PushNotifications.addListener(
          "registration",
          async (token) => {
            try {
              await fetch("/api/push/register-fcm", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ fcmToken: token.value }),
              });
              console.log("[FCM] Token enregistré");
            } catch (err) {
              console.error("[FCM] Erreur enregistrement token:", err);
            }
          }
        );

        // Erreur d'enregistrement
        const errorListener = await PushNotifications.addListener(
          "registrationError",
          (err) => {
            console.error("[FCM] Erreur registration:", err);
          }
        );

        // Notification reçue en foreground (app ouverte)
        const foregroundListener = await PushNotifications.addListener(
          "pushNotificationReceived",
          (notification) => {
            console.log("[FCM] Notification foreground:", notification);
            // On pourrait afficher un toast ici
          }
        );

        // Tap sur une notification (app en background ou fermée)
        const actionListener = await PushNotifications.addListener(
          "pushNotificationActionPerformed",
          (action) => {
            const url = action.notification.data?.url as string | undefined;
            if (url) {
              router.push(url);
            }
          }
        );

        cleanup = () => {
          tokenListener.remove();
          errorListener.remove();
          foregroundListener.remove();
          actionListener.remove();
        };
      } catch (err) {
        console.error("[FCM] Init failed:", err);
      }
    }

    init();
    return () => cleanup?.();
  }, [router]);
}
