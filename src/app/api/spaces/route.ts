import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth-helpers";
import { createSpaceSchema } from "@/lib/validations/space";

export async function GET(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const workspaceId = searchParams.get("workspaceId");

    if (!workspaceId) {
      return NextResponse.json(
        { error: "workspaceId query param is required" },
        { status: 400 }
      );
    }

    // Verify membership
    const membership = await prisma.workspaceMember.findUnique({
      where: {
        workspaceId_userId: { workspaceId, userId: user.id },
      },
    });

    if (!membership) {
      return NextResponse.json(
        { error: "Workspace not found" },
        { status: 404 }
      );
    }

    const spaces = await prisma.space.findMany({
      where: { workspaceId },
      include: {
        folders: {
          orderBy: { order: "asc" },
          include: {
            lists: {
              orderBy: { order: "asc" },
              include: { statuses: { orderBy: { order: "asc" } } },
            },
          },
        },
        lists: {
          where: { folderId: null },
          orderBy: { order: "asc" },
          include: { statuses: { orderBy: { order: "asc" } } },
        },
      },
      orderBy: { order: "asc" },
    });

    return NextResponse.json(spaces);
  } catch (error) {
    console.error("GET /api/spaces error:", error);
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
    const parsed = createSpaceSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { name, description, color, icon, workspaceId } = parsed.data;

    // Verify membership
    const membership = await prisma.workspaceMember.findUnique({
      where: {
        workspaceId_userId: { workspaceId, userId: user.id },
      },
    });

    if (!membership) {
      return NextResponse.json(
        { error: "Workspace not found" },
        { status: 404 }
      );
    }

    // Get next order
    const lastSpace = await prisma.space.findFirst({
      where: { workspaceId },
      orderBy: { order: "desc" },
    });

    const space = await prisma.space.create({
      data: {
        name,
        description: description ?? null,
        color: color ?? "#3B82F6",
        icon: icon ?? "folder",
        order: lastSpace ? lastSpace.order + 1 : 0,
        workspaceId,
      },
    });

    return NextResponse.json(space, { status: 201 });
  } catch (error) {
    console.error("POST /api/spaces error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
