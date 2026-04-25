import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth-helpers";
import { updateSpaceSchema } from "@/lib/validations/space";

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
          include: {
            members: { where: { userId: user.id } },
          },
        },
        folders: {
          orderBy: { order: "asc" },
          include: {
            lists: {
              orderBy: { order: "asc" },
              include: { statuses: { orderBy: { order: "asc" } } },
            },
          },
        },
        lists: {
          where: { folderId: null },
          orderBy: { order: "asc" },
          include: { statuses: { orderBy: { order: "asc" } } },
        },
      },
    });

    if (!space || space.workspace.members.length === 0) {
      return NextResponse.json({ error: "Space not found" }, { status: 404 });
    }

    // Remove workspace membership info from response
    const { workspace: _workspace, ...spaceData } = space;
    void _workspace;
    return NextResponse.json(spaceData);
  } catch (error) {
    console.error("GET /api/spaces/[id] error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { spaceId } = await context.params;

    // Check access
    const space = await prisma.space.findUnique({
      where: { id: spaceId },
      include: {
        workspace: {
          include: {
            members: { where: { userId: user.id } },
          },
        },
      },
    });

    if (!space || space.workspace.members.length === 0) {
      return NextResponse.json({ error: "Space not found" }, { status: 404 });
    }

    const body = await request.json();
    const parsed = updateSpaceSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const updated = await prisma.space.update({
      where: { id: spaceId },
      data: parsed.data,
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("PATCH /api/spaces/[id] error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request, context: RouteContext) {
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
          include: {
            members: { where: { userId: user.id } },
          },
        },
      },
    });

    if (!space || space.workspace.members.length === 0) {
      return NextResponse.json({ error: "Space not found" }, { status: 404 });
    }

    await prisma.space.delete({ where: { id: spaceId } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/spaces/[id] error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
