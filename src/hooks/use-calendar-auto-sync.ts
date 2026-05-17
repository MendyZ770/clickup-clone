"use client";

import { useEffect, useRef, useCallback } from "react";

const SYNC_INTERVAL = 5 * 60 * 1000; // 5 minutes

async function triggerSync() {
  try {
    const res = await fetch("/api/calendar/google/sync", { method: "POST" });
    if (res.status === 401) {
      const data = await res.json().catch(() => ({}));
      if (data.reconnect) {
        console.warn("[CalendarAutoSync] Token expired, reconnect needed");
      }
    }
  } catch {
    // Silently fail — don't bother the user
  }
}

export function useCalendarAutoSync(enabled: boolean) {
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const sync = useCallback(() => {
    if (!enabled) return;
    triggerSync();
  }, [enabled]);

  useEffect(() => {
    if (!enabled) return;

    // Immediate first sync when enabled
    triggerSync();

    // Periodic sync
    intervalRef.current = setInterval(triggerSync, SYNC_INTERVAL);

    // Sync when tab becomes visible
    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        triggerSync();
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [enabled]);

  return { sync };
}
