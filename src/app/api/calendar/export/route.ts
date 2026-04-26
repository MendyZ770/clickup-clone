import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth-helpers";
import { createICSFromTasks } from "@/lib/calendar-helpers";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch all tasks with due dates for this user
    const tasks = await prisma.task.findMany({
      where: {
        dueDate: { not: null },
        list: {
          space: {
            workspace: {
              members: {
                some: { userId: user.id },
              },
            },
          },
        },
        OR: [
          { assigneeId: user.id },
          { creatorId: user.id },
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

    const tasksWithDueDate = tasks.filter(
      (task): task is typeof task & { dueDate: Date } => task.dueDate !== null
    );

    const calendar = createICSFromTasks(tasksWithDueDate);

    return new Response(calendar.toString(), {
      status: 200,
      headers: {
        "Content-Type": "text/calendar; charset=utf-8",
        "Content-Disposition": 'attachment; filename="clickup-tasks.ics"',
      },
    });
  } catch (error) {
    console.error("GET /api/calendar/export error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
