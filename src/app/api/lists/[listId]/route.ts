import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth-helpers";
import { updateListSchema } from "@/lib/validations/list";

interface RouteContext {
  params: Promise<{ listId: string }>;
}

export async function GET(request: Request, context: RouteContext) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { listId } = await context.params;

    const list = await prisma.list.findUnique({
      where: { id: listId },
      include: {
        space: {
          include: {
            workspace: {
              include: { members: { where: { userId: user.id } } },
            },
          },
        },
        statuses: { orderBy: { order: "asc" } },
        _count: { select: { tasks: true } },
      },
    });

    if (!list || list.space.workspace.members.length === 0) {
      return NextResponse.json({ error: "List not found" }, { status: 404 });
    }

    const { space: _space, ...listData } = list;
    void _space;
    return NextResponse.json(listData);
  } catch (error) {
    console.error("GET /api/lists/[id] error:", error);
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

    const { listId } = await context.params;

    const list = await prisma.list.findUnique({
      where: { id: listId },
      include: {
        space: {
          include: {
            workspace: {
              include: { members: { where: { userId: user.id } } },
            },
          },
        },
      },
    });

    if (!list || list.space.workspace.members.length === 0) {
      return NextResponse.json({ error: "List not found" }, { status: 404 });
    }

    const body = await request.json();
    const parsed = updateListSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const updated = await prisma.list.update({
      where: { id: listId },
      data: parsed.data,
      include: {
        statuses: { orderBy: { order: "asc" } },
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("PATCH /api/lists/[id] error:", error);
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

    const { listId } = await context.params;

    const list = await prisma.list.findUnique({
      where: { id: listId },
      include: {
        space: {
          include: {
            workspace: {
              include: { members: { where: { userId: user.id } } },
            },
          },
        },
      },
    });

    if (!list || list.space.workspace.members.length === 0) {
      return NextResponse.json({ error: "List not found" }, { status: 404 });
    }

    await prisma.list.delete({ where: { id: listId } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/lists/[id] error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
