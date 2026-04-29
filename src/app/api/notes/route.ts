import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth-helpers";

export async function GET(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const workspaceId = searchParams.get("workspaceId");
    if (!workspaceId) return NextResponse.json({ error: "workspaceId requis" }, { status: 400 });

    const notes = await prisma.note.findMany({
      where: { userId: user.id, workspaceId },
      orderBy: [{ pinned: "desc" }, { updatedAt: "desc" }],
    });

    return NextResponse.json(notes);
  } catch (error) {
    console.error("GET /api/notes error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const workspaceId = typeof body.workspaceId === "string" ? body.workspaceId : null;
    if (!workspaceId) return NextResponse.json({ error: "workspaceId requis" }, { status: 400 });

    // Vérifier que l'utilisateur est membre du workspace
    const member = await prisma.workspaceMember.findUnique({
      where: { workspaceId_userId: { workspaceId, userId: user.id } },
    });
    if (!member) return NextResponse.json({ error: "Non membre" }, { status: 403 });

    const note = await prisma.note.create({
      data: {
        title: typeof body.title === "string" ? body.title.slice(0, 200) : "Sans titre",
        content: typeof body.content === "string" ? body.content : "",
        color: typeof body.color === "string" && /^#[0-9A-Fa-f]{6}$/.test(body.color) ? body.color : "#ffffff",
        userId: user.id,
        workspaceId,
      },
    });

    return NextResponse.json(note, { status: 201 });
  } catch (error) {
    console.error("POST /api/notes error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
