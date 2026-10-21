import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth-helpers";
import { syncUserGoogleCalendar } from "@/lib/google-calendar-sync";

export async function POST() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const result = await syncUserGoogleCalendar(user.id);
    if (!result.ok) {
      if (result.reason === "expired") {
        return NextResponse.json(
          { error: "Google Calendar token expired", reconnect: true },
          { status: 401 }
        );
      }
      if (result.reason === "disabled") {
        return NextResponse.json(
          { error: "Google Calendar sync is disabled" },
          { status: 400 }
        );
      }
      return NextResponse.json(
        { error: "Google Calendar is not connected or configuration is missing" },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      synced: result.synced,
      removed: result.removed,
      errors: result.errors,
      total: result.total,
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
