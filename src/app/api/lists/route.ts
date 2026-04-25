import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth-helpers";
import { createListSchema } from "@/lib/validations/list";
import { DEFAULT_STATUSES } from "@/lib/constants";

export async function GET(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const spaceId = searchParams.get("spaceId");
    const folderId = searchParams.get("folderId");

    if (!spaceId && !folderId) {
      return NextResponse.json(
        { error: "spaceId or folderId query param is required" },
        { status: 400 }
      );
    }

    // Build where clause
    const where: Record<string, unknown> = {};
    if (folderId) {
      where.folderId = folderId;
    } else if (spaceId) {
      where.spaceId = spaceId;
      where.folderId = null;
    }

    const lists = await prisma.list.findMany({
      where,
      include: {
        statuses: { orderBy: { order: "asc" } },
        _count: { select: { tasks: true } },
      },
      orderBy: { order: "asc" },
    });

    return NextResponse.json(lists);
  } catch (error) {
    console.error("GET /api/lists error:", error);
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
    const parsed = createListSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { name, color, spaceId, folderId } = parsed.data;

    // Verify access through space
    const space = await prisma.space.findUnique({
      where: { id: spaceId },
      include: {
        workspace: {
          include: { members: { where: { userId: user.id } } },
        },
      },
    });

    if (!space || space.workspace.members.length === 0) {
      return NextResponse.json({ error: "Space not found" }, { status: 404 });
    }

    // If folderId is specified, verify it belongs to this space
    if (folderId) {
      const folder = await prisma.folder.findFirst({
        where: { id: folderId, spaceId },
      });
      if (!folder) {
        return NextResponse.json(
          { error: "Folder not found in this space" },
          { status: 404 }
        );
      }
    }

    const lastList = await prisma.list.findFirst({
      where: { spaceId, folderId: folderId ?? null },
      orderBy: { order: "desc" },
    });

    const list = await prisma.list.create({
      data: {
        name,
        color: color ?? null,
        order: lastList ? lastList.order + 1 : 0,
        spaceId,
        folderId: folderId ?? null,
        statuses: {
          create: DEFAULT_STATUSES.map((s) => ({
            name: s.name,
            color: s.color,
            type: s.type,
            order: s.order,
          })),
        },
      },
      include: {
        statuses: { orderBy: { order: "asc" } },
      },
    });

    return NextResponse.json(list, { status: 201 });
  } catch (error) {
    console.error("POST /api/lists error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
