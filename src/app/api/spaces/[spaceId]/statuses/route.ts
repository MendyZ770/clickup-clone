import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth-helpers";

interface RouteContext {
  params: Promise<{ spaceId: string }>;
}

export async function GET(request: Request, context: RouteContext) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { spaceId } = await context.params;

    const space = await prisma.space.findUnique({
      where: { id: spaceId },
      include: {
        workspace: {
          include: { members: { where: { userId: user.id } } },
        },
      },
    });

    if (!space || space.workspace.members.length === 0) {
      return NextResponse.json({ error: "Space not found" }, { status: 404 });
    }

    // Get all statuses from all lists in this space
    const statuses = await prisma.status.findMany({
      where: { list: { spaceId } },
      orderBy: { order: "asc" },
    });

    // Group by name
    const grouped = new Map<string, typeof statuses[0]>();
    for (const status of statuses) {
      const normalizedName = status.name.trim().toLowerCase();
      if (!grouped.has(normalizedName)) {
        // use 'global:NAME' as ID for the frontend mapping
        grouped.set(normalizedName, {
          ...status,
          id: `global:${status.name}`, 
        });
      }
    }

    const result = Array.from(grouped.values()).sort((a, b) => {
      // Very basic sort by type and order
      const typeOrder = { todo: 1, in_progress: 2, review: 3, done: 4, closed: 5, custom: 6 } as Record<string, number>;
      const aType = typeOrder[a.type] ?? 99;
      const bType = typeOrder[b.type] ?? 99;
      if (aType !== bType) return aType - bType;
      return a.order - b.order;
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("GET /api/spaces/[id]/statuses error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
