"use client";

import { usePushNotifications } from "@/hooks/use-push-notifications";
import { Button } from "@/components/ui/button";
import { Bell, BellOff } from "lucide-react";

export function PushNotificationToggle() {
  const { isSupported, isSubscribed, subscribe, unsubscribe } = usePushNotifications();

  if (!isSupported) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <Button
        variant="outline"
        size="sm"
        onClick={isSubscribed ? unsubscribe : subscribe}
        className="gap-2 shadow-lg rounded-full bg-background"
        title={isSubscribed ? "Désactiver les notifications" : "Activer les notifications push"}
      >
        {isSubscribed ? <Bell className="h-4 w-4 text-primary" /> : <BellOff className="h-4 w-4" />}
        <span className="hidden sm:inline">{isSubscribed ? "Notifs actives" : "Activer notifs"}</span>
      </Button>
    </div>
  );
}
