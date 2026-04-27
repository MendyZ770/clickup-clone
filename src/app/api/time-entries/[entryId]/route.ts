import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth-helpers";

export async function GET(
  request: Request,
  { params }: { params: { entryId: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const entry = await prisma.timeEntry.findUnique({
      where: { id: params.entryId },
      include: {
        task: {
          select: { id: true, title: true, listId: true },
        },
        user: {
          select: { id: true, name: true, email: true, image: true },
        },
      },
    });

    if (!entry) {
      return NextResponse.json(
        { error: "Time entry not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(entry);
  } catch (error) {
    console.error("GET /api/time-entries/[entryId] error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: { entryId: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { description, startTime, endTime, duration, billable } = body;

    const existing = await prisma.timeEntry.findUnique({
      where: { id: params.entryId },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Time entry not found" },
        { status: 404 }
      );
    }

    if (existing.userId !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const updateData: Record<string, unknown> = {};
    if (description !== undefined) updateData.description = description;
    if (startTime !== undefined) updateData.startTime = new Date(startTime);
    if (endTime !== undefined)
      updateData.endTime = endTime ? new Date(endTime) : null;
    if (duration !== undefined) updateData.duration = duration;
    if (billable !== undefined) updateData.billable = billable;

    // Recalculate duration if start/end times changed
    const newStart = startTime
      ? new Date(startTime)
      : existing.startTime;
    const newEnd = endTime
      ? new Date(endTime)
      : endTime === null
        ? null
        : existing.endTime;

    if (newStart && newEnd && duration === undefined) {
      updateData.duration = Math.round(
        (newEnd.getTime() - newStart.getTime()) / 1000
      );
    }

    const entry = await prisma.timeEntry.update({
      where: { id: params.entryId },
      data: updateData,
      include: {
        task: {
          select: { id: true, title: true, listId: true },
        },
        user: {
          select: { id: true, name: true, email: true, image: true },
        },
      },
    });

    return NextResponse.json(entry);
  } catch (error) {
    console.error("PATCH /api/time-entries/[entryId] error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { entryId: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const existing = await prisma.timeEntry.findUnique({
      where: { id: params.entryId },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Time entry not found" },
        { status: 404 }
      );
    }

    if (existing.userId !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await prisma.timeEntry.delete({
      where: { id: params.entryId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/time-entries/[entryId] error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
