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

    if (!workspaceId) {
      return NextResponse.json(
        { error: "workspaceId query param is required" },
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

    // Get all favorites for user
    const favorites = await prisma.favorite.findMany({
      where: { userId: user.id },
      orderBy: { order: "asc" },
    });

    // Resolve target details for each favorite and filter by workspace
    const enriched = await Promise.all(
      favorites.map(async (fav) => {
        if (fav.type === "space") {
          const space = await prisma.space.findUnique({
            where: { id: fav.targetId },
            select: {
              id: true,
              name: true,
              color: true,
              icon: true,
              workspaceId: true,
            },
          });
          if (!space || space.workspaceId !== workspaceId) return null;
          return {
            ...fav,
            name: space.name,
            color: space.color,
            icon: space.icon,
            workspaceId: space.workspaceId,
            spaceId: space.id,
          };
        }

        if (fav.type === "list") {
          const list = await prisma.list.findUnique({
            where: { id: fav.targetId },
            select: {
              id: true,
              name: true,
              color: true,
              spaceId: true,
              space: { select: { workspaceId: true } },
            },
          });
          if (!list || list.space.workspaceId !== workspaceId) return null;
          return {
            ...fav,
            name: list.name,
            color: list.color,
            workspaceId: list.space.workspaceId,
            spaceId: list.spaceId,
          };
        }

        if (fav.type === "task") {
          const task = await prisma.task.findUnique({
            where: { id: fav.targetId },
            select: {
              id: true,
              title: true,
              listId: true,
              list: {
                select: {
                  spaceId: true,
                  space: { select: { workspaceId: true } },
                },
              },
            },
          });
          if (!task || task.list.space.workspaceId !== workspaceId) return null;
          return {
            ...fav,
            name: task.title,
            workspaceId: task.list.space.workspaceId,
            spaceId: task.list.spaceId,
            listId: task.listId,
          };
        }

        return null;
      })
    );

    const result = enriched.filter(Boolean);

    return NextResponse.json(result);
  } catch (error) {
    console.error("GET /api/favorites error:", error);
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
    const { type, targetId, workspaceId } = body;

    if (!type || !targetId || !workspaceId) {
      return NextResponse.json(
        { error: "type, targetId, and workspaceId are required" },
        { status: 400 }
      );
    }

    if (!["task", "list", "space"].includes(type)) {
      return NextResponse.json(
        { error: "type must be task, list, or space" },
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

    // Get next order value
    const lastFavorite = await prisma.favorite.findFirst({
      where: { userId: user.id },
      orderBy: { order: "desc" },
    });

    const favorite = await prisma.favorite.create({
      data: {
        type,
        targetId,
        userId: user.id,
        order: lastFavorite ? lastFavorite.order + 1 : 0,
      },
    });

    return NextResponse.json(favorite, { status: 201 });
  } catch (error) {
    console.error("POST /api/favorites error:", error);
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
    const favorite = await prisma.favorite.findUnique({
      where: { id },
    });

    if (!favorite || favorite.userId !== user.id) {
      return NextResponse.json(
        { error: "Favorite not found" },
        { status: 404 }
      );
    }

    await prisma.favorite.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/favorites error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
