import { NextResponse } from "next/server";
import { google } from "googleapis";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth-helpers";

export async function POST() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const syncRecord = await prisma.googleCalendarSync.findUnique({
      where: { userId: user.id },
    });

    if (!syncRecord) {
      return NextResponse.json({ error: "Not connected" }, { status: 400 });
    }

    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";

    if (!clientId || !clientSecret) {
      return NextResponse.json({ error: "Missing config" }, { status: 500 });
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

    // Refresh token if expired
    if (syncRecord.tokenExpiry.getTime() < Date.now()) {
      try {
        const { credentials } = await oauth2Client.refreshAccessToken();
        await prisma.googleCalendarSync.update({
          where: { userId: user.id },
          data: {
            accessToken: credentials.access_token || syncRecord.accessToken,
            refreshToken: credentials.refresh_token || syncRecord.refreshToken,
            tokenExpiry: credentials.expiry_date
              ? new Date(credentials.expiry_date)
              : new Date(Date.now() + 3600 * 1000),
          },
        });
      } catch {
        return NextResponse.json({ error: "Token expired" }, { status: 401 });
      }
    }

    const calendar = google.calendar({ version: "v3", auth: oauth2Client });

    // Find all events created by our app (using extended property clickupCloneTaskId)
    let deleted = 0;
    let errors = 0;
    let pageToken: string | undefined;

    do {
      const eventsRes = await calendar.events.list({
        calendarId: syncRecord.calendarId,
        privateExtendedProperty: ["clickupCloneTaskId=*"],
        maxResults: 250,
        pageToken,
      });

      const items = eventsRes.data.items || [];

      for (const event of items) {
        if (event.id) {
          try {
            await calendar.events.delete({
              calendarId: syncRecord.calendarId,
              eventId: event.id,
            });
            deleted++;
          } catch {
            errors++;
          }
        }
      }

      pageToken = eventsRes.data.nextPageToken || undefined;
    } while (pageToken);

    return NextResponse.json({
      success: true,
      deleted,
      errors,
    });
  } catch (error) {
    console.error("POST /api/calendar/google/clear error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
