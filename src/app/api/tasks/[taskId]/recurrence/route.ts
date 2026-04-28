import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth-helpers";

export async function GET(_req: Request, { params }: { params: Promise<{ taskId: string }> }) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { taskId } = await params;
    const recurrence = await prisma.taskRecurrence.findUnique({ where: { taskId } });
    return NextResponse.json(recurrence);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(req: Request, { params }: { params: Promise<{ taskId: string }> }) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { taskId } = await params;
    const body = await req.json();
    const { pattern, interval, daysOfWeek, dayOfMonth, endDate } = body;

    const recurrence = await prisma.taskRecurrence.upsert({
      where: { taskId },
      update: { pattern, interval: interval ?? 1, daysOfWeek, dayOfMonth, endDate: endDate ? new Date(endDate) : null },
      create: { taskId, pattern, interval: interval ?? 1, daysOfWeek, dayOfMonth, endDate: endDate ? new Date(endDate) : null },
    });
    return NextResponse.json(recurrence);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ taskId: string }> }) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { taskId } = await params;
    await prisma.taskRecurrence.deleteMany({ where: { taskId } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
