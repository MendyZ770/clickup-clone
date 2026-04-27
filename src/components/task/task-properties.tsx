"use client";

import { format } from "date-fns";
import {
  CircleDot,
  Flag,
  User,
  CalendarDays,
  Tag,
  Clock,
  Timer,
  Link2,
} from "lucide-react";
import { StatusBadge } from "./status-badge";
import { PriorityBadge } from "./priority-badge";
import { AssigneeSelector } from "./assignee-selector";
import { DueDatePicker } from "./due-date-picker";
import { TagSelector } from "./tag-selector";
import { Separator } from "@/components/ui/separator";
import { useTimeEntries } from "@/hooks/use-time-entries";
import { formatSecondsShort } from "@/components/time-tracking/timer-display";
import { useCustomFieldsSidebar } from "@/hooks/use-custom-fields";
import { useDependencyCount } from "@/hooks/use-dependencies";
import { CustomFieldRenderer, getFieldTypeIcon } from "@/components/custom-fields/custom-field-renderer";
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
  const { fields, valueMap, handleChange } = useCustomFieldsSidebar(task.id, workspaceId);
  const { dependencyCount, dependentCount } = useDependencyCount(task.id);
  const { entries } = useTimeEntries(task.id);
  const totalTrackedSeconds = entries
    .filter((e) => e.duration != null)
    .reduce((sum, e) => sum + (e.duration ?? 0), 0);

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

      {/* Tracked Time */}
      {totalTrackedSeconds > 0 && (
        <div className="space-y-1.5">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Timer className="h-3.5 w-3.5" />
            <span>Time Tracked</span>
          </div>
          <div className="text-sm font-medium font-mono">
            {formatSecondsShort(totalTrackedSeconds)}
          </div>
        </div>
      )}

      {/* Dependencies */}
      {(dependencyCount > 0 || dependentCount > 0) && (
        <div className="space-y-1.5">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Link2 className="h-3.5 w-3.5" />
            <span>Dependencies</span>
          </div>
          <div className="text-sm space-y-0.5">
            {dependencyCount > 0 && (
              <span className="block text-xs text-orange-500">
                Waiting on {dependencyCount} task{dependencyCount > 1 ? "s" : ""}
              </span>
            )}
            {dependentCount > 0 && (
              <span className="block text-xs text-red-500">
                Blocking {dependentCount} task{dependentCount > 1 ? "s" : ""}
              </span>
            )}
          </div>
        </div>
      )}

      {/* Custom Fields */}
      {fields && fields.length > 0 && (
        <>
          <Separator />
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Custom Fields
          </h3>
          {fields.slice(0, 5).map((field) => {
            const Icon = getFieldTypeIcon(field.type);
            const currentValue = valueMap.get(field.id) ?? null;
            const parsedOptions = field.options
              ? (() => { try { return JSON.parse(field.options); } catch { return []; } })()
              : [];
            return (
              <div key={field.id} className="space-y-1.5">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Icon className="h-3.5 w-3.5" />
                  <span>{field.name}</span>
                </div>
                <CustomFieldRenderer
                  fieldType={field.type}
                  fieldName={field.name}
                  value={currentValue}
                  options={parsedOptions}
                  onChange={(val) => handleChange(field.id, val)}
                />
              </div>
            );
          })}
          {fields.length > 5 && (
            <p className="text-xs text-muted-foreground">
              +{fields.length - 5} more fields
            </p>
          )}
        </>
      )}

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
