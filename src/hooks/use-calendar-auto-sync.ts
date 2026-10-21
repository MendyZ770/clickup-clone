"use client";

import { useEffect, useRef, useCallback } from "react";

const SYNC_INTERVAL = 5 * 60 * 1000; // 5 minutes

let syncEligible: boolean | null = null;

// Un POST sur /sync sans compte Google connecté répond 400 : on sonde d'abord
// l'état pour ne pas générer d'erreurs réseau à chaque visite du calendrier.
async function isSyncConfigured(): Promise<boolean> {
  if (syncEligible !== null) return syncEligible;
  try {
    const res = await fetch("/api/calendar/google/sync");
    if (!res.ok) return false;
    const data = await res.json();
    syncEligible = Boolean(data.connected && data.syncEnabled);
  } catch {
    return false;
  }
  return syncEligible;
}

async function triggerSync() {
  try {
    if (!(await isSyncConfigured())) return;
    const res = await fetch("/api/calendar/google/sync", { method: "POST" });
    if (res.status === 401) {
      syncEligible = false;
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
