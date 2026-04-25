import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth-helpers";
import { logActivity } from "@/lib/activity-logger";
import { z } from "zod";

const addTagSchema = z.object({
  tagId: z.string().min(1, "Tag ID is required"),
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

    const taskTags = await prisma.taskTag.findMany({
      where: { taskId },
      include: { tag: true },
    });

    return NextResponse.json(taskTags.map((tt) => tt.tag));
  } catch (error) {
    console.error("GET /api/tasks/[id]/tags error:", error);
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

    const body = await request.json();
    const parsed = addTagSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { tagId } = parsed.data;

    // Check tag exists
    const tag = await prisma.tag.findUnique({ where: { id: tagId } });
    if (!tag) {
      return NextResponse.json({ error: "Tag not found" }, { status: 404 });
    }

    // Check if already attached
    const existing = await prisma.taskTag.findUnique({
      where: { taskId_tagId: { taskId, tagId } },
    });
    if (existing) {
      return NextResponse.json(
        { error: "Tag already attached to task" },
        { status: 409 }
      );
    }

    const taskTag = await prisma.taskTag.create({
      data: { taskId, tagId },
      include: { tag: true },
    });

    await logActivity({
      action: "updated",
      taskId,
      userId: user.id,
      field: "tags",
      oldValue: "",
      newValue: `Added tag "${tag.name}"`,
    });

    return NextResponse.json(taskTag, { status: 201 });
  } catch (error) {
    console.error("POST /api/tasks/[id]/tags error:", error);
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

    const { taskId } = await context.params;
    const { searchParams } = new URL(request.url);
    const tagId = searchParams.get("tagId");

    if (!tagId) {
      return NextResponse.json(
        { error: "tagId query param is required" },
        { status: 400 }
      );
    }

    const taskTag = await prisma.taskTag.findUnique({
      where: { taskId_tagId: { taskId, tagId } },
      include: { tag: true },
    });

    if (!taskTag) {
      return NextResponse.json(
        { error: "Tag not attached to this task" },
        { status: 404 }
      );
    }

    await prisma.taskTag.delete({
      where: { taskId_tagId: { taskId, tagId } },
    });

    await logActivity({
      action: "updated",
      taskId,
      userId: user.id,
      field: "tags",
      oldValue: `Removed tag "${taskTag.tag.name}"`,
      newValue: "",
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/tasks/[id]/tags error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
