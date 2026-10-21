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

    const existing = await prisma.pushSubscription.findUnique({
      where: { endpoint },
    });

    if (existing && existing.userId !== user.id) {
      return NextResponse.json(
        { error: "Cet abonnement appartient déjà à un autre compte" },
        { status: 409 }
      );
    }

    if (existing) {
      await prisma.pushSubscription.update({
        where: { id: existing.id },
        data: { p256dh, auth, provider: "web" },
      });
    } else {
      await prisma.pushSubscription.create({
        data: {
          endpoint,
          p256dh,
          auth,
          userId: user.id,
        },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("POST /api/push/subscribe error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
