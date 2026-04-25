import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth-helpers";
import { z } from "zod";

const createItemSchema = z.object({
  text: z.string().min(1, "Text is required").max(500),
});

const updateItemSchema = z.object({
  id: z.string().min(1),
  text: z.string().min(1).max(500).optional(),
  completed: z.boolean().optional(),
});

interface RouteContext {
  params: Promise<{ taskId: string; checklistId: string }>;
}

export async function POST(request: Request, context: RouteContext) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { checklistId } = await context.params;

    // Verify checklist exists
    const checklist = await prisma.checklist.findUnique({
      where: { id: checklistId },
    });

    if (!checklist) {
      return NextResponse.json(
        { error: "Checklist not found" },
        { status: 404 }
      );
    }

    const body = await request.json();
    const parsed = createItemSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const lastItem = await prisma.checklistItem.findFirst({
      where: { checklistId },
      orderBy: { order: "desc" },
    });

    const item = await prisma.checklistItem.create({
      data: {
        text: parsed.data.text,
        order: lastItem ? lastItem.order + 1 : 0,
        checklistId,
      },
    });

    return NextResponse.json(item, { status: 201 });
  } catch (error) {
    console.error("POST /api/tasks/[id]/checklists/[id]/items error:", error);
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

    const { checklistId } = await context.params;

    const body = await request.json();
    const parsed = updateItemSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { id, ...data } = parsed.data;

    // Verify item belongs to checklist
    const item = await prisma.checklistItem.findFirst({
      where: { id, checklistId },
    });

    if (!item) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 });
    }

    const updated = await prisma.checklistItem.update({
      where: { id },
      data,
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("PATCH /api/tasks/[id]/checklists/[id]/items error:", error);
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

    const { checklistId } = await context.params;
    const { searchParams } = new URL(request.url);
    const itemId = searchParams.get("itemId");

    if (!itemId) {
      return NextResponse.json(
        { error: "itemId query param is required" },
        { status: 400 }
      );
    }

    // Verify item belongs to checklist
    const item = await prisma.checklistItem.findFirst({
      where: { id: itemId, checklistId },
    });

    if (!item) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 });
    }

    await prisma.checklistItem.delete({ where: { id: itemId } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(
      "DELETE /api/tasks/[id]/checklists/[id]/items error:",
      error
    );
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
