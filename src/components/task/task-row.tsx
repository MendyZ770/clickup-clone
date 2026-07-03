"use client";

import { memo, useCallback, useMemo } from "react";
import { MessageSquare, GitBranch, Lock, User as UserIcon } from "lucide-react";
import useSWR from "swr";
import { Checkbox } from "@/components/ui/checkbox";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { PriorityBadge } from "./priority-badge";
import { StatusBadge } from "./status-badge";
// import { AssigneeSelector } from "./assignee-selector";
import { DueDatePicker } from "./due-date-picker";
import { TaskActionMenu } from "./task-action-menu";
import { useUpdateTask } from "@/hooks/use-tasks";
import { useModal } from "@/hooks/use-modal";
import { cn } from "@/lib/utils";
import type { TaskSummary } from "@/types";

const PRIORITY_DOT_COLORS: Record<string, string> = {
  urgent: "bg-red-500",
  high: "bg-orange-500",
  normal: "bg-blue-500",
  low: "bg-gray-400",
};

interface TaskRowProps {
  task: TaskSummary;
  workspaceId: string;
  onUpdated?: () => void;
  className?: string;
}

function TaskRowComponent({
  task,
  workspaceId,
  onUpdated,
  className,
}: TaskRowProps) {
  const { openTaskModal } = useModal();
  const { updateTask } = useUpdateTask();

  const { data: statuses } = useSWR<
    { id: string; name: string; color: string; type: string; order: number }[]
  >(`/api/lists/${task.listId}/statuses`);

  const isDone = useMemo(
    () => task.status.type === "done" || task.status.type === "closed",
    [task.status.type]
  );

  const handleUpdate = useCallback(
    async (data: Record<string, unknown>) => {
      await updateTask(task.id, data as Parameters<typeof updateTask>[1]);
      onUpdated?.();
    },
    [task.id, updateTask, onUpdated]
  );

  return (
    <div
      className={cn(
        "group flex items-center gap-2 border border-border/20 rounded-xl px-3 py-2 text-sm transition-all duration-300 hover:bg-card/60 backdrop-blur-md hover:shadow-md hover:-translate-y-0.5 animate-fade-in-up bg-background/40 mb-1.5",
        className
      )}
    >
      {/* Checkbox */}
      <Checkbox
        checked={isDone}
        onCheckedChange={async (checked) => {
          if (!statuses) return;
          if (checked) {
            const doneStatus = statuses.find((s) => s.type === "done");
            if (doneStatus) await handleUpdate({ statusId: doneStatus.id });
          } else {
            const todoStatus = statuses.find((s) => s.type === "todo") ?? statuses[0];
            if (todoStatus) await handleUpdate({ statusId: todoStatus.id });
          }
        }}
        className="h-5 w-5"
      />

      {/* Title */}
      <button
        onClick={() => openTaskModal(task.id, task.locked)}
        className={cn(
          "flex-1 truncate text-left font-medium hover:text-primary transition-colors inline-flex items-center gap-1.5",
          isDone && "line-through text-muted-foreground"
        )}
      >
        {task.locked && (
          <Lock className="h-4 w-4 shrink-0 text-amber-500" aria-label="Verrouillée" />
        )}
        <span className="truncate">{task.title}</span>
      </button>

      {/* Subtask / comment counts */}
      {(task._count.subtasks > 0 || task._count.comments > 0) && (
        <div className="hidden sm:flex items-center gap-2 text-sm text-muted-foreground">
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
      )}

      {/* Tags */}
      {task.taskTags.length > 0 && (
        <div className="hidden md:flex items-center gap-1">
          {task.taskTags.slice(0, 3).map((tt) => (
            <span
              key={tt.tag.id}
              className="h-2.5 w-2.5 rounded-full"
              style={{ backgroundColor: tt.tag.color }}
              title={tt.tag.name}
            />
          ))}
          {task.taskTags.length > 3 && (
            <span className="text-xs text-muted-foreground">
              +{task.taskTags.length - 3}
            </span>
          )}
        </div>
      )}

      {/* Mobile mini dots */}
      <div className="flex items-center gap-1.5 sm:hidden shrink-0">
        <span
          className="h-2.5 w-2.5 rounded-full"
          style={{ backgroundColor: task.status.color }}
          title={task.status.name}
        />
        <span
          className={cn("h-2.5 w-2.5 rounded-full", PRIORITY_DOT_COLORS[task.priority] ?? "bg-gray-400")}
          title={task.priority}
        />
      </div>

      {/* Status — hidden on mobile */}
      <div className="hidden sm:block">
        <StatusBadge
          status={task.status}
          listId={task.listId}
          onChange={(statusId) => handleUpdate({ statusId })}
        />
      </div>

      {/* Priority — hidden on mobile */}
      <div className="hidden sm:block">
        <PriorityBadge
          priority={task.priority}
          onChange={(priority) => handleUpdate({ priority })}
        />
      </div>

      {/* Due Date */}
      <DueDatePicker
        date={task.dueDate}
        onChange={(dueDate) => handleUpdate({ dueDate })}
        className="hidden lg:flex"
      />

      {/* Assignee — hidden on mobile */}
      <div className="hidden sm:flex items-center">
        {task.assignees && task.assignees.length > 0 ? (
          <div className="flex -space-x-2 overflow-hidden">
            {task.assignees.slice(0, 3).map((a) => (
              <Avatar key={a.userId} className="h-7 w-7 border-2 border-background">
                <AvatarImage src={a.user.image ?? undefined} />
                <AvatarFallback className="text-[10px]">
                  {(a.user.name ?? a.user.email).slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
            ))}
            {task.assignees.length > 3 && (
              <div className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-background bg-muted text-[10px] font-medium">
                +{task.assignees.length - 3}
              </div>
            )}
          </div>
        ) : (
          <div className="h-7 w-7 rounded-full border border-dashed flex items-center justify-center text-muted-foreground/50">
            <UserIcon className="h-4 w-4" />
          </div>
        )}
      </div>

      {/* Action menu */}
      <TaskActionMenu
        taskId={task.id}
        currentListId={task.listId}
        locked={task.locked}
        onAction={onUpdated}
      />
    </div>
  );
}

export const TaskRow = memo(TaskRowComponent);
