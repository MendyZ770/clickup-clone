import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth-helpers";

export async function GET(_req: Request, { params }: { params: Promise<{ taskId: string }> }) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { taskId } = await params;
    const attachments = await prisma.attachment.findMany({
      where: { taskId },
      include: { user: { select: { id: true, name: true, image: true } } },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(attachments);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: Request, { params }: { params: Promise<{ taskId: string }> }) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { taskId } = await params;
    const { name, url, type, mimeType, size } = await req.json();
    if (!name || !url) return NextResponse.json({ error: "name and url required" }, { status: 400 });

    const attachment = await prisma.attachment.create({
      data: { name, url, type: type ?? "link", mimeType, size, taskId, userId: user.id },
      include: { user: { select: { id: true, name: true, image: true } } },
    });
    return NextResponse.json(attachment, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

    const attachment = await prisma.attachment.findUnique({ where: { id } });
    if (!attachment || attachment.userId !== user.id) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    await prisma.attachment.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
