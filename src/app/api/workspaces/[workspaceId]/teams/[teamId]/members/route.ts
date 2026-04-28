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

// POST : ajouter un membre à l'équipe
export async function POST(request: Request, context: RouteContext) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { workspaceId, teamId } = await context.params;
    if (!(await assertAdmin(workspaceId, user.id))) {
      return NextResponse.json({ error: "Réservé aux admins" }, { status: 403 });
    }

    const body = await request.json();
    const workspaceMemberId: string | undefined = body.workspaceMemberId;
    if (!workspaceMemberId) {
      return NextResponse.json({ error: "workspaceMemberId requis" }, { status: 400 });
    }

    // Vérifier que le membre appartient au workspace
    const wm = await prisma.workspaceMember.findFirst({
      where: { id: workspaceMemberId, workspaceId },
    });
    if (!wm) {
      return NextResponse.json(
        { error: "Ce membre n'appartient pas à cet espace" },
        { status: 400 }
      );
    }

    try {
      await prisma.teamMember.create({
        data: { teamId, workspaceMemberId },
      });
    } catch (err) {
      if ((err as { code?: string })?.code === "P2002") {
        return NextResponse.json(
          { error: "Ce membre est déjà dans l'équipe" },
          { status: 400 }
        );
      }
      throw err;
    }

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error) {
    console.error("POST team member error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// DELETE : retirer un membre
export async function DELETE(request: Request, context: RouteContext) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { workspaceId, teamId } = await context.params;
    if (!(await assertAdmin(workspaceId, user.id))) {
      return NextResponse.json({ error: "Réservé aux admins" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const workspaceMemberId = searchParams.get("workspaceMemberId");
    if (!workspaceMemberId) {
      return NextResponse.json({ error: "workspaceMemberId requis" }, { status: 400 });
    }

    await prisma.teamMember.deleteMany({
      where: { teamId, workspaceMemberId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE team member error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
