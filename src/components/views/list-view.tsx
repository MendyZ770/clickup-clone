"use client";

import { useState, useEffect } from "react";
import useSWR from "swr";
import { ChevronDown, ChevronRight, ListTodo } from "lucide-react";
import { useTasks } from "@/hooks/use-tasks";
import { useFilters } from "@/hooks/use-filters";
import { useModal } from "@/hooks/use-modal";
import { TaskRow } from "@/components/task/task-row";
import { TaskForm } from "@/components/task/task-form";
import { EmptyState } from "@/components/shared/empty-state";
import { LoadingSpinner } from "@/components/shared/loading-spinner";

const fetcher = (url: string) =>
  fetch(url).then((r) => {
    if (!r.ok) throw new Error("Failed to fetch");
    return r.json();
  });

interface StatusGroup {
  id: string;
  name: string;
  color: string;
  type: string;
  order: number;
}

interface ListViewProps {
  listId: string;
  workspaceId: string;
}

export function ListView({ listId, workspaceId }: ListViewProps) {
  const { getFilter } = useFilters();
  const { setWorkspaceId } = useModal();
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(
    new Set()
  );

  useEffect(() => {
    setWorkspaceId(workspaceId);
  }, [workspaceId, setWorkspaceId]);

  const { data: statuses } = useSWR<StatusGroup[]>(
    `/api/lists/${listId}/statuses`,
    fetcher
  );

  const { tasks, isLoading, mutate } = useTasks(listId, {
    statusId: getFilter("statusId") ?? undefined,
    priority: getFilter("priority") ?? undefined,
    assigneeId: getFilter("assigneeId") ?? undefined,
    search: getFilter("search") ?? undefined,
    sortBy: getFilter("sortBy") ?? undefined,
    sortOrder: (getFilter("sortOrder") as "asc" | "desc") ?? undefined,
  });

  const toggleGroup = (statusId: string) => {
    setCollapsedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(statusId)) {
        next.delete(statusId);
      } else {
        next.add(statusId);
      }
      return next;
    });
  };

  // Group tasks by status
  const grouped = (statuses ?? []).map((status) => ({
    status,
    tasks: tasks.filter((t) => t.status.id === status.id),
  }));

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!statuses || statuses.length === 0) {
    return (
      <EmptyState
        icon={ListTodo}
        title="Aucun statut configuré"
        description="Cette liste a besoin d'au moins un statut avant d'ajouter des tâches."
      />
    );
  }

  if (tasks.length === 0 && !getFilter("statusId") && !getFilter("priority")) {
    return (
      <div className="space-y-2">
        {grouped.map(({ status }) => (
          <div key={status.id}>
            <StatusHeader
              status={status}
              count={0}
              isCollapsed={false}
              onToggle={() => {}}
            />
            <TaskForm
              listId={listId}
              statusId={status.id}
              onCreated={() => mutate()}
            />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {grouped.map(({ status, tasks: groupTasks }) => {
        const isCollapsed = collapsedGroups.has(status.id);
        return (
          <div key={status.id}>
            <StatusHeader
              status={status}
              count={groupTasks.length}
              isCollapsed={isCollapsed}
              onToggle={() => toggleGroup(status.id)}
            />
            {!isCollapsed && (
              <div>
                {/* Column headers */}
                <div className="flex items-center gap-2 border-b px-3 py-1 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                  <span className="w-4" />
                  <span className="flex-1">Titre</span>
                  <span className="hidden sm:block w-16" />
                  <span className="w-20 text-center">Statut</span>
                  <span className="w-10 text-center">Pri</span>
                  <span className="hidden lg:block w-24">Échéance</span>
                  <span className="w-8" />
                </div>
                {groupTasks.map((task) => (
                  <TaskRow
                    key={task.id}
                    task={task}
                    workspaceId={workspaceId}
                    onUpdated={() => mutate()}
                  />
                ))}
                <TaskForm
                  listId={listId}
                  statusId={status.id}
                  onCreated={() => mutate()}
                  className="border-b"
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function StatusHeader({
  status,
  count,
  isCollapsed,
  onToggle,
}: {
  status: StatusGroup;
  count: number;
  isCollapsed: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      onClick={onToggle}
      className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm font-semibold hover:bg-muted/50 transition-colors"
    >
      {isCollapsed ? (
        <ChevronRight className="h-4 w-4 text-muted-foreground" />
      ) : (
        <ChevronDown className="h-4 w-4 text-muted-foreground" />
      )}
      <span
        className="h-3 w-3 rounded-sm shrink-0"
        style={{ backgroundColor: status.color }}
      />
      <span>{status.name}</span>
      <span className="text-xs font-normal text-muted-foreground">
        {count}
      </span>
    </button>
  );
}
