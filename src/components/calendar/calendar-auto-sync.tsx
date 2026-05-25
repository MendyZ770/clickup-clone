"use client";

import { useUnifiedSession } from "@/hooks/use-unified-session";
import { useCalendarAutoSync } from "@/hooks/use-calendar-auto-sync";

export function CalendarAutoSync() {
  const { status } = useUnifiedSession();
  const isAuthenticated = status === "authenticated";

  useCalendarAutoSync(isAuthenticated);

  return null; // Renders nothing, just runs in background
}
