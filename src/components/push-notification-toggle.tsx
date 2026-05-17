"use client";

import { usePushNotifications } from "@/hooks/use-push-notifications";
import { Button } from "@/components/ui/button";
import { Bell, BellOff } from "lucide-react";

export function PushNotificationToggle() {
  const { isSupported, isSubscribed, subscribe, unsubscribe } = usePushNotifications();

  if (!isSupported) return null;

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={isSubscribed ? unsubscribe : subscribe}
      className="gap-2 text-muted-foreground hover:text-foreground"
      title={isSubscribed ? "Désactiver les notifications" : "Activer les notifications push"}
    >
      {isSubscribed ? <Bell className="h-4 w-4" /> : <BellOff className="h-4 w-4" />}
      <span className="hidden sm:inline">{isSubscribed ? "Notifs actives" : "Activer notifs"}</span>
    </Button>
  );
}
