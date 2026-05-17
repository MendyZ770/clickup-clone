import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth-helpers";

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { endpoint, p256dh, auth } = body;

    if (!endpoint || !p256dh || !auth) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    // Upsert: delete old subscriptions for same endpoint, create new
    await prisma.pushSubscription.deleteMany({ where: { endpoint } });

    await prisma.pushSubscription.create({
      data: {
        endpoint,
        p256dh,
        auth,
        userId: user.id,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("POST /api/push/subscribe error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
