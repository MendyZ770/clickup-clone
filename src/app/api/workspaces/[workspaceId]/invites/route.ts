import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth-helpers";

interface RouteContext {
  params: Promise<{ workspaceId: string }>;
}

async function assertAdminOrOwner(workspaceId: string, userId: string) {
  const member = await prisma.workspaceMember.findUnique({
    where: { workspaceId_userId: { workspaceId, userId } },
  });
  if (!member) return { ok: false as const, status: 403, error: "Non membre" };
  if (member.role !== "owner" && member.role !== "admin") {
    return { ok: false as const, status: 403, error: "Réservé aux admins" };
  }
  return { ok: true as const };
}

// GET: liste les invitations en attente
export async function GET(_req: Request, context: RouteContext) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { workspaceId } = await context.params;

    const check = await assertAdminOrOwner(workspaceId, user.id);
    if (!check.ok) return NextResponse.json({ error: check.error }, { status: check.status });

    const invites = await prisma.workspaceInvite.findMany({
      where: { workspaceId, acceptedAt: null },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(invites);
  } catch (error) {
    console.error("GET /api/workspaces/[id]/invites error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST: crée une invitation
export async function POST(request: Request, context: RouteContext) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { workspaceId } = await context.params;

    const check = await assertAdminOrOwner(workspaceId, user.id);
    if (!check.ok) return NextResponse.json({ error: check.error }, { status: check.status });

    const body = await request.json();
    const emailRaw = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    const role = body.role === "admin" ? "admin" : "member";

    if (!emailRaw || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailRaw)) {
      return NextResponse.json({ error: "Email invalide" }, { status: 400 });
    }

    // Déjà membre ?
    const existingUser = await prisma.user.findUnique({ where: { email: emailRaw } });
    if (existingUser) {
      const existingMember = await prisma.workspaceMember.findUnique({
        where: { workspaceId_userId: { workspaceId, userId: existingUser.id } },
      });
      if (existingMember) {
        return NextResponse.json(
          { error: "Cet utilisateur est déjà membre" },
          { status: 400 }
        );
      }
    }

    // Invitation déjà existante ?
    const existingInvite = await prisma.workspaceInvite.findUnique({
      where: { workspaceId_email: { workspaceId, email: emailRaw } },
    });
    if (existingInvite && !existingInvite.acceptedAt) {
      return NextResponse.json(
        { error: "Une invitation est déjà en attente pour cet email" },
        { status: 400 }
      );
    }

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 jours de validité

    const invite = existingInvite
      ? await prisma.workspaceInvite.update({
          where: { id: existingInvite.id },
          data: {
            role,
            invitedById: user.id,
            expiresAt,
            acceptedAt: null,
          },
        })
      : await prisma.workspaceInvite.create({
          data: {
            workspaceId,
            email: emailRaw,
            role,
            invitedById: user.id,
            expiresAt,
          },
        });

    const baseUrl = process.env.NEXTAUTH_URL ?? "http://localhost:3000";
    const inviteUrl = `${baseUrl}/invite/${invite.token}`;

    return NextResponse.json({ ...invite, inviteUrl }, { status: 201 });
  } catch (error) {
    console.error("POST /api/workspaces/[id]/invites error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
