"use client";

import useSWR from "swr";
import { useCallback } from "react";

export interface Reminder {
  id: string;
  title: string;
  description: string | null;
  remindAt: string;
  completed: boolean;
  taskId: string | null;
  userId: string;
  workspaceId: string;
  createdAt: string;
  task: {
    id: string;
    title: string;
  } | null;
}

const fetcher = (url: string) =>
  fetch(url).then((res) => {
    if (!res.ok) throw new Error("Failed to fetch");
    return res.json();
  });

export function useReminders(workspaceId: string | null | undefined, options?: { upcoming?: boolean }) {
  const params = new URLSearchParams();
  if (workspaceId) params.set("workspaceId", workspaceId);
  if (options?.upcoming) params.set("upcoming", "true");

  const { data, error, isLoading, mutate } = useSWR<Reminder[]>(
    workspaceId ? `/api/reminders?${params.toString()}` : null,
    fetcher,
    {
      refreshInterval: 60000, // Poll every 60s
    }
  );

  const reminders = data ?? [];

  const createReminder = useCallback(
    async (reminderData: {
      title: string;
      description?: string;
      remindAt: string;
      taskId?: string;
      workspaceId: string;
    }) => {
      const res = await fetch("/api/reminders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(reminderData),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to create reminder");
      }

      const result = await res.json();
      mutate();
      return result;
    },
    [mutate]
  );

  const toggleComplete = useCallback(
    async (id: string, completed: boolean) => {
      const res = await fetch("/api/reminders", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, completed }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to update reminder");
      }

      mutate();
    },
    [mutate]
  );

  const deleteReminder = useCallback(
    async (id: string) => {
      const res = await fetch(`/api/reminders?id=${id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to delete reminder");
      }

      mutate();
    },
    [mutate]
  );

  return {
    reminders,
    isLoading,
    isError: !!error,
    mutate,
    createReminder,
    toggleComplete,
    deleteReminder,
  };
}
