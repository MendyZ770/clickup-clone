import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth-helpers";

interface RouteContext {
  params: Promise<{ workspaceId: string; inviteId: string }>;
}

export async function DELETE(_req: Request, context: RouteContext) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { workspaceId, inviteId } = await context.params;

    const member = await prisma.workspaceMember.findUnique({
      where: { workspaceId_userId: { workspaceId, userId: user.id } },
    });
    if (!member || (member.role !== "owner" && member.role !== "admin")) {
      return NextResponse.json({ error: "Réservé aux admins" }, { status: 403 });
    }

    await prisma.workspaceInvite.deleteMany({
      where: { id: inviteId, workspaceId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE invite error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
