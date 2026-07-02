import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth-helpers";
import { createCommentSchema } from "@/lib/validations/comment";
import { logActivity } from "@/lib/activity-logger";
import { verifyTaskAccess } from "@/lib/task-auth";

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

    if (!(await verifyTaskAccess(taskId, user.id))) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const comments = await prisma.comment.findMany({
      where: { taskId },
      include: {
        user: {
          select: { id: true, name: true, email: true, image: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(comments);
  } catch (error) {
    console.error("GET /api/tasks/[id]/comments error:", error);
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

    if (!(await verifyTaskAccess(taskId, user.id))) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const task = await prisma.task.findUnique({
      where: { id: taskId },
      select: { title: true }
    });

    if (!task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    const body = await request.json();
    const parsed = createCommentSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { content, mentionedUserIds = [] } = parsed.data;

    const comment = await prisma.comment.create({
      data: {
        content,
        taskId,
        userId: user.id,
      },
      include: {
        user: {
          select: { id: true, name: true, email: true, image: true },
        },
      },
    });

    // Log activity
    await logActivity({
      action: "commented",
      taskId,
      userId: user.id,
    });

    // Notify task assignee + multi-assignees if different from commenter
    const notifyIds = new Set<string>();
    // Also notify multi-assignees
    const assignees = await prisma.taskAssignee.findMany({ where: { taskId }, select: { userId: true } });
    for (const a of assignees) {
      if (a.userId !== user.id) notifyIds.add(a.userId);
    }
    if (notifyIds.size > 0) {
      const { sendNotificationToUsers } = await import("@/lib/notifications");
      await sendNotificationToUsers(
        Array.from(notifyIds),
        {
          type: "taskComment",
          message: `${user.name ?? "Quelqu'un"} a commenté "${task.title}"`,
          link: `/task/${taskId}`,
          title: "Nouveau commentaire",
          body: `${user.name ?? "Quelqu'un"} : ${comment.content.slice(0, 80)}`,
          tag: "task-comment",
        },
        user.id
      );
    }

    // Notifier les mentions @
    if (mentionedUserIds.length > 0) {
      const { sendNotificationToUsers } = await import("@/lib/notifications");
      const uniqueMentioned = [...new Set(mentionedUserIds)].filter(id => id !== user.id);
      if (uniqueMentioned.length > 0) {
        await sendNotificationToUsers(
          uniqueMentioned,
          {
            type: "mention",
            message: `${user.name ?? "Quelqu'un"} vous a mentionné dans "${task.title}"`,
            link: `/task/${taskId}`,
            title: "Vous avez été mentionné",
            body: `${user.name ?? "Quelqu'un"} : ${comment.content.slice(0, 80)}`,
            tag: "mention",
          },
          user.id
        );
      }
    }

    return NextResponse.json(comment, { status: 201 });
  } catch (error) {
    console.error("POST /api/tasks/[id]/comments error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
