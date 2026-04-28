import { NextResponse } from "next/server";
import { google } from "googleapis";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get("code");
    const state = searchParams.get("state"); // userId
    const error = searchParams.get("error");
    const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";

    if (error) {
      console.error("Google OAuth error:", error);
      return NextResponse.redirect(
        `${baseUrl}/dashboard/calendar-settings?error=google_auth_denied`
      );
    }

    if (!code || !state) {
      return NextResponse.redirect(
        `${baseUrl}/dashboard/calendar-settings?error=google_auth_missing_params`
      );
    }

    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

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

    // Exchange code for tokens
    const { tokens } = await oauth2Client.getToken(code);

    if (!tokens.access_token) {
      return NextResponse.redirect(
        `${baseUrl}/dashboard/calendar-settings?error=google_token_exchange_failed`
      );
    }

    const tokenExpiry = tokens.expiry_date
      ? new Date(tokens.expiry_date)
      : new Date(Date.now() + 3600 * 1000);

    // Google ne renvoie refresh_token qu'à la première connexion. Si l'utilisateur
    // s'est déjà connecté, on conserve le refresh_token existant.
    const existing = await prisma.googleCalendarSync.findUnique({
      where: { userId: state },
    });

    const refreshToken = tokens.refresh_token ?? existing?.refreshToken;

    if (!refreshToken) {
      return NextResponse.redirect(
        `${baseUrl}/dashboard/calendar-settings?error=google_token_exchange_failed`
      );
    }

    await prisma.googleCalendarSync.upsert({
      where: { userId: state },
      update: {
        accessToken: tokens.access_token,
        refreshToken,
        tokenExpiry,
        syncEnabled: true,
      },
      create: {
        userId: state,
        accessToken: tokens.access_token,
        refreshToken,
        tokenExpiry,
      },
    });

    return NextResponse.redirect(
      `${baseUrl}/dashboard/calendar-settings?success=google_connected`
    );
  } catch (error) {
    console.error("GET /api/calendar/google/callback error:", error);
    const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
    return NextResponse.redirect(
      `${baseUrl}/dashboard/calendar-settings?error=google_auth_error`
    );
  }
}
