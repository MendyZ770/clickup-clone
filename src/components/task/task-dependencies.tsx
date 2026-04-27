"use client";

import { useState, useCallback } from "react";
import useSWR from "swr";
import {
  Link2,
  Plus,
  X,
  Loader2,
  Search,
  AlertTriangle,
  Ban,
  Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useModal } from "@/hooks/use-modal";
import { cn } from "@/lib/utils";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

interface TaskInfo {
  id: string;
  title: string;
  priority: string;
  status: { id: string; name: string; color: string; type: string };
}

interface Dependency {
  id: string;
  type: string;
  dependentTask: TaskInfo;
  dependencyTask: TaskInfo;
}

interface DependencyData {
  dependencies: Dependency[];
  dependents: Dependency[];
}

interface SearchTask {
  id: string;
  title: string;
  status: { name: string; color: string; type: string };
}

interface TaskDependenciesProps {
  taskId: string;
  workspaceId: string;
  taskStatus?: { type: string };
}

const TYPE_CONFIG = {
  blocking: {
    label: "Blocking",
    icon: Ban,
    color: "text-red-500",
    bgColor: "bg-red-50 dark:bg-red-950/20",
    borderColor: "border-red-200 dark:border-red-800",
  },
  waiting_on: {
    label: "Waiting on",
    icon: Clock,
    color: "text-orange-500",
    bgColor: "bg-orange-50 dark:bg-orange-950/20",
    borderColor: "border-orange-200 dark:border-orange-800",
  },
  linked_to: {
    label: "Linked to",
    icon: Link2,
    color: "text-blue-500",
    bgColor: "bg-blue-50 dark:bg-blue-950/20",
    borderColor: "border-blue-200 dark:border-blue-800",
  },
};

