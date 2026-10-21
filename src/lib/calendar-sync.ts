import { after } from "next/server";
import { prisma } from "@/lib/prisma";
import { syncUserGoogleCalendar } from "@/lib/google-calendar-sync";

/**
 * Triggers a background Google Calendar sync for the given user.
 * Fire-and-forget: never blocks or throws. Uses `after()` so the work survives
 * past the response on serverless runtimes.
 */
export function triggerCalendarSync(userId: string) {
  const run = async () => {
    try {
      const record = await prisma.googleCalendarSync.findUnique({
        where: { userId },
        select: { syncEnabled: true },
      });
      if (!record?.syncEnabled) return;
      await syncUserGoogleCalendar(userId);
    } catch (error) {
      // Calendar sync is best-effort
      console.error("[calendar-sync] background sync failed:", error);
    }
  };

  try {
    after(run);
  } catch {
    // Outside a request scope (e.g. scripts): run detached.
    void run();
  }
}
