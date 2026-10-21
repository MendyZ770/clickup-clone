import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth-helpers";
import { verifyTaskAccess, getTaskWorkspaceId } from "@/lib/task-auth";
import { sendNotificationToUsers } from "@/lib/notifications";
import { pusherServer } from "@/lib/pusher-server";
import { workspaceChannelName } from "@/lib/pusher-channels";

export async function GET(_req: Request, { params }: { params: Promise<{ taskId: string }> }) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { taskId } = await params;
    if (!(await verifyTaskAccess(taskId, user.id))) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    const assignees = await prisma.taskAssignee.findMany({
      where: { taskId },
      include: { user: { select: { id: true, name: true, email: true, image: true } } },
    });
    return NextResponse.json(assignees);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: Request, { params }: { params: Promise<{ taskId: string }> }) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { taskId } = await params;
    const workspaceId = await getTaskWorkspaceId(taskId, user.id);
    if (!workspaceId) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    const { userId } = await req.json();
    if (!userId) return NextResponse.json({ error: "userId required" }, { status: 400 });

    const targetMembership = await prisma.workspaceMember.findFirst({
      where: { workspaceId, userId },
      select: { id: true },
    });
    if (!targetMembership) {
      return NextResponse.json(
        { error: "Cet utilisateur n'appartient pas au workspace" },
        { status: 400 }
      );
    }

    const assignee = await prisma.taskAssignee.create({
      data: { taskId, userId },
      include: { user: { select: { id: true, name: true, email: true, image: true } } },
    });

    if (userId !== user.id) {
      const task = await prisma.task.findUnique({
        where: { id: taskId },
        select: { title: true },
      });
      await sendNotificationToUsers(
        [userId],
        {
          type: "taskAssigned",
          message: `Vous avez été assigné à « ${task?.title ?? "une tâche"} »`,
          link: `/task/${taskId}`,
          title: "👤 Nouvelle assignation",
          body: task?.title ?? "Nouvelle assignation",
          tag: "task-assigned",
        },
        user.id
      ).catch((error) => {
        console.error("Assignee notification failed:", error);
      });
    }

    try {
      await pusherServer.trigger(
        workspaceChannelName(workspaceId),
        "task:updated",
        { id: taskId }
      );
    } catch (e) {
      console.error("Pusher error:", e);
    }

    return NextResponse.json(assignee, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ taskId: string }> }) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { taskId } = await params;
    if (!(await verifyTaskAccess(taskId, user.id))) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");
    if (!userId) return NextResponse.json({ error: "userId required" }, { status: 400 });

    const result = await prisma.taskAssignee.deleteMany({ where: { taskId, userId } });
    if (result.count > 0) {
      const workspaceId = await getTaskWorkspaceId(taskId, user.id);
      if (workspaceId) {
        try {
          await pusherServer.trigger(
            workspaceChannelName(workspaceId),
            "task:updated",
            { id: taskId }
          );
        } catch (e) {
          console.error("Pusher error:", e);
        }
      }
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
