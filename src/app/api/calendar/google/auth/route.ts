import { NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { google } from "googleapis";
import { getCurrentUser, GCAL_OAUTH_STATE_COOKIE } from "@/lib/auth-helpers";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";

    if (!clientId || !clientSecret) {
      return NextResponse.redirect(
        `${baseUrl}/dashboard/calendar-settings?error=google_not_configured`
      );
    }

    const oauth2Client = new google.auth.OAuth2(
      clientId,
      clientSecret,
      `${baseUrl}/api/calendar/google/callback`
    );

    const state = randomBytes(16).toString("hex");

    const authUrl = oauth2Client.generateAuthUrl({
      access_type: "offline",
      scope: [
        "https://www.googleapis.com/auth/calendar.events",
        "https://www.googleapis.com/auth/calendar.readonly",
      ],
      prompt: "consent",
      state,
    });

    const response = NextResponse.redirect(authUrl);
    // Anti-CSRF : le state est comparé au callback, il ne porte pas l'identité.
    response.cookies.set(GCAL_OAUTH_STATE_COOKIE, state, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 600,
    });
    return response;
  } catch (error) {
    console.error("GET /api/calendar/google/auth error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
