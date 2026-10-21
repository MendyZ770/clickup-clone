import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth-helpers";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ dashboardId: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { dashboardId } = await params;
    const body = await request.json();
    const { type, x, y, w, h } = body;

    const dashboard = await prisma.dashboard.findUnique({
      where: { id: dashboardId },
      include: { workspace: { include: { members: true } } },
    });

    if (!dashboard) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const isMember = dashboard.workspace.members.some(
      (m) => m.userId === user.id
    );
    if (!isMember) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const widget = await prisma.widget.create({
      data: {
        type,
        x: x || 0,
        y: y || 0,
        w: w || 3,
        h: h || 2,
        dashboardId,
      },
    });

    return NextResponse.json(widget);
  } catch (error) {
    console.error("Failed to create widget:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ dashboardId: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { dashboardId } = await params;
    const body = await request.json();
    const { layout } = body; // Array of { id, x, y, w, h }

    if (!Array.isArray(layout)) {
      return NextResponse.json({ error: "Invalid layout" }, { status: 400 });
    }

    const dashboard = await prisma.dashboard.findUnique({
      where: { id: dashboardId },
      include: { workspace: { include: { members: true } } },
    });

    if (!dashboard || !dashboard.workspace.members.some((m) => m.userId === user.id)) {
      return NextResponse.json({ error: "Not found or Forbidden" }, { status: 404 });
    }

    // Update all widgets in a transaction, en les confinant à ce dashboard
    const updatePromises = layout.map((item) =>
      prisma.widget.updateMany({
        where: { id: item.id, dashboardId },
        data: {
          x: item.x,
          y: item.y,
          w: item.w,
          h: item.h,
        },
      })
    );

    await prisma.$transaction(updatePromises);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to update layout:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ dashboardId: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { dashboardId } = await params;
    const { searchParams } = new URL(request.url);
    const widgetId = searchParams.get("widgetId");

    if (!widgetId) {
      return NextResponse.json({ error: "widgetId required" }, { status: 400 });
    }

    const dashboard = await prisma.dashboard.findUnique({
      where: { id: dashboardId },
      include: { workspace: { include: { members: true } } },
    });

    if (!dashboard || !dashboard.workspace.members.some((m) => m.userId === user.id)) {
      return NextResponse.json({ error: "Not found or Forbidden" }, { status: 404 });
    }

    const deleted = await prisma.widget.deleteMany({
      where: { id: widgetId, dashboardId },
    });
    if (deleted.count === 0) {
      return NextResponse.json({ error: "Widget not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete widget:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
