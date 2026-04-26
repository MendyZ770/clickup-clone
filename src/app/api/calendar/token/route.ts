import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth-helpers";

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
        data: { userId: user.id },
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

    // Create a new token
    const calendarToken = await prisma.calendarToken.create({
      data: { userId: user.id },
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
