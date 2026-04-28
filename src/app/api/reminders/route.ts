import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth-helpers";
import { addDays } from "date-fns";

export async function GET(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const workspaceId = searchParams.get("workspaceId");
    const upcoming = searchParams.get("upcoming");

    if (!workspaceId) {
      return NextResponse.json(
        { error: "workspaceId is required" },
        { status: 400 }
      );
    }

    const where: Record<string, unknown> = {
      userId: user.id,
      workspaceId,
    };

    if (upcoming === "true") {
      where.remindAt = {
        lte: addDays(new Date(), 7),
      };
      where.completed = false;
    }

    const reminders = await prisma.reminder.findMany({
      where,
      include: {
        task: {
          select: {
            id: true,
            title: true,
          },
        },
      },
      orderBy: { remindAt: "asc" },
    });

    return NextResponse.json(reminders);
  } catch (error) {
    console.error("GET /api/reminders error:", error);
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
    const { title, description, remindAt, taskId, workspaceId } = body;

    if (!title || !remindAt || !workspaceId) {
      return NextResponse.json(
        { error: "title, remindAt, and workspaceId are required" },
        { status: 400 }
      );
    }

    // Verify user is a member of the workspace
    const membership = await prisma.workspaceMember.findUnique({
      where: {
        workspaceId_userId: {
          workspaceId,
          userId: user.id,
        },
      },
    });

    if (!membership) {
      return NextResponse.json(
        { error: "Not a member of this workspace" },
        { status: 403 }
      );
    }

    const reminder = await prisma.reminder.create({
      data: {
        title,
        description: description || null,
        remindAt: new Date(remindAt),
        taskId: taskId || null,
        userId: user.id,
        workspaceId,
      },
      include: {
        task: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    });

    return NextResponse.json(reminder, { status: 201 });
  } catch (error) {
    console.error("POST /api/reminders error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { id, completed } = body;

    if (!id) {
      return NextResponse.json(
        { error: "id is required" },
        { status: 400 }
      );
    }

    // Verify ownership
    const existing = await prisma.reminder.findFirst({
      where: { id, userId: user.id },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Reminder not found" },
        { status: 404 }
      );
    }

    const reminder = await prisma.reminder.update({
      where: { id },
      data: {
        ...(typeof completed === "boolean" ? { completed } : {}),
      },
      include: {
        task: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    });

    return NextResponse.json(reminder);
  } catch (error) {
    console.error("PATCH /api/reminders error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "id query param is required" },
        { status: 400 }
      );
    }

    // Verify ownership
    const existing = await prisma.reminder.findFirst({
      where: { id, userId: user.id },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Reminder not found" },
        { status: 404 }
      );
    }

    await prisma.reminder.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/reminders error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
