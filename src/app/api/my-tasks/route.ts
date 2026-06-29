import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth-helpers";

export async function GET(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const workspaceId = searchParams.get("workspaceId");
    const mode = searchParams.get("mode") || "me";
    if (!workspaceId) {
      return NextResponse.json({ error: "workspaceId required" }, { status: 400 });
    }

    const whereClause = mode === "team" ? {
      assignees: { some: {} },
      NOT: { assignees: { some: { userId: user.id } } },
      list: { space: { workspaceId } },
      parentId: null,
    } : {
      OR: [
        { assignees: { some: { userId: user.id } } },
        { assignees: { none: {} } }
      ],
      list: { space: { workspaceId } },
      parentId: null,
    };

    const tasks = await prisma.task.findMany({
      where: whereClause,
      include: {
        status: true,
        assignees: {
          include: {
            user: { select: { id: true, name: true, email: true, image: true } }
          }
        },
        list: {
          select: { id: true, name: true, space: { select: { id: true, name: true } } },
        },
        taskTags: { include: { tag: true } },
        _count: { select: { subtasks: true, comments: true } },
      },
      orderBy: [
        { dueDate: "asc" },
        { createdAt: "desc" },
      ],
      take: 100,
    });

    return NextResponse.json(tasks);
  } catch (error) {
    console.error("GET /api/my-tasks error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
