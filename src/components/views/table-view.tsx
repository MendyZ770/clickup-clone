"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import useSWR from "swr";
import { ChevronDown, ChevronRight, LayoutGrid, Lock, User as UserIcon } from "lucide-react";
import { useTasks, useUpdateTask } from "@/hooks/use-tasks";
import { useFilters } from "@/hooks/use-filters";
import { useModal } from "@/hooks/use-modal";
import { EmptyState } from "@/components/shared/empty-state";
import { LoadingSpinner } from "@/components/shared/loading-spinner";
import { Checkbox } from "@/components/ui/checkbox";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { PriorityBadge } from "@/components/task/priority-badge";
import { StatusBadge } from "@/components/task/status-badge";
import { DueDatePicker } from "@/components/task/due-date-picker";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { cn } from "@/lib/utils";

interface StatusGroup {
  id: string;
  name: string;
  color: string;
  type: string;
  order: number;
}

interface TableViewProps {
  listId?: string;
  spaceId?: string;
  workspaceId: string;
}

export function TableView({ listId, spaceId, workspaceId }: TableViewProps) {
  const { getFilter } = useFilters();
  const { setWorkspaceId, openTaskModal } = useModal();
  const { updateTask } = useUpdateTask();

  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());

  useEffect(() => {
    setWorkspaceId(workspaceId);
  }, [workspaceId, setWorkspaceId]);

  const endpoint = listId
    ? `/api/lists/${listId}/statuses`
    : spaceId
    ? `/api/spaces/${spaceId}/statuses`
    : `/api/workspaces/${workspaceId}/statuses`;

  const { data: statuses } = useSWR<StatusGroup[]>(endpoint);

  const { tasks, isLoading, mutate } = useTasks(
    { listId, spaceId, workspaceId },
    {
      statusId: getFilter("statusId") ?? undefined,
      priority: getFilter("priority") ?? undefined,
      assigneeId: getFilter("assigneeId") ?? undefined,
      search: getFilter("search") ?? undefined,
      sortBy: getFilter("sortBy") ?? undefined,
      sortOrder: (getFilter("sortOrder") as "asc" | "desc") ?? undefined,
    }
  );

  const handleUpdate = useCallback(
    async (taskId: string, data: Record<string, unknown>) => {
      await updateTask(taskId, data as any);
      mutate();
    },
    [updateTask, mutate]
  );

  const toggleGroup = useCallback((statusId: string) => {
    setCollapsedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(statusId)) {
        next.delete(statusId);
      } else {
        next.add(statusId);
      }
      return next;
    });
  }, []);

  const grouped = useMemo(() => {
    return (statuses ?? []).map((status) => ({
      status,
      tasks: tasks.filter((t) => {
        const taskStatusId = listId
          ? t.status.id
          : `global:${t.status.name.trim().toLowerCase()}`;
        return taskStatusId === status.id;
      }),
    }));
  }, [statuses, tasks, listId]);

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
        icon={LayoutGrid}
        title="Aucun statut configuré"
        description="Cette vue a besoin de statuts configurés."
      />
    );
  }

  return (
    <div className="border border-border/40 rounded-xl overflow-hidden bg-background/40 backdrop-blur-md shadow-sm h-[calc(100vh-12rem)] min-h-[400px] flex flex-col">
      <div className="overflow-auto w-full h-full relative">
        <table className="w-full text-sm text-left border-collapse min-w-max">
          <thead className="text-xs uppercase bg-muted/30 sticky top-0 z-20 backdrop-blur-md border-b border-border/40 text-muted-foreground shadow-sm">
            <tr>
              <th className="px-3 py-3 font-semibold sticky left-0 z-30 bg-background/95 w-10 border-r border-border/20">
              </th>
              <th className="px-4 py-3 font-semibold sticky left-10 z-30 bg-background/95 min-w-[280px] w-full max-w-[400px] border-r border-border/20 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                Titre
              </th>
              <th className="px-4 py-3 font-semibold min-w-[140px] border-r border-border/10">Statut</th>
              <th className="px-4 py-3 font-semibold min-w-[120px] border-r border-border/10">Priorité</th>
              <th className="px-4 py-3 font-semibold min-w-[130px] border-r border-border/10">Début</th>
              <th className="px-4 py-3 font-semibold min-w-[130px] border-r border-border/10">Échéance</th>
              <th className="px-4 py-3 font-semibold min-w-[150px]">Assignés</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/20">
            {grouped.map(({ status, tasks: groupTasks }) => {
              if (groupTasks.length === 0 && !getFilter("statusId")) return null;
              
              const isCollapsed = collapsedGroups.has(status.id);

              return (
                <React.Fragment key={status.id}>
                  {/* Group Header Row */}
                  <tr className="bg-muted/10 group">
                    <td
                      colSpan={7}
                      className="px-2 py-2 font-semibold sticky left-0 z-10 bg-background/95 cursor-pointer hover:bg-muted/20 transition-colors border-b border-border/30"
                      onClick={() => toggleGroup(status.id)}
                    >
                      <div className="flex items-center gap-2 px-1">
                        {isCollapsed ? (
                          <ChevronRight className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <ChevronDown className="h-4 w-4 text-muted-foreground" />
                        )}
                        <span
                          className="h-3 w-3 rounded-sm shrink-0"
                          style={{ backgroundColor: status.color }}
                        />
                        <span className="text-foreground">{status.name}</span>
                        <span className="text-xs font-normal text-muted-foreground ml-2 bg-muted/30 px-1.5 py-0.5 rounded-full">
                          {groupTasks.length}
                        </span>
                      </div>
                    </td>
                  </tr>

                  {/* Tasks Rows */}
                  {!isCollapsed &&
                    groupTasks.map((task) => {
                      const isDone = task.status.type === "done" || task.status.type === "closed";
                      
                      return (
                        <tr
                          key={task.id}
                          className="hover:bg-muted/30 transition-colors group/row bg-background/40"
                        >
                          <td className="px-3 py-2 sticky left-0 z-10 bg-background/95 border-r border-border/20 group-hover/row:bg-muted/40 transition-colors">
                            <div className="flex items-center justify-center">
                              <Checkbox
                                checked={isDone}
                                onCheckedChange={async (checked) => {
                                  if (checked) {
                                    const doneStatus = statuses?.find((s) => s.type === "done");
                                    if (doneStatus) await handleUpdate(task.id, { statusId: doneStatus.id });
                                  } else {
                                    const todoStatus = statuses?.find((s) => s.type === "todo") ?? statuses?.[0];
                                    if (todoStatus) await handleUpdate(task.id, { statusId: todoStatus.id });
                                  }
                                }}
                                className="h-4 w-4"
                              />
                            </div>
                          </td>
                          <td className="px-4 py-2 sticky left-10 z-10 bg-background/95 border-r border-border/20 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)] group-hover/row:bg-muted/40 transition-colors">
                            <button
                              onClick={() => openTaskModal(task.id, task.locked)}
                              className={cn(
                                "flex items-center gap-2 text-left hover:text-primary transition-colors w-full",
                                isDone && "line-through text-muted-foreground"
                              )}
                            >
                              {task.locked && <Lock className="h-3.5 w-3.5 shrink-0 text-amber-500" />}
                              <span className="truncate font-medium">{task.title}</span>
                            </button>
                          </td>
                          <td className="px-4 py-2 border-r border-border/10">
                            <StatusBadge
                              status={task.status}
                              listId={task.listId}
                              onChange={(statusId) => handleUpdate(task.id, { statusId })}
                            />
                          </td>
                          <td className="px-4 py-2 border-r border-border/10">
                            <PriorityBadge
                              priority={task.priority}
                              onChange={(priority) => handleUpdate(task.id, { priority })}
                            />
                          </td>
                          <td className="px-4 py-2 border-r border-border/10">
                            {task.startDate ? (
                              <span className="text-muted-foreground text-xs font-medium cursor-pointer hover:text-foreground" onClick={() => openTaskModal(task.id, task.locked)}>
                                {format(new Date(task.startDate), "d MMM yyyy", { locale: fr })}
                              </span>
                            ) : (
                              <span className="text-muted-foreground/30 text-xs cursor-pointer hover:text-muted-foreground" onClick={() => openTaskModal(task.id, task.locked)}>
                                -
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-2 border-r border-border/10">
                            <DueDatePicker
                              date={task.dueDate}
                              onChange={(dueDate) => handleUpdate(task.id, { dueDate })}
                              className="justify-start border-none shadow-none hover:bg-transparent px-0 h-auto font-medium"
                            />
                          </td>
                          <td className="px-4 py-2">
                            {task.assignees && task.assignees.length > 0 ? (
                              <div className="flex -space-x-1.5 overflow-hidden">
                                {task.assignees.slice(0, 3).map((a) => (
                                  <Avatar key={a.userId} className="h-6 w-6 border border-background">
                                    <AvatarImage src={a.user.image ?? undefined} />
                                    <AvatarFallback className="text-[9px]">
                                      {(a.user.name ?? a.user.email).slice(0, 2).toUpperCase()}
                                    </AvatarFallback>
                                  </Avatar>
                                ))}
                                {task.assignees.length > 3 && (
                                  <div className="flex h-6 w-6 items-center justify-center rounded-full border border-background bg-muted text-[9px] font-medium">
                                    +{task.assignees.length - 3}
                                  </div>
                                )}
                              </div>
                            ) : (
                              <div className="h-6 w-6 rounded-full border border-dashed flex items-center justify-center text-muted-foreground/40 cursor-pointer hover:text-foreground hover:border-foreground/50 transition-colors" onClick={() => openTaskModal(task.id, task.locked)}>
                                <UserIcon className="h-3 w-3" />
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
