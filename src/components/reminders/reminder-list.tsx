"use client";

import { useMemo } from "react";
import { format, isToday, isBefore, isThisWeek, startOfDay } from "date-fns";
import { Bell, Trash2, ExternalLink } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import type { Reminder } from "@/hooks/use-reminders";

interface ReminderListProps {
  reminders: Reminder[];
  isLoading: boolean;
  onToggleComplete: (id: string, completed: boolean) => void;
  onDelete: (id: string) => void;
}

interface GroupedReminders {
  overdue: Reminder[];
  today: Reminder[];
  thisWeek: Reminder[];
  later: Reminder[];
}

function groupReminders(reminders: Reminder[]): GroupedReminders {
  const now = startOfDay(new Date());

  return reminders.reduce<GroupedReminders>(
    (groups, reminder) => {
      const remindDate = new Date(reminder.remindAt);

      if (reminder.completed) {
        // Completed reminders go to "later" group for display purposes
        groups.later.push(reminder);
      } else if (isBefore(remindDate, now) && !isToday(remindDate)) {
        groups.overdue.push(reminder);
      } else if (isToday(remindDate)) {
        groups.today.push(reminder);
      } else if (isThisWeek(remindDate, { weekStartsOn: 1 })) {
        groups.thisWeek.push(reminder);
      } else {
        groups.later.push(reminder);
      }

      return groups;
    },
    { overdue: [], today: [], thisWeek: [], later: [] }
  );
}

function ReminderItem({
  reminder,
  onToggleComplete,
  onDelete,
  colorClass,
}: {
  reminder: Reminder;
  onToggleComplete: (id: string, completed: boolean) => void;
  onDelete: (id: string) => void;
  colorClass: string;
}) {
  return (
    <div
      className={`flex items-start gap-3 p-4 transition-colors hover:bg-muted/50 ${
        reminder.completed ? "opacity-60" : ""
      }`}
    >
      <Checkbox
        checked={reminder.completed}
        onCheckedChange={(checked) =>
          onToggleComplete(reminder.id, checked as boolean)
        }
        className="mt-0.5"
      />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span
            className={`text-sm font-medium ${
              reminder.completed ? "line-through text-muted-foreground" : ""
            }`}
          >
            {reminder.title}
          </span>
          {reminder.task && (
            <span className="inline-flex items-center gap-1 rounded-md bg-muted px-2 py-0.5 text-xs text-muted-foreground">
              <ExternalLink className="h-3 w-3" />
              {reminder.task.title}
            </span>
          )}
        </div>
        {reminder.description && (
          <p className="mt-0.5 text-xs text-muted-foreground line-clamp-1">
            {reminder.description}
          </p>
        )}
        <p className={`mt-1 text-xs ${colorClass}`}>
          {format(new Date(reminder.remindAt), "d MMM yyyy 'à' HH:mm")}
        </p>
      </div>
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8 text-muted-foreground hover:text-destructive"
        onClick={() => onDelete(reminder.id)}
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  );
}

function ReminderGroup({
  title,
  reminders,
  onToggleComplete,
  onDelete,
  colorClass,
  dotColor,
}: {
  title: string;
  reminders: Reminder[];
  onToggleComplete: (id: string, completed: boolean) => void;
  onDelete: (id: string) => void;
  colorClass: string;
  dotColor: string;
}) {
  if (reminders.length === 0) return null;

  return (
    <div>
      <div className="flex items-center gap-2 px-4 py-2 bg-muted/30">
        <div className={`h-2 w-2 rounded-full ${dotColor}`} />
        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {title}
        </span>
        <span className="text-xs text-muted-foreground">
          ({reminders.length})
        </span>
      </div>
      <div className="divide-y divide-border/50">
        {reminders.map((reminder) => (
          <ReminderItem
            key={reminder.id}
            reminder={reminder}
            onToggleComplete={onToggleComplete}
            onDelete={onDelete}
            colorClass={colorClass}
          />
        ))}
      </div>
    </div>
  );
}

export function ReminderList({
  reminders,
  isLoading,
  onToggleComplete,
  onDelete,
}: ReminderListProps) {
  const grouped = useMemo(() => groupReminders(reminders), [reminders]);

  if (isLoading) {
    return (
      <div className="rounded-lg border border-border/50">
        <div className="space-y-0 divide-y divide-border/50">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex items-start gap-3 p-4">
              <Skeleton className="h-4 w-4 rounded" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/4" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (reminders.length === 0) {
    return (
      <div className="rounded-lg border border-border/50">
        <div className="flex flex-col items-center justify-center py-16">
          <div className="mb-4 rounded-full bg-muted p-4">
            <Bell className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="mb-1 text-lg font-semibold">Aucun rappel</h3>
          <p className="max-w-sm text-center text-sm text-muted-foreground">
            Créez un rappel pour rester organisé avec vos tâches et échéances.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-border/50 overflow-hidden">
      <ReminderGroup
        title="En retard"
        reminders={grouped.overdue}
        onToggleComplete={onToggleComplete}
        onDelete={onDelete}
        colorClass="text-red-500"
        dotColor="bg-red-500"
      />
      <ReminderGroup
        title="Aujourd'hui"
        reminders={grouped.today}
        onToggleComplete={onToggleComplete}
        onDelete={onDelete}
        colorClass="text-orange-500"
        dotColor="bg-orange-500"
      />
      <ReminderGroup
        title="Cette semaine"
        reminders={grouped.thisWeek}
        onToggleComplete={onToggleComplete}
        onDelete={onDelete}
        colorClass="text-muted-foreground"
        dotColor="bg-blue-500"
      />
      <ReminderGroup
        title="Plus tard"
        reminders={grouped.later}
        onToggleComplete={onToggleComplete}
        onDelete={onDelete}
        colorClass="text-muted-foreground"
        dotColor="bg-gray-400"
      />
    </div>
  );
}
