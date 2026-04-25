import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth-helpers";
import { z } from "zod";

const createChecklistSchema = z.object({
  title: z.string().min(1, "Title is required").max(200),
});

interface RouteContext {
  params: Promise<{ taskId: string }>;
}

export async function GET(request: Request, context: RouteContext) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { taskId } = await context.params;

    const checklists = await prisma.checklist.findMany({
      where: { taskId },
      include: {
        items: { orderBy: { order: "asc" } },
      },
      orderBy: { order: "asc" },
    });

    return NextResponse.json(checklists);
  } catch (error) {
    console.error("GET /api/tasks/[id]/checklists error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request, context: RouteContext) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { taskId } = await context.params;

    // Verify task exists and user has access
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: {
        list: {
          include: {
            space: {
              include: {
                workspace: {
                  include: { members: { where: { userId: user.id } } },
                },
              },
            },
          },
        },
      },
    });

    if (!task || task.list.space.workspace.members.length === 0) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    const body = await request.json();
    const parsed = createChecklistSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const lastChecklist = await prisma.checklist.findFirst({
      where: { taskId },
      orderBy: { order: "desc" },
    });

    const checklist = await prisma.checklist.create({
      data: {
        title: parsed.data.title,
        order: lastChecklist ? lastChecklist.order + 1 : 0,
        taskId,
      },
      include: {
        items: { orderBy: { order: "asc" } },
      },
    });

    return NextResponse.json(checklist, { status: 201 });
  } catch (error) {
    console.error("POST /api/tasks/[id]/checklists error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
