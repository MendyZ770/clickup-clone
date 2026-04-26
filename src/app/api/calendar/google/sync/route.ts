import { NextResponse } from "next/server";
import { google } from "googleapis";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth-helpers";
import { createGoogleCalendarEvent } from "@/lib/calendar-helpers";

async function getAuthenticatedCalendar(userId: string) {
  const syncRecord = await prisma.googleCalendarSync.findUnique({
    where: { userId },
  });

  if (!syncRecord) {
    return null;
  }

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";

  if (!clientId || !clientSecret) {
    return null;
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
      return null;
    }
  }

  const calendar = google.calendar({ version: "v3", auth: oauth2Client });
  return { calendar, syncRecord };
}

export async function POST() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const result = await getAuthenticatedCalendar(user.id);
    if (!result) {
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

    // Fetch all tasks with due dates for this user
    const tasks = await prisma.task.findMany({
      where: {
        dueDate: { not: null },
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
          { assigneeId: user.id },
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

    // Update lastSyncAt
    await prisma.googleCalendarSync.update({
      where: { userId: user.id },
      data: { lastSyncAt: new Date() },
    });

    return NextResponse.json({
      success: true,
      synced,
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
