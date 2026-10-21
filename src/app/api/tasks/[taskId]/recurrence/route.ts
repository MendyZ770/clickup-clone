import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth-helpers";
import { verifyTaskAccess } from "@/lib/task-auth";
import { computeNextDueDate } from "@/lib/recurrence";

const VALID_PATTERNS = new Set([
  "daily",
  "weekly",
  "biweekly",
  "monthly",
  "yearly",
  "custom",
]);

export async function GET(_req: Request, { params }: { params: Promise<{ taskId: string }> }) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { taskId } = await params;
    if (!(await verifyTaskAccess(taskId, user.id))) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
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
    if (!(await verifyTaskAccess(taskId, user.id))) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    const body = await req.json();
    const pattern = typeof body.pattern === "string" ? body.pattern : "";
    if (!VALID_PATTERNS.has(pattern)) {
      return NextResponse.json({ error: "Récurrence invalide" }, { status: 400 });
    }

    const rawInterval = Number(body.interval ?? 1);
    if (!Number.isFinite(rawInterval)) {
      return NextResponse.json({ error: "Intervalle invalide" }, { status: 400 });
    }
    const interval = Math.min(30, Math.max(1, Math.trunc(rawInterval)));

    let daysOfWeek: string | null = null;
    if (Array.isArray(body.daysOfWeek)) {
      const days = body.daysOfWeek.filter(
        (day: unknown): day is number =>
          Number.isInteger(day) && (day as number) >= 0 && (day as number) <= 6
      );
      daysOfWeek = days.length > 0 ? JSON.stringify(days) : null;
    } else if (typeof body.daysOfWeek === "string") {
      daysOfWeek = body.daysOfWeek;
    }

    const dayOfMonth =
      Number.isInteger(body.dayOfMonth) &&
      body.dayOfMonth >= 1 &&
      body.dayOfMonth <= 31
        ? body.dayOfMonth
        : null;

    const endDate = body.endDate ? new Date(body.endDate) : null;
    if (endDate && Number.isNaN(endDate.getTime())) {
      return NextResponse.json({ error: "Date de fin invalide" }, { status: 400 });
    }
    const now = new Date();
    if (endDate && endDate < now) {
      return NextResponse.json(
        { error: "La date de fin doit être dans le futur" },
        { status: 400 }
      );
    }

    const task = await prisma.task.findUnique({
      where: { id: taskId },
      select: { dueDate: true },
    });
    if (!task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    // Une échéance passée doit produire la prochaine occurrence dans le futur
    const baseDate = task.dueDate && task.dueDate > now ? task.dueDate : now;
    const nextDueDate = computeNextDueDate(
      { pattern, interval, daysOfWeek, dayOfMonth, endDate },
      baseDate
    );

    const recurrence = await prisma.taskRecurrence.upsert({
      where: { taskId },
      update: {
        pattern,
        interval,
        daysOfWeek,
        dayOfMonth,
        endDate,
        nextDueDate,
      },
      create: {
        taskId,
        pattern,
        interval,
        daysOfWeek,
        dayOfMonth,
        endDate,
        nextDueDate,
      },
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
    if (!(await verifyTaskAccess(taskId, user.id))) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    await prisma.taskRecurrence.deleteMany({ where: { taskId } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
