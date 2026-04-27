"use client";

import useSWR from "swr";
import { useCallback } from "react";

interface Notification {
  id: string;
  type: string;
  message: string;
  link: string | null;
  read: boolean;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

const fetcher = (url: string) =>
  fetch(url).then((res) => {
    if (!res.ok) throw new Error("Failed to fetch");
    return res.json();
  });

export function useNotifications() {
  const { data, error, isLoading, mutate } = useSWR<Notification[]>(
    "/api/notifications",
    fetcher,
    {
      refreshInterval: 30000, // Poll every 30s
    }
  );

  const notifications = data ?? [];
  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAsRead = useCallback(
    async (notificationId: string) => {
      await fetch("/api/notifications/mark-read", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notificationId }),
      });
      mutate();
    },
    [mutate]
  );

  const markAllAsRead = useCallback(async () => {
    await fetch("/api/notifications/mark-read", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ all: true }),
    });
    mutate();
  }, [mutate]);

  return {
    notifications,
    unreadCount,
    isLoading,
    isError: !!error,
    mutate,
    markAsRead,
    markAllAsRead,
  };
}