export function TaskDependencies({
  taskId,
  workspaceId,
  taskStatus,
}: TaskDependenciesProps) {
  void taskStatus;
  const { openTaskModal } = useModal();
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedType, setSelectedType] = useState<string>("waiting_on");
  const [creating, setCreating] = useState(false);
  const [removing, setRemoving] = useState<string | null>(null);

  const { data, mutate } = useSWR<DependencyData>(
    `/api/tasks/${taskId}/dependencies`,
    fetcher
  );

  // Search tasks for dependency
  const { data: searchResults } = useSWR<SearchTask[]>(
    searchQuery.length >= 2
      ? `/api/tasks?search=${encodeURIComponent(searchQuery)}&workspaceId=${workspaceId}`
      : null,
    fetcher
  );

  const handleAdd = useCallback(
    async (targetTaskId: string) => {
      setCreating(true);
      try {
        const res = await fetch(`/api/tasks/${taskId}/dependencies`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ targetTaskId, type: selectedType }),
        });
        if (res.ok) {
          mutate();
          setAddDialogOpen(false);
          setSearchQuery("");
        }
      } catch (error) {
        console.error("Failed to add dependency:", error);
      } finally {
        setCreating(false);
      }
    },
    [taskId, selectedType, mutate]
  );

  const handleRemove = useCallback(
    async (dependencyId: string) => {
      setRemoving(dependencyId);
      try {
        await fetch(
          `/api/tasks/${taskId}/dependencies?dependencyId=${dependencyId}`,
          { method: "DELETE" }
        );
        mutate();
      } catch (error) {
        console.error("Failed to remove dependency:", error);
      } finally {
        setRemoving(null);
      }
    },
    [taskId, mutate]
  );

  // Build categorized lists
  const blocking: Dependency[] = [];   // Tasks this task is blocking (this task appears as dependencyTask)
  const waitingOn: Dependency[] = [];  // Tasks this task is waiting on (this task appears as dependentTask)
  const linked: Dependency[] = [];     // Linked tasks

  if (data) {
    // dependencies: where this task is the dependent (depends on others)
    for (const dep of data.dependencies) {
      if (dep.type === "waiting_on") {
        waitingOn.push(dep);
      } else if (dep.type === "linked_to") {
        linked.push(dep);
      }
    }
    // dependents: where others depend on this task
    for (const dep of data.dependents) {
      if (dep.type === "blocking" || dep.type === "waiting_on") {
        blocking.push(dep);
      } else if (dep.type === "linked_to") {
        // avoid duplicates for linked - check if already in linked
        if (!linked.find((l) => l.id === dep.id)) {
          linked.push(dep);
        }
      }
    }
  }

  const totalDeps = blocking.length + waitingOn.length + linked.length;

  // Check if there are incomplete blocking dependencies (waiting on tasks that aren't done)
  const hasIncompleteBlockers = waitingOn.some(
    (dep) =>
      dep.dependencyTask.status.type !== "done" &&
      dep.dependencyTask.status.type !== "closed"
  );

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">
          Dependencies
          {totalDeps > 0 && (
            <span className="ml-1.5 text-xs font-normal text-muted-foreground">
              ({totalDeps})
            </span>
          )}
        </h3>
        <Button
          variant="ghost"
          size="sm"
          className="h-7 text-xs"
          onClick={() => setAddDialogOpen(true)}
        >
          <Plus className="h-3 w-3 mr-1" />
          Add
        </Button>
      </div>

      {hasIncompleteBlockers && (
        <div className="flex items-center gap-2 rounded-md bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-800 px-3 py-2">
          <AlertTriangle className="h-4 w-4 text-orange-500 shrink-0" />
          <span className="text-xs text-orange-700 dark:text-orange-400">
            This task is waiting on incomplete tasks
          </span>
        </div>
      )}

      {totalDeps === 0 ? (
        <p className="text-xs text-muted-foreground">
          No dependencies. Add one to track task relationships.
        </p>
      ) : (
        <div className="space-y-2">
          {/* Blocking section */}
          {blocking.length > 0 && (
            <DependencyGroup
              label="Blocking"
              deps={blocking}
              taskId={taskId}
              type="blocking"
              onRemove={handleRemove}
              onOpen={openTaskModal}
              removing={removing}
            />
          )}

          {/* Waiting on section */}
          {waitingOn.length > 0 && (
            <DependencyGroup
              label="Waiting on"
              deps={waitingOn}
              taskId={taskId}
              type="waiting_on"
              onRemove={handleRemove}
              onOpen={openTaskModal}
              removing={removing}
            />
          )}

          {/* Linked section */}
          {linked.length > 0 && (
            <DependencyGroup
              label="Linked"
              deps={linked}
              taskId={taskId}
              type="linked_to"
              onRemove={handleRemove}
              onOpen={openTaskModal}
              removing={removing}
            />
          )}
        </div>
      )}

      {/* Add dependency dialog */}
      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add Dependency</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Dependency type selector */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">
                Relationship Type
              </label>
              <div className="grid grid-cols-3 gap-2">
                {Object.entries(TYPE_CONFIG).map(([key, config]) => {
                  const TypeIcon = config.icon;
                  return (
                    <button
                      key={key}
                      onClick={() => setSelectedType(key)}
                      className={cn(
                        "flex flex-col items-center gap-1 rounded-md border p-2 text-xs transition-colors",
                        selectedType === key
                          ? `${config.borderColor} ${config.bgColor} ${config.color} font-medium`
                          : "hover:bg-muted"
                      )}
                    >
                      <TypeIcon className="h-4 w-4" />
                      {config.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Task search */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">
                Search Task
              </label>
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Type to search tasks..."
                  className="pl-8 h-8"
                  autoFocus
                />
              </div>
            </div>

            {/* Search results */}
            {searchResults && searchResults.length > 0 && (
              <div className="max-h-48 overflow-y-auto space-y-1 rounded-md border p-1">
                {searchResults
                  .filter((t) => t.id !== taskId)
                  .map((t) => (
                    <button
                      key={t.id}
                      onClick={() => handleAdd(t.id)}
                      disabled={creating}
                      className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-sm hover:bg-muted transition-colors text-left"
                    >
                      <span
                        className="h-2 w-2 rounded-full shrink-0"
                        style={{ backgroundColor: t.status.color }}
                      />
                      <span className="truncate flex-1">{t.title}</span>
                      <span className="text-xs text-muted-foreground shrink-0">
                        {t.status.name}
                      </span>
                    </button>
                  ))}
              </div>
            )}

            {searchQuery.length >= 2 &&
              searchResults &&
              searchResults.filter((t) => t.id !== taskId).length === 0 && (
                <p className="text-xs text-muted-foreground text-center py-2">
                  No tasks found
                </p>
              )}

            {creating && (
              <div className="flex items-center justify-center py-2">
                <Loader2 className="h-4 w-4 animate-spin" />
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function DependencyGroup({
  label,
  deps,
  taskId,
  type,
  onRemove,
  onOpen,
  removing,
}: {
  label: string;
  deps: Dependency[];
  taskId: string;
  type: string;
  onRemove: (id: string) => void;
  onOpen: (taskId: string) => void;
  removing: string | null;
}) {
  const config = TYPE_CONFIG[type as keyof typeof TYPE_CONFIG];
  const Icon = config.icon;

  return (
    <div className="space-y-1">
      <div className={cn("flex items-center gap-1 text-xs font-medium", config.color)}>
        <Icon className="h-3 w-3" />
        {label}
      </div>
      {deps.map((dep) => {
        // Determine which task to display (the "other" task)
        const otherTask =
          dep.dependentTask.id === taskId
            ? dep.dependencyTask
            : dep.dependentTask;
        const isDone =
          otherTask.status.type === "done" ||
          otherTask.status.type === "closed";

        return (
          <div
            key={dep.id}
            className={cn(
              "flex items-center gap-2 rounded-md border px-2 py-1.5 group",
              config.borderColor,
              config.bgColor
            )}
          >
            <span
              className="h-2 w-2 rounded-full shrink-0"
              style={{ backgroundColor: otherTask.status.color }}
            />
            <button
              onClick={() => onOpen(otherTask.id)}
              className={cn(
                "flex-1 text-sm text-left truncate hover:underline",
                isDone && "line-through text-muted-foreground"
              )}
            >
              {otherTask.title}
            </button>
            <Badge
              variant="secondary"
              className="text-[10px] h-4 px-1 shrink-0"
            >
              {otherTask.status.name}
            </Badge>
            <Button
              variant="ghost"
              size="icon"
              className="h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
              onClick={() => onRemove(dep.id)}
              disabled={removing === dep.id}
            >
              {removing === dep.id ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <X className="h-3 w-3" />
              )}
            </Button>
          </div>
        );
      })}
    </div>
  );
}

// Export a small indicator component for use in task cards/rows
export function DependencyIndicator({
  dependencyCount,
  dependentCount,
  className,
}: {
  dependencyCount: number;
  dependentCount: number;
  className?: string;
}) {
  const total = dependencyCount + dependentCount;
  if (total === 0) return null;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          className={cn(
            "inline-flex items-center gap-0.5 text-xs text-muted-foreground hover:text-foreground transition-colors",
            className
          )}
        >
          <Link2 className="h-3 w-3" />
          <span>{total}</span>
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-40 p-2" align="start">
        <div className="space-y-1 text-xs">
          {dependencyCount > 0 && (
            <div className="flex items-center gap-1 text-orange-500">
              <Clock className="h-3 w-3" />
              Waiting on {dependencyCount}
            </div>
          )}
          {dependentCount > 0 && (
            <div className="flex items-center gap-1 text-red-500">
              <Ban className="h-3 w-3" />
              Blocking {dependentCount}
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
