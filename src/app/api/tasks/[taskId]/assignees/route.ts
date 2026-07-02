import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth-helpers";
import { verifyTaskAccess } from "@/lib/task-auth";

export async function GET(_req: Request, { params }: { params: Promise<{ taskId: string }> }) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { taskId } = await params;
    if (!(await verifyTaskAccess(taskId, user.id))) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
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
    if (!(await verifyTaskAccess(taskId, user.id))) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    if (!(await verifyTaskAccess(taskId, user.id))) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    const { userId } = await req.json();
    if (!userId) return NextResponse.json({ error: "userId required" }, { status: 400 });

    const assignee = await prisma.taskAssignee.create({
      data: { taskId, userId },
      include: { user: { select: { id: true, name: true, email: true, image: true } } },
    });
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
    if (!(await verifyTaskAccess(taskId, user.id))) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");
    if (!userId) return NextResponse.json({ error: "userId required" }, { status: 400 });

    await prisma.taskAssignee.deleteMany({ where: { taskId, userId } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
