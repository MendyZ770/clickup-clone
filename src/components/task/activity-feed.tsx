"use client";

import useSWR from "swr";
import { formatDistanceToNow } from "date-fns";
import {
  Activity,
  Plus,
  Edit3,
  ArrowRightLeft,
  MessageSquare,
  Trash2,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import type { ActivityWithUser } from "@/types";

const fetcher = (url: string) =>
  fetch(url).then((r) => {
    if (!r.ok) throw new Error("Failed to fetch");
    return r.json();
  });

const ACTION_ICONS: Record<string, typeof Activity> = {
  created: Plus,
  updated: Edit3,
  status_changed: ArrowRightLeft,
  commented: MessageSquare,
  deleted: Trash2,
};

interface ActivityFeedProps {
  taskId: string;
}

export function ActivityFeed({ taskId }: ActivityFeedProps) {
  const { data: activities, isLoading } = useSWR<ActivityWithUser[]>(
    `/api/tasks/${taskId}/activity`,
    fetcher
  );

  const getDescription = (activity: ActivityWithUser) => {
    const name = activity.user.name ?? activity.user.email;
    switch (activity.action) {
      case "created":
        return `${name} created this task`;
      case "commented":
        return `${name} commented`;
      case "updated":
        if (activity.field) {
          return `${name} changed ${activity.field}${
            activity.oldValue ? ` from "${activity.oldValue}"` : ""
          }${activity.newValue ? ` to "${activity.newValue}"` : ""}`;
        }
        return `${name} updated this task`;
      default:
        return `${name} ${activity.action}`;
    }
  };

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold flex items-center gap-1.5">
        <Activity className="h-4 w-4" />
        Activity
      </h3>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex gap-2">
              <Skeleton className="h-6 w-6 rounded-full" />
              <Skeleton className="h-4 w-48" />
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {(activities ?? []).map((activity) => {
            const Icon = ACTION_ICONS[activity.action] ?? Activity;
            return (
              <div key={activity.id} className="flex items-start gap-2.5">
                <Avatar className="h-6 w-6 shrink-0">
                  <AvatarImage src={activity.user.image ?? undefined} />
                  <AvatarFallback className="text-[9px]">
                    {(activity.user.name ?? activity.user.email)
                      .slice(0, 2)
                      .toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    <Icon className="inline h-3 w-3 mr-1" />
                    {getDescription(activity)}
                  </p>
                  <span className="text-[10px] text-muted-foreground/60">
                    {formatDistanceToNow(new Date(activity.createdAt), {
                      addSuffix: true,
                    })}
                  </span>
                </div>
              </div>
            );
          })}
          {activities?.length === 0 && (
            <p className="text-xs text-muted-foreground text-center py-4">
              No activity yet
            </p>
          )}
        </div>
      )}
    </div>
  );
}
