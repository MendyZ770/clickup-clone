import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth-helpers";

export async function GET(_req: Request, { params }: { params: Promise<{ goalId: string }> }) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { goalId } = await params;
    const goal = await prisma.goal.findUnique({
      where: { id: goalId },
      include: {
        creator: { select: { id: true, name: true, image: true } },
        targets: { orderBy: { createdAt: "asc" } },
      },
    });
    if (!goal) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(goal);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(req: Request, { params }: { params: Promise<{ goalId: string }> }) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { goalId } = await params;
    const body = await req.json();
    const goal = await prisma.goal.update({
      where: { id: goalId },
      data: {
        ...(body.name !== undefined && { name: body.name }),
        ...(body.description !== undefined && { description: body.description }),
        ...(body.color !== undefined && { color: body.color }),
        ...(body.dueDate !== undefined && { dueDate: body.dueDate ? new Date(body.dueDate) : null }),
      },
      include: { targets: true },
    });
    return NextResponse.json(goal);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ goalId: string }> }) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { goalId } = await params;
    await prisma.goal.delete({ where: { id: goalId } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
