"use client";

import { useSession } from "next-auth/react";
import { useCalendarAutoSync } from "@/hooks/use-calendar-auto-sync";

export function CalendarAutoSync() {
  const { status } = useSession();
  const isAuthenticated = status === "authenticated";

  useCalendarAutoSync(isAuthenticated);

  return null; // Renders nothing, just runs in background
}
