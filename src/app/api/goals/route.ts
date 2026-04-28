import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth-helpers";

export async function GET(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { searchParams } = new URL(req.url);
    const workspaceId = searchParams.get("workspaceId");
    if (!workspaceId) return NextResponse.json({ error: "workspaceId required" }, { status: 400 });

    const goals = await prisma.goal.findMany({
      where: { workspaceId },
      include: {
        creator: { select: { id: true, name: true, image: true } },
        targets: true,
      },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(goals);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { name, description, color, dueDate, workspaceId } = await req.json();
    if (!name || !workspaceId) return NextResponse.json({ error: "name and workspaceId required" }, { status: 400 });

    const goal = await prisma.goal.create({
      data: {
        name,
        description,
        color: color ?? "#7C3AED",
        dueDate: dueDate ? new Date(dueDate) : null,
        workspaceId,
        creatorId: user.id,
      },
      include: { creator: { select: { id: true, name: true, image: true } }, targets: true },
    });
    return NextResponse.json(goal, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
