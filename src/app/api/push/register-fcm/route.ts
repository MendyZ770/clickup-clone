import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth-helpers";

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { fcmToken } = await request.json();
    if (!fcmToken || typeof fcmToken !== "string") {
      return NextResponse.json({ error: "fcmToken required" }, { status: 400 });
    }

    // Upsert : si le token existe déjà pour un autre user, on le réassigne
    await prisma.pushSubscription.upsert({
      where: { fcmToken },
      update: { userId: user.id },
      create: {
        fcmToken,
        provider: "fcm",
        userId: user.id,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[FCM_REGISTER]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
