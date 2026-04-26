import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createICSFromTasks } from "@/lib/calendar-helpers";

export async function GET(
  _request: Request,
  { params }: { params: { token: string } }
) {
  try {
    const { token } = params;

    // Look up the calendar token - the token itself is the auth
    const calendarToken = await prisma.calendarToken.findUnique({
      where: { token },
      include: { user: true },
    });

    if (!calendarToken) {
      return NextResponse.json(
        { error: "Invalid calendar feed token" },
        { status: 404 }
      );
    }

    const userId = calendarToken.userId;

    // Fetch all tasks for this user across all workspaces they're a member of
    // that have a dueDate set
    const tasks = await prisma.task.findMany({
      where: {
        dueDate: { not: null },
        list: {
          space: {
            workspace: {
              members: {
                some: { userId },
              },
            },
          },
        },
        OR: [
          { assigneeId: userId },
          { creatorId: userId },
        ],
      },
      include: {
        status: true,
        list: {
          include: {
            space: {
              include: {
                workspace: true,
              },
            },
          },
        },
      },
      orderBy: { dueDate: "asc" },
    });

    // Filter tasks that actually have a dueDate (TypeScript narrowing)
    const tasksWithDueDate = tasks.filter(
      (task): task is typeof task & { dueDate: Date } => task.dueDate !== null
    );

    const calendar = createICSFromTasks(tasksWithDueDate);

    return new Response(calendar.toString(), {
      status: 200,
      headers: {
        "Content-Type": "text/calendar; charset=utf-8",
        "Content-Disposition": 'inline; filename="clickup-clone-tasks.ics"',
        "Cache-Control": "no-cache, no-store, must-revalidate",
      },
    });
  } catch (error) {
    console.error("GET /api/calendar/feed/[token] error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
