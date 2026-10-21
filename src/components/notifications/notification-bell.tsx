"use client";

import { useRouter } from "next/navigation";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { useNotifications } from "@/hooks/use-notifications";
import { useToast } from "@/components/ui/use-toast";
import { NotificationItem } from "./notification-item";

export function NotificationBell() {
  const router = useRouter();
  const { toast } = useToast();
  const { notifications, unreadCount, isLoading, markAsRead, markAllAsRead } =
    useNotifications();

  const recentNotifications = notifications.slice(0, 5);

  const handleMarkAllAsRead = async () => {
    const ok = await markAllAsRead();
    if (!ok) {
      toast({
        title: "Erreur",
        description: "Impossible de marquer les notifications comme lues.",
        variant: "destructive",
      });
    }
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative h-8 w-8 text-muted-foreground hover:text-foreground"
          aria-label={
            unreadCount > 0
              ? `Notifications (${unreadCount} non lue${unreadCount > 1 ? "s" : ""})`
              : "Notifications"
          }
        >
          <Bell className="h-5 w-5" aria-hidden="true" />
          {unreadCount > 0 && (
            <span
              aria-hidden="true"
              className="absolute -right-0.5 -top-0.5 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-primary px-1 text-[11px] font-bold text-white"
            >
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0" sideOffset={8}>
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3">
          <h3 className="text-sm font-semibold">Notifications</h3>
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllAsRead}
              className="text-sm text-primary hover:underline"
            >
              Tout marquer comme lu
            </button>
          )}
        </div>
        <Separator />

        {/* Notification List */}
        <ScrollArea className="max-h-[320px]">
          {isLoading ? (
            <div className="px-4 py-8 text-center">
              <p className="text-sm text-muted-foreground">Chargement…</p>
            </div>
          ) : recentNotifications.length === 0 ? (
            <div className="px-4 py-8 text-center">
              <Bell className="mx-auto mb-2 h-9 w-9 text-muted-foreground/40" aria-hidden="true" />
              <p className="text-sm text-muted-foreground">
                Aucune notification pour le moment
              </p>
            </div>
          ) : (
            <div className="py-1">
              {recentNotifications.map((notification) => (
                <NotificationItem
                  key={notification.id}
                  notification={notification}
                  onMarkAsRead={markAsRead}
                />
              ))}
            </div>
          )}
        </ScrollArea>

        {/* Footer */}
        <Separator />
        <div className="p-2">
          <button
            onClick={() => router.push("/notifications")}
            className="w-full rounded-md py-2 text-center text-sm font-medium text-primary transition-colors hover:bg-muted"
          >
            Voir toutes les notifications
          </button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
