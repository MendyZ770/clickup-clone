import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const { endpoint } = await request.json();
    if (!endpoint) {
      return NextResponse.json({ error: "Missing endpoint" }, { status: 400 });
    }

    await prisma.pushSubscription.deleteMany({ where: { endpoint } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("POST /api/push/unsubscribe error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
