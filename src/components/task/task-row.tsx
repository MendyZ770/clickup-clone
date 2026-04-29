"use client";

import { MessageSquare, GitBranch, Lock } from "lucide-react";
import useSWR from "swr";
import { Checkbox } from "@/components/ui/checkbox";
import { PriorityBadge } from "./priority-badge";
import { StatusBadge } from "./status-badge";
import { AssigneeSelector } from "./assignee-selector";
import { DueDatePicker } from "./due-date-picker";
import { TaskActionMenu } from "./task-action-menu";
import { useUpdateTask } from "@/hooks/use-tasks";
import { useModal } from "@/hooks/use-modal";
import { cn } from "@/lib/utils";
import type { TaskSummary } from "@/types";

const statusFetcher = (url: string) =>
  fetch(url).then((r) => {
    if (!r.ok) throw new Error("Failed to fetch");
    return r.json();
  });

interface TaskRowProps {
  task: TaskSummary;
  workspaceId: string;
  onUpdated?: () => void;
  className?: string;
}

export function TaskRow({
  task,
  workspaceId,
  onUpdated,
  className,
}: TaskRowProps) {
  const { openTaskModal } = useModal();
  const { updateTask } = useUpdateTask();

  const { data: statuses } = useSWR<
    { id: string; name: string; color: string; type: string; order: number }[]
  >(`/api/lists/${task.listId}/statuses`, statusFetcher);

  const isDone =
    task.status.type === "done" || task.status.type === "closed";

  const handleUpdate = async (data: Record<string, unknown>) => {
    await updateTask(task.id, data as Parameters<typeof updateTask>[1]);
    onUpdated?.();
  };

  return (
    <div
      className={cn(
        "group flex items-center gap-2 border-b px-3 py-1.5 text-sm transition-colors hover:bg-muted/40",
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
        className="h-4 w-4"
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
          <Lock className="h-3 w-3 shrink-0 text-amber-500" aria-label="Verrouillée" />
        )}
        <span className="truncate">{task.title}</span>
      </button>

      {/* Subtask / comment counts */}
      {(task._count.subtasks > 0 || task._count.comments > 0) && (
        <div className="hidden sm:flex items-center gap-2 text-xs text-muted-foreground">
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
      )}

      {/* Tags */}
      {task.taskTags.length > 0 && (
        <div className="hidden md:flex items-center gap-1">
          {task.taskTags.slice(0, 3).map((tt) => (
            <span
              key={tt.tag.id}
              className="h-2 w-2 rounded-full"
              style={{ backgroundColor: tt.tag.color }}
              title={tt.tag.name}
            />
          ))}
          {task.taskTags.length > 3 && (
            <span className="text-[10px] text-muted-foreground">
              +{task.taskTags.length - 3}
            </span>
          )}
        </div>
      )}

      {/* Status */}
      <StatusBadge
        status={task.status}
        listId={task.listId}
        onChange={(statusId) => handleUpdate({ statusId })}
      />

      {/* Priority */}
      <PriorityBadge
        priority={task.priority}
        onChange={(priority) => handleUpdate({ priority })}
      />

      {/* Due Date */}
      <DueDatePicker
        date={task.dueDate}
        onChange={(dueDate) => handleUpdate({ dueDate })}
        className="hidden lg:flex"
      />

      {/* Assignee */}
      <AssigneeSelector
        assignee={task.assignee}
        workspaceId={workspaceId}
        onChange={(assigneeId) => handleUpdate({ assigneeId })}
      />

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
