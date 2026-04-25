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
    const q = searchParams.get("q");
    const workspaceId = searchParams.get("workspaceId");

    if (!q || !workspaceId) {
      return NextResponse.json(
        { error: "q and workspaceId query params are required" },
        { status: 400 }
      );
    }

    // Verify membership
    const membership = await prisma.workspaceMember.findUnique({
      where: {
        workspaceId_userId: { workspaceId, userId: user.id },
      },
    });

    if (!membership) {
      return NextResponse.json(
        { error: "Workspace not found" },
        { status: 404 }
      );
    }

    // Search tasks
    const tasks = await prisma.task.findMany({
      where: {
        list: {
          space: { workspaceId },
        },
        OR: [
          { title: { contains: q } },
          { description: { contains: q } },
        ],
      },
      include: {
        status: true,
        assignee: {
          select: { id: true, name: true, email: true, image: true },
        },
        list: {
          select: { id: true, name: true },
        },
      },
      take: 20,
      orderBy: { updatedAt: "desc" },
    });

    // Search lists
    const lists = await prisma.list.findMany({
      where: {
        space: { workspaceId },
        name: { contains: q },
      },
      include: {
        space: { select: { id: true, name: true } },
        _count: { select: { tasks: true } },
      },
      take: 10,
      orderBy: { updatedAt: "desc" },
    });

    // Search spaces
    const spaces = await prisma.space.findMany({
      where: {
        workspaceId,
        OR: [
          { name: { contains: q } },
          { description: { contains: q } },
        ],
      },
      take: 10,
      orderBy: { updatedAt: "desc" },
    });

    return NextResponse.json({
      tasks,
      lists,
      spaces,
    });
  } catch (error) {
    console.error("GET /api/search error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
