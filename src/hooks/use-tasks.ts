"use client";

import useSWR from "swr";
import { useCallback } from "react";
import type { TaskSummary, TaskWithDetails } from "@/types";

const fetcher = (url: string) =>
  fetch(url).then((res) => {
    if (!res.ok) throw new Error("Failed to fetch");
    return res.json();
  });

interface TaskFilters {
  statusId?: string;
  priority?: string;
  assigneeId?: string;
  search?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export function useTasks(listId: string | null | undefined, filters?: TaskFilters) {
  const params = new URLSearchParams();
  if (listId) params.set("listId", listId);
  if (filters?.statusId) params.set("statusId", filters.statusId);
  if (filters?.priority) params.set("priority", filters.priority);
  if (filters?.assigneeId) params.set("assigneeId", filters.assigneeId);
  if (filters?.search) params.set("search", filters.search);
  if (filters?.sortBy) params.set("sortBy", filters.sortBy);
  if (filters?.sortOrder) params.set("sortOrder", filters.sortOrder);

  const { data, error, isLoading, mutate } = useSWR<TaskSummary[]>(
    listId ? `/api/tasks?${params.toString()}` : null,
    fetcher
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
    taskId ? `/api/tasks/${taskId}` : null,
    fetcher
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
      assigneeId?: string | null;
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
        assigneeId?: string | null;
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
