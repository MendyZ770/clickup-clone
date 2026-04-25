"use client";

import { format, isToday, isPast } from "date-fns";
import { CalendarIcon, MessageSquare, GitBranch } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useModal } from "@/hooks/use-modal";
import { cn } from "@/lib/utils";
import type { TaskSummary } from "@/types";

const PRIORITY_COLORS: Record<string, string> = {
  urgent: "bg-red-500",
  high: "bg-orange-500",
  normal: "bg-blue-500",
  low: "bg-gray-400",
};

interface TaskCardProps {
  task: TaskSummary;
  className?: string;
}

export function TaskCard({ task, className }: TaskCardProps) {
  const { openTaskModal } = useModal();
  const dateObj = task.dueDate ? new Date(task.dueDate) : null;
  const isOverdue = dateObj ? isPast(dateObj) && !isToday(dateObj) : false;
  const isDueToday = dateObj ? isToday(dateObj) : false;

  return (
    <div
      onClick={() => openTaskModal(task.id)}
      className={cn(
        "group relative cursor-pointer rounded-lg border bg-card p-3 shadow-sm transition-all hover:shadow-md",
        className
      )}
    >
      {/* Priority strip */}
      <div
        className={cn(
          "absolute left-0 top-2 bottom-2 w-1 rounded-full",
          PRIORITY_COLORS[task.priority] ?? PRIORITY_COLORS.normal
        )}
      />

      <div className="pl-2.5 space-y-2">
        {/* Title */}
        <p className="text-sm font-medium leading-snug line-clamp-2">
          {task.title}
        </p>

        {/* Tags */}
        {task.taskTags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {task.taskTags.slice(0, 4).map((tt) => (
              <span
                key={tt.tag.id}
                className="inline-block h-1.5 w-1.5 rounded-full"
                style={{ backgroundColor: tt.tag.color }}
                title={tt.tag.name}
              />
            ))}
          </div>
        )}

        {/* Bottom row: due date, counts, assignee */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            {dateObj && (
              <span
                className={cn(
                  "inline-flex items-center gap-0.5",
                  isOverdue && "text-red-500",
                  isDueToday && "text-orange-500"
                )}
              >
                <CalendarIcon className="h-3 w-3" />
                {format(dateObj, "MMM d")}
              </span>
            )}
            {task._count.subtasks > 0 && (
              <span className="inline-flex items-center gap-0.5">
                <GitBranch className="h-3 w-3" />
                {task._count.subtasks}
              </span>
            )}
            {task._count.comments > 0 && (
              <span className="inline-flex items-center gap-0.5">
                <MessageSquare className="h-3 w-3" />
                {task._count.comments}
              </span>
            )}
          </div>

          {task.assignee && (
            <Avatar className="h-5 w-5">
              <AvatarImage src={task.assignee.image ?? undefined} />
              <AvatarFallback className="text-[8px]">
                {(task.assignee.name ?? task.assignee.email)
                  .slice(0, 2)
                  .toUpperCase()}
              </AvatarFallback>
            </Avatar>
          )}
        </div>
      </div>
    </div>
  );
}
