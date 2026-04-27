import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth-helpers";

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

    // Verify task exists and user has access
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: {
        list: {
          include: {
            space: {
              include: {
                workspace: {
                  include: { members: { where: { userId: user.id } } },
                },
              },
            },
          },
        },
      },
    });

    if (!task || task.list.space.workspace.members.length === 0) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    const values = await prisma.customFieldValue.findMany({
      where: { taskId },
      include: { field: true },
      orderBy: { field: { order: "asc" } },
    });

    return NextResponse.json(values);
  } catch (error) {
    console.error("GET /api/tasks/[taskId]/custom-fields error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request, context: RouteContext) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { taskId } = await context.params;
    const body = await request.json();
    const { fieldId, value } = body;

    if (!fieldId) {
      return NextResponse.json(
        { error: "fieldId is required" },
        { status: 400 }
      );
    }

    // Verify task exists and user has access
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: {
        list: {
          include: {
            space: {
              include: {
                workspace: {
                  include: { members: { where: { userId: user.id } } },
                },
              },
            },
          },
        },
      },
    });

    if (!task || task.list.space.workspace.members.length === 0) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    // Verify field exists and belongs to the same workspace
    const field = await prisma.customField.findUnique({
      where: { id: fieldId },
    });

    if (!field || field.workspaceId !== task.list.space.workspace.id) {
      return NextResponse.json({ error: "Field not found" }, { status: 404 });
    }

    // If value is empty/null, remove the field value
    if (value === null || value === undefined || value === "") {
      await prisma.customFieldValue.deleteMany({
        where: { fieldId, taskId },
      });
      return NextResponse.json({ success: true, deleted: true });
    }

    // Upsert the field value
    const fieldValue = await prisma.customFieldValue.upsert({
      where: {
        fieldId_taskId: { fieldId, taskId },
      },
      create: {
        fieldId,
        taskId,
        value: String(value),
      },
      update: {
        value: String(value),
      },
      include: { field: true },
    });

    return NextResponse.json(fieldValue);
  } catch (error) {
    console.error("PUT /api/tasks/[taskId]/custom-fields error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
