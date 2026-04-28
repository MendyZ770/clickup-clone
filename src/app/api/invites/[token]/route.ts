import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth-helpers";

interface RouteContext {
  params: Promise<{ token: string }>;
}

// GET : info sur l'invitation (sans être membre)
export async function GET(_req: Request, context: RouteContext) {
  try {
    const { token } = await context.params;

    const invite = await prisma.workspaceInvite.findUnique({
      where: { token },
      include: {
        workspace: { select: { id: true, name: true, color: true } },
      },
    });

    if (!invite) {
      return NextResponse.json({ error: "Invitation introuvable" }, { status: 404 });
    }
    if (invite.acceptedAt) {
      return NextResponse.json({ error: "Invitation déjà acceptée" }, { status: 400 });
    }
    if (invite.expiresAt < new Date()) {
      return NextResponse.json({ error: "Invitation expirée" }, { status: 400 });
    }

    return NextResponse.json({
      workspace: invite.workspace,
      email: invite.email,
      role: invite.role,
      expiresAt: invite.expiresAt,
    });
  } catch (error) {
    console.error("GET invite error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST : accepter l'invitation
export async function POST(_req: Request, context: RouteContext) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Vous devez être connecté" }, { status: 401 });
    }

    const { token } = await context.params;

    const invite = await prisma.workspaceInvite.findUnique({ where: { token } });
    if (!invite) {
      return NextResponse.json({ error: "Invitation introuvable" }, { status: 404 });
    }
    if (invite.acceptedAt) {
      return NextResponse.json({ error: "Invitation déjà acceptée" }, { status: 400 });
    }
    if (invite.expiresAt < new Date()) {
      return NextResponse.json({ error: "Invitation expirée" }, { status: 400 });
    }

    // Vérifier que l'email du compte correspond
    if (user.email.toLowerCase() !== invite.email.toLowerCase()) {
      return NextResponse.json(
        {
          error: `Cette invitation est pour ${invite.email}. Reconnectez-vous avec ce compte.`,
        },
        { status: 403 }
      );
    }

    // Déjà membre ?
    const existingMember = await prisma.workspaceMember.findUnique({
      where: { workspaceId_userId: { workspaceId: invite.workspaceId, userId: user.id } },
    });
    if (existingMember) {
      await prisma.workspaceInvite.update({
        where: { id: invite.id },
        data: { acceptedAt: new Date() },
      });
      return NextResponse.json({ workspaceId: invite.workspaceId });
    }

    // Créer le membre + marquer l'invitation comme acceptée (transaction)
    await prisma.$transaction([
      prisma.workspaceMember.create({
        data: {
          workspaceId: invite.workspaceId,
          userId: user.id,
          role: invite.role,
        },
      }),
      prisma.workspaceInvite.update({
        where: { id: invite.id },
        data: { acceptedAt: new Date() },
      }),
    ]);

    return NextResponse.json({ workspaceId: invite.workspaceId });
  } catch (error) {
    console.error("POST invite error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
