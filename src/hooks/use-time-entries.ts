"use client";

import useSWR from "swr";
import { useCallback } from "react";
import type { TimeEntryWithDetails } from "@/types";

const fetcher = (url: string) =>
  fetch(url).then((res) => {
    if (!res.ok) throw new Error("Failed to fetch");
    return res.json();
  });

export function useTimeEntries(taskId?: string) {
  const params = new URLSearchParams();
  if (taskId) params.set("taskId", taskId);

  const { data, error, isLoading, mutate } = useSWR<TimeEntryWithDetails[]>(
    `/api/time-entries?${params.toString()}`,
    fetcher
  );

  return {
    entries: data ?? [],
    isLoading,
    isError: !!error,
    mutate,
  };
}

export function useRunningTimer() {
  const { data, error, isLoading, mutate } = useSWR<TimeEntryWithDetails | null>(
    "/api/time-entries/timer",
    fetcher,
    { refreshInterval: 5000 } // Poll every 5s to stay in sync
  );

  return {
    runningTimer: data ?? null,
    isLoading,
    isError: !!error,
    mutate,
  };
}

export function useTimerActions() {
  const startTimer = useCallback(
    async (taskId: string, description?: string) => {
      const res = await fetch("/api/time-entries/timer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "start", taskId, description }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to start timer");
      }

      return res.json();
    },
    []
  );

  const stopTimer = useCallback(async () => {
    const res = await fetch("/api/time-entries/timer", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "stop" }),
    });

    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || "Failed to stop timer");
    }

    return res.json();
  }, []);

  const createManualEntry = useCallback(
    async (data: {
      taskId: string;
      startTime: string;
      endTime: string;
      duration: number;
      description?: string;
      billable?: boolean;
    }) => {
      const res = await fetch("/api/time-entries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to create time entry");
      }

      return res.json();
    },
    []
  );

  const updateEntry = useCallback(
    async (
      entryId: string,
      data: {
        description?: string;
        startTime?: string;
        endTime?: string;
        duration?: number;
        billable?: boolean;
      }
    ) => {
      const res = await fetch(`/api/time-entries/${entryId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to update time entry");
      }

      return res.json();
    },
    []
  );

  const deleteEntry = useCallback(async (entryId: string) => {
    const res = await fetch(`/api/time-entries/${entryId}`, {
      method: "DELETE",
    });

    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || "Failed to delete time entry");
    }

    return res.json();
  }, []);

  return { startTimer, stopTimer, createManualEntry, updateEntry, deleteEntry };
}

export function useTimeReport(params: {
  workspaceId?: string;
  startDate?: string;
  endDate?: string;
  groupBy?: "task" | "user" | "date";
}) {
  const searchParams = new URLSearchParams();
  if (params.workspaceId) searchParams.set("workspaceId", params.workspaceId);
  if (params.startDate) searchParams.set("startDate", params.startDate);
  if (params.endDate) searchParams.set("endDate", params.endDate);
  if (params.groupBy) searchParams.set("groupBy", params.groupBy);

  const { data, error, isLoading, mutate } = useSWR<{
    totalSeconds: number;
    totalEntries: number;
    groupBy: string;
    breakdown: {
      key: string;
      label: string;
      totalSeconds: number;
      entryCount: number;
    }[];
  }>(
    `/api/time-entries/report?${searchParams.toString()}`,
    fetcher
  );

  return {
    report: data ?? null,
    isLoading,
    isError: !!error,
    mutate,
  };
}
