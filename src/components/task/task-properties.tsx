"use client";

import { format } from "date-fns";
import {
  CircleDot,
  Flag,
  User,
  CalendarDays,
  CalendarRange,
  Tag,
  Clock,
  Timer,
  Hourglass,
  Link2,
} from "lucide-react";
import { useState } from "react";
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
        Détails
      </h3>

      {/* Status */}
      <div className="space-y-1.5">
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <CircleDot className="h-3.5 w-3.5" />
          <span>Statut</span>
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
          <span>Priorité</span>
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
          <span>Assigné à</span>
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
          <span>Échéance</span>
        </div>
        <DueDatePicker
          date={task.dueDate}
          onChange={(dueDate) => onUpdate({ dueDate })}
        />
      </div>

      {/* Start Date */}
      <div className="space-y-1.5">
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <CalendarRange className="h-3.5 w-3.5" />
          <span>Date de début</span>
        </div>
        <DueDatePicker
          date={task.startDate}
          onChange={(startDate) => onUpdate({ startDate })}
        />
      </div>

      {/* Time Estimate */}
      <div className="space-y-1.5">
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Hourglass className="h-3.5 w-3.5" />
          <span>Estimation</span>
        </div>
        <TimeEstimateInput
          value={task.timeEstimate}
          onChange={(timeEstimate) => onUpdate({ timeEstimate })}
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
            <span>Temps suivi</span>
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
            <span>Dépendances</span>
          </div>
          <div className="text-sm space-y-0.5">
            {dependencyCount > 0 && (
              <span className="block text-xs text-orange-500">
                En attente de {dependencyCount} tâche{dependencyCount > 1 ? "s" : ""}
              </span>
            )}
            {dependentCount > 0 && (
              <span className="block text-xs text-red-500">
                Bloque {dependentCount} tâche{dependentCount > 1 ? "s" : ""}
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
            Champs personnalisés
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
              +{fields.length - 5} champs supplémentaires
            </p>
          )}
        </>
      )}

      <Separator />

      {/* Dates info */}
      <div className="space-y-2">
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Clock className="h-3.5 w-3.5" />
          <span>Créé le</span>
          <span className="ml-auto text-foreground">
            {format(new Date(task.createdAt), "d MMM yyyy")}
          </span>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Clock className="h-3.5 w-3.5" />
          <span>Modifié le</span>
          <span className="ml-auto text-foreground">
            {format(new Date(task.updatedAt), "d MMM yyyy")}
          </span>
        </div>
        {task.creator && (
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <User className="h-3.5 w-3.5" />
            <span>Créé par</span>
            <span className="ml-auto text-foreground truncate max-w-[120px]">
              {task.creator.name ?? task.creator.email}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

function TimeEstimateInput({
  value,
  onChange,
}: {
  value: number | null | undefined;
  onChange: (val: number | null) => void;
}) {
  const [editing, setEditing] = useState(false);
  const hours = value ? Math.floor(value / 3600) : 0;
  const minutes = value ? Math.floor((value % 3600) / 60) : 0;

  const [h, setH] = useState(String(hours));
  const [m, setM] = useState(String(minutes));

  const handleSave = () => {
    const totalSeconds = (parseInt(h) || 0) * 3600 + (parseInt(m) || 0) * 60;
    onChange(totalSeconds > 0 ? totalSeconds : null);
    setEditing(false);
  };

  if (editing) {
    return (
      <div className="flex items-center gap-1">
        <input
          type="number"
          min={0}
          value={h}
          onChange={(e) => setH(e.target.value)}
          className="w-12 h-6 rounded border px-1 text-xs text-center"
          placeholder="h"
          autoFocus
        />
        <span className="text-[10px] text-muted-foreground">h</span>
        <input
          type="number"
          min={0}
          max={59}
          value={m}
          onChange={(e) => setM(e.target.value)}
          className="w-12 h-6 rounded border px-1 text-xs text-center"
          placeholder="m"
        />
        <span className="text-[10px] text-muted-foreground">m</span>
        <button onClick={handleSave} className="text-[10px] text-primary hover:underline ml-1">
          OK
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={() => {
        setH(String(hours));
        setM(String(minutes));
        setEditing(true);
      }}
      className="text-sm hover:text-primary transition-colors"
    >
      {value ? `${hours}h ${minutes > 0 ? `${minutes}m` : ""}` : "Aucune"}
    </button>
  );
}
