import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth-helpers";
import { verifyTaskAccess } from "@/lib/task-auth";

function isHttpUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
}

function isSafeUploadUrl(value: string): boolean {
  return /^\/uploads\/[A-Za-z0-9._-]+$/.test(value) && !value.includes("..");
}

export async function GET(_req: Request, { params }: { params: Promise<{ taskId: string }> }) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { taskId } = await params;
    if (!(await verifyTaskAccess(taskId, user.id))) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
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
    if (!(await verifyTaskAccess(taskId, user.id))) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    const { name, url, type, mimeType, size } = await req.json();
    if (!name || !url) return NextResponse.json({ error: "name and url required" }, { status: 400 });
    if (typeof url !== "string" || (!isHttpUrl(url) && !isSafeUploadUrl(url))) {
      return NextResponse.json({ error: "Invalid attachment URL" }, { status: 400 });
    }

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

export async function DELETE(req: Request, { params }: { params: Promise<{ taskId: string }> }) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { taskId } = await params;
    if (!(await verifyTaskAccess(taskId, user.id))) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const { searchParams } = new URL(req.url);
    // Support both 'attachmentId' (new) and 'id' (legacy)
    const attachmentId = searchParams.get("attachmentId") ?? searchParams.get("id");
    if (!attachmentId) return NextResponse.json({ error: "attachmentId required" }, { status: 400 });

    const attachment = await prisma.attachment.findFirst({ where: { id: attachmentId, taskId } });
    if (!attachment || attachment.userId !== user.id) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    // Delete local file if it's a safe upload path
    if (isSafeUploadUrl(attachment.url)) {
      try {
        const { unlink } = await import("fs/promises");
        const { resolve, sep } = await import("path");
        const uploadsRoot = resolve(process.cwd(), "public", "uploads");
        const fileName = attachment.url.replace(/^\/uploads\//, "");
        const filePath = resolve(uploadsRoot, fileName);
        if (filePath.startsWith(uploadsRoot + sep)) {
          await unlink(filePath);
        }
      } catch { /* file may not exist */ }
    }

    await prisma.attachment.delete({ where: { id: attachmentId } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

