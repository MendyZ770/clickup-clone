import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth-helpers";
import { verifyTaskAccess } from "@/lib/task-auth";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Find running timer (entry with no endTime) for the current user
    const runningTimer = await prisma.timeEntry.findFirst({
      where: {
        userId: user.id,
        endTime: null,
      },
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

    return NextResponse.json(runningTimer);
  } catch (error) {
    console.error("GET /api/time-entries/timer error:", error);
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
    const { action, taskId, description } = body;

    if (action === "start") {
      if (!taskId) {
        return NextResponse.json(
          { error: "taskId is required to start a timer" },
          { status: 400 }
        );
      }

      if (!(await verifyTaskAccess(taskId, user.id))) {
        return NextResponse.json({ error: "Task not found" }, { status: 404 });
      }

      const now = new Date();
      const entry = await prisma.$transaction(async (tx) => {
        const existingTimer = await tx.timeEntry.findFirst({
          where: { userId: user.id, endTime: null },
          orderBy: { startTime: "desc" },
        });

        if (existingTimer) {
          const duration = Math.max(
            0,
            Math.round((now.getTime() - existingTimer.startTime.getTime()) / 1000)
          );
          await tx.timeEntry.update({
            where: { id: existingTimer.id },
            data: { endTime: now, duration },
          });
        }

        return tx.timeEntry.create({
          data: {
            startTime: now,
            taskId,
            userId: user.id,
            description: description || null,
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
      });

      return NextResponse.json(entry, { status: 201 });
    }

    if (action === "stop") {
      // Find running timer for user
      const runningTimer = await prisma.timeEntry.findFirst({
        where: {
          userId: user.id,
          endTime: null,
        },
      });

      if (!runningTimer) {
        return NextResponse.json(
          { error: "No running timer found" },
          { status: 404 }
        );
      }

      const now = new Date();
      const duration = Math.round(
        (now.getTime() - runningTimer.startTime.getTime()) / 1000
      );

      const entry = await prisma.timeEntry.update({
        where: { id: runningTimer.id },
        data: {
          endTime: now,
          duration,
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

      return NextResponse.json(entry);
    }

    return NextResponse.json(
      { error: "Invalid action. Use 'start' or 'stop'" },
      { status: 400 }
    );
  } catch (error) {
    if ((error as { code?: string }).code === "P2002") {
      return NextResponse.json(
        { error: "Un minuteur est déjà actif" },
        { status: 409 }
      );
    }
    console.error("POST /api/time-entries/timer error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
