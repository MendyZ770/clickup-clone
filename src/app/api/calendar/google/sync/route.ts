import { NextResponse } from "next/server";
import { subDays } from "date-fns";
import { google } from "googleapis";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth-helpers";
import { createGoogleCalendarEvent } from "@/lib/calendar-helpers";

interface AuthSuccess {
  ok: true;
  calendar: ReturnType<typeof google.calendar>;
  syncRecord: NonNullable<Awaited<ReturnType<typeof prisma.googleCalendarSync.findUnique>>>;
}

interface AuthExpired {
  ok: false;
  reason: "expired";
}

interface AuthMissing {
  ok: false;
  reason: "missing";
}

type AuthResult = AuthSuccess | AuthExpired | AuthMissing;

async function getAuthenticatedCalendar(userId: string): Promise<AuthResult> {
  const syncRecord = await prisma.googleCalendarSync.findUnique({
    where: { userId },
  });

  if (!syncRecord) {
    return { ok: false, reason: "missing" } as AuthMissing;
  }

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";

  if (!clientId || !clientSecret) {
    return { ok: false, reason: "missing" } as AuthMissing;
  }

  const oauth2Client = new google.auth.OAuth2(
    clientId,
    clientSecret,
    `${baseUrl}/api/calendar/google/callback`
  );

  oauth2Client.setCredentials({
    access_token: syncRecord.accessToken,
    refresh_token: syncRecord.refreshToken,
    expiry_date: syncRecord.tokenExpiry.getTime(),
  });

  // Handle token refresh if expired
  if (syncRecord.tokenExpiry.getTime() < Date.now()) {
    try {
      const { credentials } = await oauth2Client.refreshAccessToken();
      await prisma.googleCalendarSync.update({
        where: { userId },
        data: {
          accessToken: credentials.access_token || syncRecord.accessToken,
          refreshToken: credentials.refresh_token || syncRecord.refreshToken,
          tokenExpiry: credentials.expiry_date
            ? new Date(credentials.expiry_date)
            : new Date(Date.now() + 3600 * 1000),
        },
      });
    } catch (refreshError) {
      console.error("Failed to refresh Google token:", refreshError);
      // Si le refresh token est invalide/révoqué, on supprime le record
      const msg = refreshError instanceof Error ? refreshError.message : String(refreshError);
      if (msg.includes("invalid_grant")) {
        await prisma.googleCalendarSync.delete({ where: { userId } });
        return { ok: false, reason: "expired" } as AuthExpired;
      }
      return { ok: false, reason: "missing" } as AuthMissing;
    }
  }

  const calendar = google.calendar({ version: "v3", auth: oauth2Client });
  return { ok: true, calendar, syncRecord };
}

export async function POST() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const result = await getAuthenticatedCalendar(user.id);
    if (!result.ok) {
      if (result.reason === "expired") {
        return NextResponse.json(
          { error: "Google Calendar token expired", reconnect: true },
          { status: 401 }
        );
      }
      return NextResponse.json(
        { error: "Google Calendar is not connected or configuration is missing" },
        { status: 400 }
      );
    }

    const { calendar, syncRecord } = result;

    if (!syncRecord.syncEnabled) {
      return NextResponse.json(
        { error: "Google Calendar sync is disabled" },
        { status: 400 }
      );
    }

    const cutoff = subDays(new Date(), 7);

    // Fetch tasks with due dates for this user (recent + future only)
    const tasks = await prisma.task.findMany({
      where: {
        dueDate: { gte: cutoff },
        list: {
          space: {
            workspace: {
              members: {
                some: { userId: user.id },
              },
            },
          },
        },
        OR: [
          { assignees: { some: { userId: user.id } } },
          { creatorId: user.id },
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
        // Check if event already exists by searching for our custom property
        const existingEventsRes = await calendar.events.list({
          calendarId: syncRecord.calendarId,
          privateExtendedProperty: [`clickupCloneTaskId=${task.id}`],
          maxResults: 1,
        });

        const existingItems = existingEventsRes.data?.items;

        if (existingItems && existingItems.length > 0) {
          // Update existing event
          const existingEvent = existingItems[0];
          await calendar.events.update({
            calendarId: syncRecord.calendarId,
            eventId: existingEvent.id!,
            requestBody: eventBody,
          });
        } else {
          // Create new event
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

    // Cleanup: remove Google Calendar events that no longer have a matching task
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
            // ignore cleanup errors
          }
        }
      }

      pageToken = orphanEventsRes.data.nextPageToken || undefined;
    } while (pageToken);

    // Update lastSyncAt
    await prisma.googleCalendarSync.update({
      where: { userId: user.id },
      data: { lastSyncAt: new Date() },
    });

    return NextResponse.json({
      success: true,
      synced,
      removed,
      errors,
      total: tasksWithDueDate.length,
    });
  } catch (error) {
    console.error("POST /api/calendar/google/sync error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// GET: Check sync status
export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const syncRecord = await prisma.googleCalendarSync.findUnique({
      where: { userId: user.id },
    });

    if (!syncRecord) {
      return NextResponse.json({ connected: false });
    }

    return NextResponse.json({
      connected: true,
      syncEnabled: syncRecord.syncEnabled,
      lastSyncAt: syncRecord.lastSyncAt,
      calendarId: syncRecord.calendarId,
    });
  } catch (error) {
    console.error("GET /api/calendar/google/sync error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
