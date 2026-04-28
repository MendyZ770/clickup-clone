"use client";

import { formatDistanceToNow } from "date-fns";
import {
  Activity,
  ArrowRight,
  Edit3,
  Plus,
  Trash2,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

interface ActivityItem {
  id: string;
  action: string;
  field: string | null;
  oldValue: string | null;
  newValue: string | null;
  createdAt: string;
  user: {
    id: string;
    name: string | null;
    email: string;
    image: string | null;
  };
  task: {
    id: string;
    title: string;
  };
}

interface RecentActivityProps {
  activities: ActivityItem[];
  isLoading: boolean;
}

function getActionIcon(action: string) {
  switch (action) {
    case "created":
      return Plus;
    case "updated":
      return Edit3;
    case "deleted":
      return Trash2;
    case "moved":
      return ArrowRight;
    default:
      return Activity;
  }
}

function getActivityDescription(activity: ActivityItem): string {
  const taskTitle =
    activity.task.title.length > 30
      ? activity.task.title.slice(0, 30) + "..."
      : activity.task.title;

  if (activity.action === "created") {
    return `created task "${taskTitle}"`;
  }

  if (activity.action === "updated" && activity.field) {
    if (activity.field === "status") {
      return `changed status of "${taskTitle}" from ${activity.oldValue ?? "—"} to ${activity.newValue ?? "—"}`;
    }
    if (activity.field === "priority") {
      return `changed priority of "${taskTitle}" to ${activity.newValue ?? "—"}`;
    }
    if (activity.field === "assignee") {
      return `updated assignee on "${taskTitle}"`;
    }
    return `updated ${activity.field} on "${taskTitle}"`;
  }

  if (activity.action === "deleted") {
    return `deleted task "${taskTitle}"`;
  }

  return `${activity.action} on "${taskTitle}"`;
}

function getInitials(name: string | null, email: string): string {
  if (name) {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  }
  return email[0].toUpperCase();
}

export function RecentActivity({ activities, isLoading }: RecentActivityProps) {
  if (isLoading) {
    return (
      <Card className="border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold">
            Activité récente
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex items-start gap-3">
              <Skeleton className="h-8 w-8 rounded-full" />
              <div className="flex-1 space-y-1">
                <Skeleton className="h-3 w-3/4" />
                <Skeleton className="h-3 w-16" />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border/50">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold">
          Activité récente
        </CardTitle>
      </CardHeader>
      <CardContent>
        {activities.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8">
            <Activity className="mb-2 h-8 w-8 text-muted-foreground/50" />
            <p className="text-sm text-muted-foreground">Aucune activité récente</p>
          </div>
        ) : (
          <div className="space-y-4">
            {activities.map((activity) => {
              const ActionIcon = getActionIcon(activity.action);
              return (
                <div key={activity.id} className="flex items-start gap-3">
                  <Avatar className="h-8 w-8 shrink-0">
                    <AvatarImage src={activity.user.image ?? undefined} />
                    <AvatarFallback className="bg-primary/10 text-[10px] text-primary">
                      {getInitials(activity.user.name, activity.user.email)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm leading-snug">
                      <span className="font-medium">
                        {activity.user.name ?? activity.user.email}
                      </span>{" "}
                      <span className="text-muted-foreground">
                        {getActivityDescription(activity)}
                      </span>
                    </p>
                    <p className="mt-0.5 text-xs text-muted-foreground/70">
                      {formatDistanceToNow(new Date(activity.createdAt), {
                        addSuffix: true,
                      })}
                    </p>
                  </div>
                  <div className="mt-0.5 shrink-0 rounded bg-muted p-1">
                    <ActionIcon className="h-3 w-3 text-muted-foreground" />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
