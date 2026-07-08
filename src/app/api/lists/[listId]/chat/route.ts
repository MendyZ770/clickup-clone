import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth-helpers";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ listId: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { listId } = await params;

    const list = await prisma.list.findUnique({
      where: { id: listId },
      include: { space: { include: { workspace: { include: { members: { where: { userId: user.id } } } } } } },
    });

    if (!list || list.space.workspace.members.length === 0) {
      return NextResponse.json({ error: "Not found or Forbidden" }, { status: 404 });
    }

    const messages = await prisma.chatMessage.findMany({
      where: { listId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
      },
      orderBy: { createdAt: "asc" },
    });

    return NextResponse.json(messages);
  } catch (error) {
    console.error("Failed to fetch chat messages:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ listId: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { listId } = await params;
    const body = await request.json();
    const { text } = body;

    if (!text || text.trim() === "") {
      return NextResponse.json(
        { error: "Message text is required" },
        { status: 400 }
      );
    }

    // Optional: verify list exists and user has access
    const list = await prisma.list.findUnique({
      where: { id: listId },
      include: { space: { include: { workspace: { include: { members: true } } } } },
    });

    if (!list) {
      return NextResponse.json({ error: "List not found" }, { status: 404 });
    }

    // Verify user is member of workspace
    const isMember = list.space.workspace.members.some(
      (member: any) => member.userId === user.id
    );

    if (!isMember) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const message = await prisma.chatMessage.create({
      data: {
        text,
        listId,
        userId: user.id,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
      },
    });

    try {
      const { pusherServer } = await import("@/lib/pusher-server");
      await pusherServer.trigger(
        `list-${listId}-chat`,
        "message:created",
        message
      );
    } catch (e) {
      console.error("Pusher error:", e);
    }

    return NextResponse.json(message);
  } catch (error) {
    console.error("Failed to send chat message:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
