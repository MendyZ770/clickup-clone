import { NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth-helpers";

// Un flux calendrier est accessible sans session : le jeton doit être imprévisible.
const newFeedToken = () => randomBytes(24).toString("base64url");

// GET: Return user's existing token (or create one if none exists)
export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let calendarToken = await prisma.calendarToken.findUnique({
      where: { userId: user.id },
    });

    if (!calendarToken) {
      calendarToken = await prisma.calendarToken.create({
        data: { userId: user.id, token: newFeedToken() },
      });
    }

    return NextResponse.json({ token: calendarToken.token });
  } catch (error) {
    console.error("GET /api/calendar/token error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST: Regenerate token (invalidates old feed URL)
export async function POST() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Delete existing token if any
    await prisma.calendarToken.deleteMany({
      where: { userId: user.id },
    });

    // Create a new token (secret cryptographique, pas un cuid prévisible)
    const calendarToken = await prisma.calendarToken.create({
      data: { userId: user.id, token: newFeedToken() },
    });

    return NextResponse.json({ token: calendarToken.token });
  } catch (error) {
    console.error("POST /api/calendar/token error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
