import { memo } from "react";

import { format, isToday, isPast } from "date-fns";
import { fr } from "date-fns/locale";
import { CalendarIcon, MessageSquare, GitBranch, Lock } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { TaskActionMenu } from "./task-action-menu";
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
  onAction?: () => void;
}

function TaskCardComponent({ task, className, onAction }: TaskCardProps) {
  const { openTaskModal } = useModal();
  const dateObj = task.dueDate ? new Date(task.dueDate) : null;
  const isOverdue = dateObj ? isPast(dateObj) && !isToday(dateObj) : false;
  const isDueToday = dateObj ? isToday(dateObj) : false;

  return (
    <div
      onClick={() => openTaskModal(task.id, task.locked)}
      className={cn(
        "group relative cursor-pointer rounded-lg border bg-card p-2 sm:p-3 shadow-sm transition-all hover:shadow-md",
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

      <div className="pl-2.5 space-y-1.5 sm:space-y-2">
        {/* Title + Actions */}
        <div className="flex items-start justify-between gap-1">
          <p className="text-sm font-medium leading-snug line-clamp-2 flex-1 inline-flex items-start gap-1.5">
            {task.locked && (
              <Lock className="h-4 w-4 shrink-0 mt-0.5 text-amber-500" aria-label="Verrouillée" />
            )}
            <span>{task.title}</span>
          </p>
          <TaskActionMenu
            taskId={task.id}
            currentListId={task.listId}
            locked={task.locked}
            onAction={onAction}
          />
        </div>

        {/* Tags */}
        {task.taskTags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {task.taskTags.slice(0, 4).map((tt) => (
              <span
                key={tt.tag.id}
                className="inline-block h-2 w-2 rounded-full"
                style={{ backgroundColor: tt.tag.color }}
                title={tt.tag.name}
              />
            ))}
          </div>
        )}

        {/* Bottom row: due date, counts, assignee */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            {dateObj && (
              <span
                className={cn(
                  "inline-flex items-center gap-0.5",
                  isOverdue && "text-red-500",
                  isDueToday && "text-orange-500"
                )}
              >
                <CalendarIcon className="h-4 w-4" />
                {format(dateObj, "d MMM", { locale: fr })}
              </span>
            )}
            {task._count.subtasks > 0 && (
              <span className="inline-flex items-center gap-0.5">
                <GitBranch className="h-4 w-4" />
                {task._count.subtasks}
              </span>
            )}
            {task._count.comments > 0 && (
              <span className="inline-flex items-center gap-0.5">
                <MessageSquare className="h-4 w-4" />
                {task._count.comments}
              </span>
            )}
          </div>

          {task.assignees && task.assignees.length > 0 && (
            <div className="flex -space-x-2 overflow-hidden">
              {task.assignees.slice(0, 3).map((a) => (
                <Avatar key={a.userId} className="h-6 w-6 border-2 border-background">
                  <AvatarImage src={a.user.image ?? undefined} />
                  <AvatarFallback className="text-[10px]">
                    {(a.user.name ?? a.user.email).slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              ))}
              {task.assignees.length > 3 && (
                <div className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-background bg-muted text-[10px] font-medium">
                  +{task.assignees.length - 3}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export const TaskCard = memo(TaskCardComponent);
