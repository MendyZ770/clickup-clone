import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth-helpers";
import { Prisma } from "@prisma/client";

export async function GET(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const taskId = searchParams.get("taskId");
    const userId = searchParams.get("userId");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    const where: Prisma.TimeEntryWhereInput = {};

    if (taskId) where.taskId = taskId;
    if (userId) where.userId = userId;

    if (startDate || endDate) {
      where.startTime = {};
      if (startDate) {
        (where.startTime as Prisma.DateTimeFilter).gte = new Date(startDate);
      }
      if (endDate) {
        (where.startTime as Prisma.DateTimeFilter).lte = new Date(endDate);
      }
    }

    const entries = await prisma.timeEntry.findMany({
      where,
      include: {
        task: {
          select: { id: true, title: true, listId: true },
        },
        user: {
          select: { id: true, name: true, email: true, image: true },
        },
      },
      orderBy: { startTime: "desc" },
    });

    return NextResponse.json(entries);
  } catch (error) {
    console.error("GET /api/time-entries error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { startTime, endTime, duration, description, taskId, billable } =
      body;

    if (!taskId || !startTime) {
      return NextResponse.json(
        { error: "taskId and startTime are required" },
        { status: 400 }
      );
    }

    // Verify the task exists
    const task = await prisma.task.findUnique({
      where: { id: taskId },
    });

    if (!task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    const start = new Date(startTime);
    const end = endTime ? new Date(endTime) : null;

    // Calculate duration if not provided but we have start and end
    let calculatedDuration = duration;
    if (!calculatedDuration && end) {
      calculatedDuration = Math.round(
        (end.getTime() - start.getTime()) / 1000
      );
    }

    const entry = await prisma.timeEntry.create({
      data: {
        startTime: start,
        endTime: end,
        duration: calculatedDuration,
        description: description || null,
        billable: billable ?? false,
        taskId,
        userId: user.id,
      },
      include: {
        task: {
          select: { id: true, title: true, listId: true },
        },
        user: {
          select: { id: true, name: true, email: true, image: true },
        },
      },
    });

    return NextResponse.json(entry, { status: 201 });
  } catch (error) {
    console.error("POST /api/time-entries error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
