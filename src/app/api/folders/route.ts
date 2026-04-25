import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth-helpers";
import { createFolderSchema } from "@/lib/validations/folder";

export async function GET(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const spaceId = searchParams.get("spaceId");

    if (!spaceId) {
      return NextResponse.json(
        { error: "spaceId query param is required" },
        { status: 400 }
      );
    }

    // Verify access
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

    const folders = await prisma.folder.findMany({
      where: { spaceId },
      include: {
        lists: {
          orderBy: { order: "asc" },
          include: { statuses: { orderBy: { order: "asc" } } },
        },
      },
      orderBy: { order: "asc" },
    });

    return NextResponse.json(folders);
  } catch (error) {
    console.error("GET /api/folders error:", error);
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
    const parsed = createFolderSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { name, color, spaceId } = parsed.data;

    // Verify access
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

    const lastFolder = await prisma.folder.findFirst({
      where: { spaceId },
      orderBy: { order: "desc" },
    });

    const folder = await prisma.folder.create({
      data: {
        name,
        color: color ?? null,
        order: lastFolder ? lastFolder.order + 1 : 0,
        spaceId,
      },
      include: {
        lists: {
          orderBy: { order: "asc" },
          include: { statuses: { orderBy: { order: "asc" } } },
        },
      },
    });

    return NextResponse.json(folder, { status: 201 });
  } catch (error) {
    console.error("POST /api/folders error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
