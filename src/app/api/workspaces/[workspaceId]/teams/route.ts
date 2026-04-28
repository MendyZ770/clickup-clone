import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth-helpers";

interface RouteContext {
  params: Promise<{ workspaceId: string }>;
}

async function assertMember(workspaceId: string, userId: string) {
  const member = await prisma.workspaceMember.findUnique({
    where: { workspaceId_userId: { workspaceId, userId } },
  });
  return member;
}

export async function GET(_req: Request, context: RouteContext) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { workspaceId } = await context.params;
    const member = await assertMember(workspaceId, user.id);
    if (!member) return NextResponse.json({ error: "Non membre" }, { status: 403 });

    const teams = await prisma.team.findMany({
      where: { workspaceId },
      include: {
        members: {
          include: {
            workspaceMember: {
              include: {
                user: { select: { id: true, name: true, email: true, image: true } },
              },
            },
          },
        },
        _count: { select: { members: true } },
      },
      orderBy: { createdAt: "asc" },
    });

    return NextResponse.json(teams);
  } catch (error) {
    console.error("GET teams error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: Request, context: RouteContext) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { workspaceId } = await context.params;
    const member = await assertMember(workspaceId, user.id);
    if (!member || (member.role !== "owner" && member.role !== "admin")) {
      return NextResponse.json({ error: "Réservé aux admins" }, { status: 403 });
    }

    const body = await request.json();
    const name = typeof body.name === "string" ? body.name.trim() : "";
    const description =
      typeof body.description === "string" && body.description.trim()
        ? body.description.trim()
        : null;
    const color =
      typeof body.color === "string" && /^#[0-9A-Fa-f]{6}$/.test(body.color)
        ? body.color
        : "#3B82F6";

    if (!name) {
      return NextResponse.json({ error: "Le nom est requis" }, { status: 400 });
    }
    if (name.length > 50) {
      return NextResponse.json(
        { error: "Nom trop long (50 caractères max)" },
        { status: 400 }
      );
    }

    try {
      const team = await prisma.team.create({
        data: { name, description, color, workspaceId },
        include: { _count: { select: { members: true } } },
      });
      return NextResponse.json(team, { status: 201 });
    } catch (err) {
      if ((err as { code?: string })?.code === "P2002") {
        return NextResponse.json(
          { error: "Une équipe avec ce nom existe déjà" },
          { status: 400 }
        );
      }
      throw err;
    }
  } catch (error) {
    console.error("POST teams error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
