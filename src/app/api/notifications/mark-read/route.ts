import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth-helpers";
import { z } from "zod";

const markReadSchema = z.union([
  z.object({ notificationId: z.string().min(1), all: z.undefined().optional() }),
  z.object({ all: z.literal(true), notificationId: z.undefined().optional() }),
]);

export async function PATCH(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const parsed = markReadSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Provide either notificationId or { all: true }" },
        { status: 400 }
      );
    }

    const data = parsed.data;

    if ("all" in data && data.all === true) {
      await prisma.notification.updateMany({
        where: { userId: user.id, read: false },
        data: { read: true },
      });
      return NextResponse.json({ success: true, message: "All notifications marked as read" });
    }

    if ("notificationId" in data && data.notificationId) {
      const notification = await prisma.notification.findFirst({
        where: { id: data.notificationId, userId: user.id },
      });

      if (!notification) {
        return NextResponse.json(
          { error: "Notification not found" },
          { status: 404 }
        );
      }

      await prisma.notification.update({
        where: { id: data.notificationId },
        data: { read: true },
      });

      return NextResponse.json({ success: true });
    }

    return NextResponse.json(
      { error: "Provide either notificationId or { all: true }" },
      { status: 400 }
    );
  } catch (error) {
    console.error("PATCH /api/notifications/mark-read error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
