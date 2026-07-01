import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth-helpers";

export async function GET(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const listId = searchParams.get("listId");
    
    if (!listId) {
      return NextResponse.json({ error: "listId required" }, { status: 400 });
    }

    const automations = await prisma.automation.findMany({
      where: { listId },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(automations);
  } catch (error) {
    console.error("GET /api/automations error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const json = await request.json();
    const { listId, name, triggerType, triggerCondition, actionType, actionPayload } = json;

    if (!listId || !name || !triggerType || !actionType) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Verify user has access to this list
    const list = await prisma.list.findUnique({
      where: { id: listId },
      include: { space: { include: { workspace: { include: { members: true } } } } }
    });

    if (!list) {
      return NextResponse.json({ error: "List not found" }, { status: 404 });
    }

    const isMember = list.space.workspace.members.some(m => m.userId === user.id);
    if (!isMember) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const automation = await prisma.automation.create({
      data: {
        name,
        listId,
        creatorId: user.id,
        triggerType,
        triggerCondition,
        actionType,
        actionPayload,
        isActive: true,
      },
    });

    return NextResponse.json(automation, { status: 201 });
  } catch (error) {
    console.error("POST /api/automations error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
