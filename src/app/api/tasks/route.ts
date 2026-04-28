import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth-helpers";
import { createTaskSchema } from "@/lib/validations/task";
import { logActivity } from "@/lib/activity-logger";
import { Prisma } from "@prisma/client";

export async function GET(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const listId = searchParams.get("listId");
    const statusId = searchParams.get("statusId");
    const priority = searchParams.get("priority");
    const assigneeId = searchParams.get("assigneeId");
    const search = searchParams.get("search");
    const sortBy = searchParams.get("sortBy") ?? "position";
    const sortOrder = searchParams.get("sortOrder") ?? "asc";

    if (!listId) {
      return NextResponse.json(
        { error: "listId query param is required" },
        { status: 400 }
      );
    }

    // Build where clause
    const where: Prisma.TaskWhereInput = {
      listId,
      parentId: null, // Only top-level tasks
    };

    if (statusId) where.statusId = statusId;
    if (priority) where.priority = priority;
    if (assigneeId) where.assigneeId = assigneeId;
    if (search) {
      where.OR = [
        { title: { contains: search } },
        { description: { contains: search } },
      ];
    }

    // Build orderBy
    const validSortFields = [
      "position",
      "title",
      "priority",
      "dueDate",
      "createdAt",
      "updatedAt",
    ];
    const orderField = validSortFields.includes(sortBy) ? sortBy : "position";
    const orderDir = sortOrder === "desc" ? "desc" : "asc";

    const tasks = await prisma.task.findMany({
      where,
      include: {
        status: true,
        assignee: {
          select: { id: true, name: true, email: true, image: true },
        },
        creator: {
          select: { id: true, name: true, email: true, image: true },
        },
        taskTags: {
          include: { tag: true },
        },
        _count: {
          select: { subtasks: true, comments: true },
        },
      },
      orderBy: { [orderField]: orderDir },
    });

    return NextResponse.json(tasks);
  } catch (error) {
    console.error("GET /api/tasks error:", error);
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
    const parsed = createTaskSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const {
      title,
      description,
      priority,
      dueDate,
      startDate,
      timeEstimate,
      listId,
      statusId,
      assigneeId,
      parentId,
      position,
    } = parsed.data;

    // Verify list exists and user has access
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
      },
    });

    if (!list || list.space.workspace.members.length === 0) {
      return NextResponse.json({ error: "List not found" }, { status: 404 });
    }

    // Determine status: use provided or first status of the list
    let taskStatusId = statusId;
    if (!taskStatusId) {
      if (list.statuses.length === 0) {
        return NextResponse.json(
          { error: "List has no statuses configured" },
          { status: 400 }
        );
      }
      taskStatusId = list.statuses[0].id;
    }

    // Calculate position if not provided
    let taskPosition = position;
    if (taskPosition === undefined) {
      const lastTask = await prisma.task.findFirst({
        where: { listId, statusId: taskStatusId },
        orderBy: { position: "desc" },
      });
      taskPosition = lastTask ? lastTask.position + 65536 : 65536;
    }

    const task = await prisma.task.create({
      data: {
        title,
        description: description ?? null,
        priority: priority ?? "normal",
        dueDate: dueDate ? new Date(dueDate) : null,
        startDate: startDate ? new Date(startDate) : null,
        timeEstimate: timeEstimate ?? null,
        position: taskPosition,
        listId,
        statusId: taskStatusId,
        assigneeId: assigneeId ?? null,
        creatorId: user.id,
        parentId: parentId ?? null,
      },
      include: {
        status: true,
        assignee: {
          select: { id: true, name: true, email: true, image: true },
        },
        creator: {
          select: { id: true, name: true, email: true, image: true },
        },
        taskTags: {
          include: { tag: true },
        },
        _count: {
          select: { subtasks: true, comments: true },
        },
      },
    });

    // Log activity
    await logActivity({
      action: "created",
      taskId: task.id,
      userId: user.id,
    });

    return NextResponse.json(task, { status: 201 });
  } catch (error) {
    console.error("POST /api/tasks error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
