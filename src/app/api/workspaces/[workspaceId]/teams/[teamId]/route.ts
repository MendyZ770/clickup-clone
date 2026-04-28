import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth-helpers";

interface RouteContext {
  params: Promise<{ workspaceId: string; teamId: string }>;
}

async function assertAdmin(workspaceId: string, userId: string) {
  const member = await prisma.workspaceMember.findUnique({
    where: { workspaceId_userId: { workspaceId, userId } },
  });
  return member && (member.role === "owner" || member.role === "admin");
}

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { workspaceId, teamId } = await context.params;
    if (!(await assertAdmin(workspaceId, user.id))) {
      return NextResponse.json({ error: "Réservé aux admins" }, { status: 403 });
    }

    const body = await request.json();
    const data: Record<string, unknown> = {};
    if (typeof body.name === "string" && body.name.trim()) {
      data.name = body.name.trim().slice(0, 50);
    }
    if (body.description !== undefined) {
      data.description =
        typeof body.description === "string" && body.description.trim()
          ? body.description.trim()
          : null;
    }
    if (typeof body.color === "string" && /^#[0-9A-Fa-f]{6}$/.test(body.color)) {
      data.color = body.color;
    }

    const team = await prisma.team.update({
      where: { id: teamId, workspaceId },
      data,
    });
    return NextResponse.json(team);
  } catch (error) {
    console.error("PATCH team error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(_req: Request, context: RouteContext) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { workspaceId, teamId } = await context.params;
    if (!(await assertAdmin(workspaceId, user.id))) {
      return NextResponse.json({ error: "Réservé aux admins" }, { status: 403 });
    }

    await prisma.team.delete({ where: { id: teamId, workspaceId } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE team error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
