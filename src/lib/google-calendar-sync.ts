import { subDays } from "date-fns";
import { google } from "googleapis";
import { prisma } from "@/lib/prisma";
import { createGoogleCalendarEvent } from "@/lib/calendar-helpers";
import { decryptToken, encryptToken } from "@/lib/token-crypto";

type Calendar = ReturnType<typeof google.calendar>;

interface AuthSuccess {
  calendar: Calendar;
  syncRecord: NonNullable<Awaited<ReturnType<typeof prisma.googleCalendarSync.findUnique>>>;
}

type AuthFailure = "expired" | "missing";

async function getAuthenticatedCalendar(userId: string): Promise<
  { ok: true } & AuthSuccess | { ok: false; reason: AuthFailure }
> {
  const syncRecord = await prisma.googleCalendarSync.findUnique({
    where: { userId },
  });

  if (!syncRecord) {
    return { ok: false, reason: "missing" };
  }

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";

  if (!clientId || !clientSecret) {
    return { ok: false, reason: "missing" };
  }

  const oauth2Client = new google.auth.OAuth2(
    clientId,
    clientSecret,
    `${baseUrl}/api/calendar/google/callback`
  );

  const storedAccessToken = decryptToken(syncRecord.accessToken);
  const storedRefreshToken = decryptToken(syncRecord.refreshToken);

  oauth2Client.setCredentials({
    access_token: storedAccessToken,
    refresh_token: storedRefreshToken,
    expiry_date: syncRecord.tokenExpiry.getTime(),
  });

  if (syncRecord.tokenExpiry.getTime() < Date.now()) {
    try {
      const { credentials } = await oauth2Client.refreshAccessToken();
      await prisma.googleCalendarSync.update({
        where: { userId },
        data: {
          accessToken: encryptToken(credentials.access_token || storedAccessToken),
          refreshToken: encryptToken(credentials.refresh_token || storedRefreshToken),
          tokenExpiry: credentials.expiry_date
            ? new Date(credentials.expiry_date)
            : new Date(Date.now() + 3600 * 1000),
        },
      });
    } catch (refreshError) {
      console.error("Failed to refresh Google token:", refreshError);
      const msg = refreshError instanceof Error ? refreshError.message : String(refreshError);
      if (msg.includes("invalid_grant")) {
        await prisma.googleCalendarSync.delete({ where: { userId } });
        return { ok: false, reason: "expired" };
      }
      return { ok: false, reason: "missing" };
    }
  }

  return {
    ok: true,
    calendar: google.calendar({ version: "v3", auth: oauth2Client }),
    syncRecord,
  };
}

export type SyncOutcome =
  | { ok: true; synced: number; removed: number; errors: number; total: number }
  | { ok: false; reason: "expired" | "disabled" | "missing" | "failed"; error?: string };

export async function syncUserGoogleCalendar(userId: string): Promise<SyncOutcome> {
  try {
    const auth = await getAuthenticatedCalendar(userId);
    if (!auth.ok) {
      return { ok: false, reason: auth.reason };
    }

    const { calendar, syncRecord } = auth;

    if (!syncRecord.syncEnabled) {
      return { ok: false, reason: "disabled" };
    }

    const cutoff = subDays(new Date(), 7);

    const tasks = await prisma.task.findMany({
      where: {
        dueDate: { gte: cutoff },
        list: {
          space: {
            workspace: {
              members: {
                some: { userId },
              },
            },
          },
        },
        OR: [
          { assignees: { some: { userId } } },
          { creatorId: userId },
        ],
      },
      include: {
        status: true,
        list: {
          include: {
            space: {
              include: {
                workspace: true,
              },
            },
          },
        },
      },
    });

    const tasksWithDueDate = tasks.filter(
      (task): task is typeof task & { dueDate: Date } => task.dueDate !== null
    );

    let synced = 0;
    let errors = 0;

    for (const task of tasksWithDueDate) {
      const eventBody = createGoogleCalendarEvent(task);

      try {
        const existingEventsRes = await calendar.events.list({
          calendarId: syncRecord.calendarId,
          privateExtendedProperty: [`clickupCloneTaskId=${task.id}`],
          maxResults: 1,
        });

        const existingItems = existingEventsRes.data?.items;

        if (existingItems && existingItems.length > 0) {
          await calendar.events.update({
            calendarId: syncRecord.calendarId,
            eventId: existingItems[0].id!,
            requestBody: eventBody,
          });
        } else {
          await calendar.events.insert({
            calendarId: syncRecord.calendarId,
            requestBody: eventBody,
          });
        }
        synced++;
      } catch (eventError) {
        console.error(`Failed to sync task ${task.id}:`, eventError);
        errors++;
      }
    }

    let removed = 0;
    const taskIds = new Set(tasksWithDueDate.map((t) => t.id));
    let pageToken: string | undefined;

    do {
      const orphanEventsRes = await calendar.events.list({
        calendarId: syncRecord.calendarId,
        privateExtendedProperty: ["clickupCloneTaskId=*"],
        maxResults: 250,
        pageToken,
      });

      const items = orphanEventsRes.data.items || [];
      for (const event of items) {
        const taskId = event.extendedProperties?.private?.clickupCloneTaskId;
        if (taskId && !taskIds.has(taskId)) {
          try {
            await calendar.events.delete({
              calendarId: syncRecord.calendarId,
              eventId: event.id!,
            });
            removed++;
          } catch {
            // Best-effort cleanup: an event we cannot delete is not worth failing the sync.
          }
        }
      }

      pageToken = orphanEventsRes.data.nextPageToken || undefined;
    } while (pageToken);

    await prisma.googleCalendarSync.update({
      where: { userId },
      data: { lastSyncAt: new Date() },
    });

    return { synced, removed, errors, total: tasksWithDueDate.length, ok: true };
  } catch (error) {
    console.error("syncUserGoogleCalendar error:", error);
    return { ok: false, reason: "failed" };
  }
}
