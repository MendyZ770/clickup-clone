"use client";

import { useRouter } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import {
  UserPlus,
  MessageSquare,
  ArrowRightLeft,
  Clock,
  Bell,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface NotificationItemProps {
  notification: {
    id: string;
    type: string;
    message: string;
    link: string | null;
    read: boolean;
    createdAt: string;
  };
  onMarkAsRead: (id: string) => void;
}

const TYPE_CONFIG: Record<
  string,
  { icon: typeof Bell; color: string; bgColor: string }
> = {
  task_assigned: {
    icon: UserPlus,
    color: "text-blue-500",
    bgColor: "bg-blue-500/10",
  },
  comment_added: {
    icon: MessageSquare,
    color: "text-green-500",
    bgColor: "bg-green-500/10",
  },
  status_changed: {
    icon: ArrowRightLeft,
    color: "text-purple-500",
    bgColor: "bg-purple-500/10",
  },
  due_soon: {
    icon: Clock,
    color: "text-orange-500",
    bgColor: "bg-orange-500/10",
  },
};

export function NotificationItem({
  notification,
  onMarkAsRead,
}: NotificationItemProps) {
  const router = useRouter();
  const config = TYPE_CONFIG[notification.type] ?? {
    icon: Bell,
    color: "text-muted-foreground",
    bgColor: "bg-muted",
  };
  const Icon = config.icon;

  const handleClick = () => {
    if (!notification.read) {
      onMarkAsRead(notification.id);
    }
    if (notification.link) {
      router.push(notification.link);
    }
  };

  return (
    <button
      onClick={handleClick}
      className={cn(
        "flex w-full items-start gap-3 rounded-lg px-4 py-3 text-left transition-colors hover:bg-muted/50",
        !notification.read && "bg-primary/5"
      )}
    >
      {/* Unread indicator */}
      <div className="mt-2 flex shrink-0 items-center">
        <div
          className={cn(
            "h-2 w-2 rounded-full",
            !notification.read ? "bg-primary" : "bg-transparent"
          )}
        />
      </div>

      {/* Icon */}
      <div
        className={cn(
          "mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
          config.bgColor
        )}
      >
        <Icon className={cn("h-4 w-4", config.color)} />
      </div>

      {/* Content */}
      <div className="min-w-0 flex-1">
        <p
          className={cn(
            "text-sm leading-snug",
            !notification.read ? "font-medium" : "text-muted-foreground"
          )}
        >
          {notification.message}
        </p>
        <p className="mt-0.5 text-xs text-muted-foreground/70">
          {formatDistanceToNow(new Date(notification.createdAt), {
            addSuffix: true,
            locale: fr,
          })}
        </p>
      </div>
    </button>
  );
}
