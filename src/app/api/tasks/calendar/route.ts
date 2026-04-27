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
    const start = searchParams.get("start");
    const end = searchParams.get("end");

    if (!workspaceId) {
      return NextResponse.json({ error: "workspaceId required" }, { status: 400 });
    }

    const membership = await prisma.workspaceMember.findUnique({
      where: { workspaceId_userId: { workspaceId, userId: user.id } },
    });

    if (!membership) {
      return NextResponse.json({ error: "Not a member" }, { status: 403 });
    }

    const where: Record<string, unknown> = {
      list: { space: { workspaceId } },
      dueDate: { not: null },
    };

    if (start && end) {
      where.dueDate = {
        gte: new Date(start),
        lte: new Date(end),
      };
    }

    const tasks = await prisma.task.findMany({
      where,
      select: {
        id: true,
        title: true,
        priority: true,
        dueDate: true,
        status: { select: { id: true, name: true, color: true } },
        assignee: { select: { id: true, name: true, email: true, image: true } },
        list: { select: { id: true, name: true } },
      },
      orderBy: { dueDate: "asc" },
      take: 500,
    });

    return NextResponse.json(tasks);
  } catch (error) {
    console.error("GET /api/tasks/calendar error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
