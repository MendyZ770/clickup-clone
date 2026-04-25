import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth-helpers";
import { updateFolderSchema } from "@/lib/validations/folder";

interface RouteContext {
  params: Promise<{ folderId: string }>;
}

export async function GET(request: Request, context: RouteContext) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { folderId } = await context.params;

    const folder = await prisma.folder.findUnique({
      where: { id: folderId },
      include: {
        space: {
          include: {
            workspace: {
              include: { members: { where: { userId: user.id } } },
            },
          },
        },
        lists: {
          orderBy: { order: "asc" },
          include: { statuses: { orderBy: { order: "asc" } } },
        },
      },
    });

    if (!folder || folder.space.workspace.members.length === 0) {
      return NextResponse.json(
        { error: "Folder not found" },
        { status: 404 }
      );
    }

    const { space: _space, ...folderData } = folder;
    void _space;
    return NextResponse.json(folderData);
  } catch (error) {
    console.error("GET /api/folders/[id] error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { folderId } = await context.params;

    const folder = await prisma.folder.findUnique({
      where: { id: folderId },
      include: {
        space: {
          include: {
            workspace: {
              include: { members: { where: { userId: user.id } } },
            },
          },
        },
      },
    });

    if (!folder || folder.space.workspace.members.length === 0) {
      return NextResponse.json(
        { error: "Folder not found" },
        { status: 404 }
      );
    }

    const body = await request.json();
    const parsed = updateFolderSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const updated = await prisma.folder.update({
      where: { id: folderId },
      data: parsed.data,
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("PATCH /api/folders/[id] error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request, context: RouteContext) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { folderId } = await context.params;

    const folder = await prisma.folder.findUnique({
      where: { id: folderId },
      include: {
        space: {
          include: {
            workspace: {
              include: { members: { where: { userId: user.id } } },
            },
          },
        },
      },
    });

    if (!folder || folder.space.workspace.members.length === 0) {
      return NextResponse.json(
        { error: "Folder not found" },
        { status: 404 }
      );
    }

    await prisma.folder.delete({ where: { id: folderId } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/folders/[id] error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
