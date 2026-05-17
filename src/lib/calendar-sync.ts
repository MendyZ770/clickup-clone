/**
 * Triggers a background Google Calendar sync.
 * Fire-and-forget: never blocks or throws.
 */
export function triggerCalendarSync() {
  if (typeof fetch === "undefined") return;

  fetch("/api/calendar/google/sync", { method: "POST" }).catch(() => {
    // Silently ignore — calendar sync is best-effort
  });
}
