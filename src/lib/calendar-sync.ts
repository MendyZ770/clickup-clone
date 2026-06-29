/**
 * Triggers a background Google Calendar sync.
 * Fire-and-forget: never blocks or throws.
 */
export function triggerCalendarSync() {
  if (typeof fetch === "undefined") return;

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  fetch(`${baseUrl}/api/calendar/google/sync`, { method: "POST" }).catch(() => {
    // Silently ignore — calendar sync is best-effort
  });
}
