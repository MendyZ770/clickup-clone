"use client";

import { format } from "date-fns";
import {
  CircleDot,
  Flag,
  User,
  CalendarDays,
  Tag,
  Clock,
} from "lucide-react";
import { StatusBadge } from "./status-badge";
import { PriorityBadge } from "./priority-badge";
import { AssigneeSelector } from "./assignee-selector";
import { DueDatePicker } from "./due-date-picker";
import { TagSelector } from "./tag-selector";
import { Separator } from "@/components/ui/separator";
import type { TaskWithDetails } from "@/types";

interface TaskPropertiesProps {
  task: TaskWithDetails;
  workspaceId: string;
  onUpdate: (data: Record<string, unknown>) => void;
  onTagsChanged: () => void;
}

export function TaskProperties({
  task,
  workspaceId,
  onUpdate,
  onTagsChanged,
}: TaskPropertiesProps) {
  return (
    <div className="space-y-4">
      <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        Details
      </h3>

      {/* Status */}
      <div className="space-y-1.5">
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <CircleDot className="h-3.5 w-3.5" />
          <span>Status</span>
        </div>
        <StatusBadge
          status={task.status}
          listId={task.listId}
          onChange={(statusId) => onUpdate({ statusId })}
        />
      </div>

      {/* Priority */}
      <div className="space-y-1.5">
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Flag className="h-3.5 w-3.5" />
          <span>Priority</span>
        </div>
        <PriorityBadge
          priority={task.priority}
          onChange={(priority) => onUpdate({ priority })}
          showLabel
        />
      </div>

      {/* Assignee */}
      <div className="space-y-1.5">
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <User className="h-3.5 w-3.5" />
          <span>Assignee</span>
        </div>
        <AssigneeSelector
          assignee={task.assignee}
          workspaceId={workspaceId}
          onChange={(assigneeId) => onUpdate({ assigneeId })}
          size="md"
        />
      </div>

      {/* Due Date */}
      <div className="space-y-1.5">
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <CalendarDays className="h-3.5 w-3.5" />
          <span>Due Date</span>
        </div>
        <DueDatePicker
          date={task.dueDate}
          onChange={(dueDate) => onUpdate({ dueDate })}
        />
      </div>

      {/* Tags */}
      <div className="space-y-1.5">
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Tag className="h-3.5 w-3.5" />
          <span>Tags</span>
        </div>
        <TagSelector
          taskTags={task.taskTags}
          taskId={task.id}
          workspaceId={workspaceId}
          onTagAdded={onTagsChanged}
          onTagRemoved={onTagsChanged}
        />
      </div>

      <Separator />

      {/* Dates info */}
      <div className="space-y-2">
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Clock className="h-3.5 w-3.5" />
          <span>Created</span>
          <span className="ml-auto text-foreground">
            {format(new Date(task.createdAt), "MMM d, yyyy")}
          </span>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Clock className="h-3.5 w-3.5" />
          <span>Updated</span>
          <span className="ml-auto text-foreground">
            {format(new Date(task.updatedAt), "MMM d, yyyy")}
          </span>
        </div>
        {task.creator && (
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <User className="h-3.5 w-3.5" />
            <span>Created by</span>
            <span className="ml-auto text-foreground truncate max-w-[120px]">
              {task.creator.name ?? task.creator.email}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
