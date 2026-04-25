import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth-helpers";
import { z } from "zod";

const createStatusSchema = z.object({
  name: z.string().min(1, "Name is required").max(50),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  type: z.enum(["todo", "in_progress", "review", "done", "closed", "custom"]).optional(),
});

const updateStatusSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1).max(50).optional(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  order: z.number().int().min(0).optional(),
});

interface RouteContext {
  params: Promise<{ listId: string }>;
}

async function verifyListAccess(listId: string, userId: string) {
  const list = await prisma.list.findUnique({
    where: { id: listId },
    include: {
      space: {
        include: {
          workspace: {
            include: { members: { where: { userId } } },
          },
        },
      },
    },
  });
  if (!list || list.space.workspace.members.length === 0) return null;
  return list;
}

export async function GET(request: Request, context: RouteContext) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { listId } = await context.params;

    const list = await verifyListAccess(listId, user.id);
    if (!list) {
      return NextResponse.json({ error: "List not found" }, { status: 404 });
    }

    const statuses = await prisma.status.findMany({
      where: { listId },
      orderBy: { order: "asc" },
    });

    return NextResponse.json(statuses);
  } catch (error) {
    console.error("GET /api/lists/[id]/statuses error:", error);
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

    const { listId } = await context.params;

    const list = await verifyListAccess(listId, user.id);
    if (!list) {
      return NextResponse.json({ error: "List not found" }, { status: 404 });
    }

    const body = await request.json();
    const parsed = createStatusSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { name, color, type } = parsed.data;

    const lastStatus = await prisma.status.findFirst({
      where: { listId },
      orderBy: { order: "desc" },
    });

    const status = await prisma.status.create({
      data: {
        name,
        color: color ?? "#6B7280",
        type: type ?? "custom",
        order: lastStatus ? lastStatus.order + 1 : 0,
        listId,
      },
    });

    return NextResponse.json(status, { status: 201 });
  } catch (error) {
    console.error("POST /api/lists/[id]/statuses error:", error);
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

    const list = await verifyListAccess(listId, user.id);
    if (!list) {
      return NextResponse.json({ error: "List not found" }, { status: 404 });
    }

    const body = await request.json();
    const parsed = updateStatusSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { id, ...data } = parsed.data;

    // Verify status belongs to this list
    const existingStatus = await prisma.status.findFirst({
      where: { id, listId },
    });
    if (!existingStatus) {
      return NextResponse.json(
        { error: "Status not found in this list" },
        { status: 404 }
      );
    }

    const updated = await prisma.status.update({
      where: { id },
      data,
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("PATCH /api/lists/[id]/statuses error:", error);
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
    const { searchParams } = new URL(request.url);
    const statusId = searchParams.get("statusId");

    if (!statusId) {
      return NextResponse.json(
        { error: "statusId query param is required" },
        { status: 400 }
      );
    }

    const list = await verifyListAccess(listId, user.id);
    if (!list) {
      return NextResponse.json({ error: "List not found" }, { status: 404 });
    }

    // Verify status belongs to this list
    const status = await prisma.status.findFirst({
      where: { id: statusId, listId },
    });
    if (!status) {
      return NextResponse.json(
        { error: "Status not found in this list" },
        { status: 404 }
      );
    }

    // Check if any tasks use this status
    const taskCount = await prisma.task.count({
      where: { statusId },
    });
    if (taskCount > 0) {
      return NextResponse.json(
        {
          error: `Cannot delete status: ${taskCount} task(s) are using it. Move them first.`,
        },
        { status: 409 }
      );
    }

    await prisma.status.delete({ where: { id: statusId } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/lists/[id]/statuses error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
