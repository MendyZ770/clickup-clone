import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth-helpers";

interface RouteContext {
  params: Promise<{ noteId: string }>;
}

async function assertOwner(noteId: string, userId: string) {
  const note = await prisma.note.findUnique({ where: { id: noteId } });
  if (!note || note.userId !== userId) return null;
  return note;
}

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { noteId } = await context.params;
    const note = await assertOwner(noteId, user.id);
    if (!note) return NextResponse.json({ error: "Note introuvable" }, { status: 404 });

    const body = await request.json();
    const data: Record<string, unknown> = {};

    if (typeof body.title === "string") data.title = body.title.slice(0, 200);
    if (typeof body.content === "string") data.content = body.content;
    if (typeof body.pinned === "boolean") data.pinned = body.pinned;
    if (typeof body.color === "string" && /^#[0-9A-Fa-f]{6}$/.test(body.color)) {
      data.color = body.color;
    }

    const updated = await prisma.note.update({ where: { id: noteId }, data });
    return NextResponse.json(updated);
  } catch (error) {
    console.error("PATCH /api/notes/[id] error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(_req: Request, context: RouteContext) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { noteId } = await context.params;
    const note = await assertOwner(noteId, user.id);
    if (!note) return NextResponse.json({ error: "Note introuvable" }, { status: 404 });

    await prisma.note.delete({ where: { id: noteId } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/notes/[id] error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
