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

    const existing = await prisma.pushSubscription.findUnique({
      where: { fcmToken },
    });

    if (existing && existing.userId !== user.id) {
      return NextResponse.json(
        { error: "Ce jeton appartient déjà à un autre compte" },
        { status: 409 }
      );
    }

    await prisma.pushSubscription.upsert({
      where: { fcmToken },
      update: { provider: "fcm" },
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
