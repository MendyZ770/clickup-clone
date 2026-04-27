"use client";

import { useEffect, useCallback } from "react";
import useSWR from "swr";
import { DragDropContext, type DropResult } from "@hello-pangea/dnd";
import { LayoutGrid } from "lucide-react";
import { useTasks } from "@/hooks/use-tasks";
import { useFilters } from "@/hooks/use-filters";
import { useModal } from "@/hooks/use-modal";
import { BoardColumn } from "./board-column";
import { EmptyState } from "@/components/shared/empty-state";
import { LoadingSpinner } from "@/components/shared/loading-spinner";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import type { TaskSummary } from "@/types";

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

interface BoardViewProps {
  listId: string;
  workspaceId: string;
}

export function BoardView({ listId, workspaceId }: BoardViewProps) {
  const { getFilter } = useFilters();
  const { setWorkspaceId } = useModal();

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

  const handleDragEnd = useCallback(
    async (result: DropResult) => {
      const { destination, source } = result;

      if (!destination) return;
      if (
        destination.droppableId === source.droppableId &&
        destination.index === source.index
      ) {
        return;
      }

      const sourceStatusId = source.droppableId;
      const destStatusId = destination.droppableId;

      // Build the new task ordering per column
      const tasksByStatus = new Map<string, TaskSummary[]>();
      for (const status of statuses ?? []) {
        tasksByStatus.set(
          status.id,
          tasks
            .filter((t) => t.status.id === status.id)
            .sort((a, b) => a.position - b.position)
        );
      }

      // Remove the dragged task from source column
      const sourceTasks = [...(tasksByStatus.get(sourceStatusId) ?? [])];
      const [movedTask] = sourceTasks.splice(source.index, 1);
      tasksByStatus.set(sourceStatusId, sourceTasks);

      // Insert into destination column
      const destTasks = [...(tasksByStatus.get(destStatusId) ?? [])];
      destTasks.splice(destination.index, 0, movedTask);
      tasksByStatus.set(destStatusId, destTasks);

      // Build reorder payload
      const reorderPayload: { id: string; position: number; statusId?: string }[] =
        [];

      // Update positions for destination column
      const finalDestTasks = tasksByStatus.get(destStatusId) ?? [];
      finalDestTasks.forEach((t, i) => {
        const update: { id: string; position: number; statusId?: string } = {
          id: t.id,
          position: (i + 1) * 65536,
        };
        if (t.id === movedTask.id && sourceStatusId !== destStatusId) {
          update.statusId = destStatusId;
        }
        reorderPayload.push(update);
      });

      // If cross-column, update source column positions too
      if (sourceStatusId !== destStatusId) {
        const finalSourceTasks = tasksByStatus.get(sourceStatusId) ?? [];
        finalSourceTasks.forEach((t, i) => {
          reorderPayload.push({ id: t.id, position: (i + 1) * 65536 });
        });
      }

      // Optimistic update
      const optimisticTasks = tasks.map((t) => {
        const update = reorderPayload.find((u) => u.id === t.id);
        if (update) {
          return {
            ...t,
            position: update.position,
            ...(update.statusId
              ? {
                  statusId: update.statusId,
                  status:
                    (statuses ?? []).find((s) => s.id === update.statusId) ??
                    t.status,
                }
              : {}),
          };
        }
        return t;
      });
      mutate(optimisticTasks as TaskSummary[], false);

      // Send to API
      try {
        await fetch("/api/tasks/reorder", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ tasks: reorderPayload }),
        });
        mutate();
      } catch {
        mutate(); // Revert on error
      }
    },
    [tasks, statuses, mutate]
  );

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
        title="No statuses configured"
        description="This list needs at least one status to show the board."
      />
    );
  }

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <ScrollArea className="w-full">
        <div className="flex gap-4 p-4 min-h-[calc(100vh-200px)]">
          {statuses.map((status) => (
            <BoardColumn
              key={status.id}
              status={status}
              tasks={tasks
                .filter((t) => t.status.id === status.id)
                .sort((a, b) => a.position - b.position)}
              listId={listId}
              onTaskCreated={() => mutate()}
            />
          ))}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </DragDropContext>
  );
}
