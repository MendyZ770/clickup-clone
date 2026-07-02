"use client";

import useSWR from "swr";
import { useCallback } from "react";
import type { TaskSummary, TaskWithDetails } from "@/types";

interface TaskFilters {
  statusId?: string;
  priority?: string;
  assigneeId?: string;
  search?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export function useTasks(
  params: { listId?: string | null; spaceId?: string | null; workspaceId?: string | null },
  filters?: TaskFilters
) {
  const searchParams = new URLSearchParams();
  if (params.listId) searchParams.set("listId", params.listId);
  if (params.spaceId) searchParams.set("spaceId", params.spaceId);
  if (params.workspaceId) searchParams.set("workspaceId", params.workspaceId);
  
  if (filters?.statusId) searchParams.set("statusId", filters.statusId);
  if (filters?.priority) searchParams.set("priority", filters.priority);
  if (filters?.assigneeId) searchParams.set("assigneeId", filters.assigneeId);
  if (filters?.search) searchParams.set("search", filters.search);
  if (filters?.sortBy) searchParams.set("sortBy", filters.sortBy);
  if (filters?.sortOrder) searchParams.set("sortOrder", filters.sortOrder);

  const hasContext = Boolean(params.listId || params.spaceId || params.workspaceId);

  const { data, error, isLoading, mutate } = useSWR<TaskSummary[]>(
    hasContext ? `/api/tasks?${searchParams.toString()}` : null
  );

  return {
    tasks: data ?? [],
    isLoading,
    isError: !!error,
    mutate,
  };
}

export function useTask(taskId: string | null | undefined) {
  const { data, error, isLoading, mutate } = useSWR<TaskWithDetails>(
    taskId ? `/api/tasks/${taskId}` : null
  );

  return {
    task: data ?? null,
    isLoading,
    isError: !!error,
    mutate,
  };
}

export function useCreateTask() {
  const createTask = useCallback(
    async (data: {
      title: string;
      description?: string;
      priority?: string;
      dueDate?: string | null;
      listId: string;
      statusId?: string;
      assigneeIds?: string[];
    }) => {
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to create task");
      }

      return res.json();
    },
    []
  );

  return { createTask };
}

export function useUpdateTask() {
  const updateTask = useCallback(
    async (
      taskId: string,
      data: {
        title?: string;
        description?: string | null;
        priority?: string;
        dueDate?: string | null;
        startDate?: string | null;
        timeEstimate?: number | null;
        statusId?: string;
        position?: number;
        listId?: string;
      }
    ) => {
      const res = await fetch(`/api/tasks/${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to update task");
      }

      return res.json();
    },
    []
  );

  return { updateTask };
}

export function useDeleteTask() {
  const deleteTask = useCallback(async (taskId: string) => {
    const res = await fetch(`/api/tasks/${taskId}`, {
      method: "DELETE",
    });

    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || "Failed to delete task");
    }

    return res.json();
  }, []);

  return { deleteTask };
}
