import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth-helpers";
import { logActivity } from "@/lib/activity-logger";

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

    const taskInclude = {
      select: {
        id: true,
        title: true,
        priority: true,
        status: true,
      },
    };

    // Get dependencies where this task is the dependent (this task depends on others)
    const dependencies = await prisma.taskDependency.findMany({
      where: { dependentTaskId: taskId },
      include: {
        dependentTask: taskInclude,
        dependencyTask: taskInclude,
      },
      orderBy: { createdAt: "desc" },
    });

    // Get dependents where other tasks depend on this task
    const dependents = await prisma.taskDependency.findMany({
      where: { dependencyTaskId: taskId },
      include: {
        dependentTask: taskInclude,
        dependencyTask: taskInclude,
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ dependencies, dependents });
  } catch (error) {
    console.error("GET /api/tasks/[taskId]/dependencies error:", error);
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
    const { targetTaskId, type } = body;

    if (!targetTaskId || !type) {
      return NextResponse.json(
        { error: "targetTaskId and type are required" },
        { status: 400 }
      );
    }

    const validTypes = ["blocking", "waiting_on", "linked_to"];
    if (!validTypes.includes(type)) {
      return NextResponse.json(
        { error: `Invalid type. Must be one of: ${validTypes.join(", ")}` },
        { status: 400 }
      );
    }

    if (taskId === targetTaskId) {
      return NextResponse.json(
        { error: "A task cannot depend on itself" },
        { status: 400 }
      );
    }

    // Verify both tasks exist and user has access
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

    const targetTask = await prisma.task.findUnique({
      where: { id: targetTaskId },
      select: { id: true, title: true },
    });

    if (!targetTask) {
      return NextResponse.json(
        { error: "Target task not found" },
        { status: 404 }
      );
    }

    // Determine the direction based on the type
    let dependentTaskId: string;
    let dependencyTaskId: string;

    if (type === "blocking") {
      // This task is blocking the target task
      dependentTaskId = targetTaskId;
      dependencyTaskId = taskId;
    } else if (type === "waiting_on") {
      // This task is waiting on the target task
      dependentTaskId = taskId;
      dependencyTaskId = targetTaskId;
    } else {
      // linked_to: direction doesn't matter semantically, but we store it consistently
      dependentTaskId = taskId;
      dependencyTaskId = targetTaskId;
    }

    // Check for existing dependency
    const existing = await prisma.taskDependency.findUnique({
      where: {
        dependentTaskId_dependencyTaskId: {
          dependentTaskId,
          dependencyTaskId,
        },
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: "Dependency already exists" },
        { status: 409 }
      );
    }

    const dependency = await prisma.taskDependency.create({
      data: {
        type,
        dependentTaskId,
        dependencyTaskId,
      },
      include: {
        dependentTask: {
          select: { id: true, title: true, priority: true, status: true },
        },
        dependencyTask: {
          select: { id: true, title: true, priority: true, status: true },
        },
      },
    });

    // Log activity
    await logActivity({
      action: "added_dependency",
      taskId,
      userId: user.id,
      field: "dependency",
      oldValue: "",
      newValue: `${type}: ${targetTask.title}`,
    });

    return NextResponse.json(dependency, { status: 201 });
  } catch (error) {
    console.error("POST /api/tasks/[taskId]/dependencies error:", error);
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
    const dependencyId = searchParams.get("dependencyId");

    if (!dependencyId) {
      return NextResponse.json(
        { error: "dependencyId query param is required" },
        { status: 400 }
      );
    }

    // Verify the dependency exists and involves this task
    const dependency = await prisma.taskDependency.findUnique({
      where: { id: dependencyId },
      include: {
        dependencyTask: { select: { title: true } },
        dependentTask: { select: { title: true } },
      },
    });

    if (
      !dependency ||
      (dependency.dependentTaskId !== taskId &&
        dependency.dependencyTaskId !== taskId)
    ) {
      return NextResponse.json(
        { error: "Dependency not found" },
        { status: 404 }
      );
    }

    await prisma.taskDependency.delete({ where: { id: dependencyId } });

    // Log activity
    await logActivity({
      action: "removed_dependency",
      taskId,
      userId: user.id,
      field: "dependency",
      oldValue: `${dependency.type}: ${
        dependency.dependentTaskId === taskId
          ? dependency.dependencyTask.title
          : dependency.dependentTask.title
      }`,
      newValue: "",
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/tasks/[taskId]/dependencies error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
