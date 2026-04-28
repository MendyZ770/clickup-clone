import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth-helpers";

interface RouteContext {
  params: Promise<{ workspaceId: string }>;
}

export async function GET(_request: Request, context: RouteContext) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { workspaceId } = await context.params;

    const member = await prisma.workspaceMember.findFirst({
      where: { workspaceId, userId: user.id },
    });
    if (!member) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const lists = await prisma.list.findMany({
      where: {
        space: { workspaceId },
      },
      select: {
        id: true,
        name: true,
        space: {
          select: { id: true, name: true },
        },
      },
      orderBy: [
        { space: { name: "asc" } },
        { name: "asc" },
      ],
    });

    return NextResponse.json(lists);
  } catch (error) {
    console.error("GET /api/workspaces/[workspaceId]/lists error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
