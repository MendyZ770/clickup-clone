import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir, unlink } from "fs/promises";
import { existsSync } from "fs";
import path from "path";
import { requireAuth } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";

const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

export async function POST(req: NextRequest) {
  const user = await requireAuth();

  try {
    const formData = await req.formData();
    const file = formData.get("avatar") as File | null;

    if (!file) {
      return NextResponse.json({ error: "Aucun fichier fourni" }, { status: 400 });
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: "Type de fichier non autorisé. Utilisez JPG, PNG, WebP ou GIF." },
        { status: 400 }
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "Fichier trop volumineux. Maximum 2MB." },
        { status: 400 }
      );
    }

    // Ensure uploads directory exists
    const uploadDir = path.join(process.cwd(), "public", "uploads", "avatars");
    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true });
    }

    // Generate unique filename
    const ext = file.type.split("/")[1];
    const fileName = `${user.id}-${Date.now()}.${ext}`;
    const filePath = path.join(uploadDir, fileName);

    // Write file
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filePath, buffer);

    // Delete old avatar if exists
    const currentUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { image: true },
    });

    if (currentUser?.image && currentUser.image.startsWith("/uploads/avatars/")) {
      const oldPath = path.join(process.cwd(), "public", currentUser.image);
      try {
        if (existsSync(oldPath)) {
          await unlink(oldPath);
        }
      } catch {
        // Ignore cleanup errors
      }
    }

    // Update user image
    const imageUrl = `/uploads/avatars/${fileName}`;
    await prisma.user.update({
      where: { id: user.id },
      data: { image: imageUrl },
    });

    return NextResponse.json({ image: imageUrl });
  } catch (error) {
    console.error("Avatar upload error:", error);
    return NextResponse.json(
      { error: "Erreur lors de l'upload de l'avatar" },
      { status: 500 }
    );
  }
}

export async function DELETE() {
  const user = await requireAuth();

  try {
    const currentUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { image: true },
    });

    if (currentUser?.image && currentUser.image.startsWith("/uploads/avatars/")) {
      const filePath = path.join(process.cwd(), "public", currentUser.image);
      try {
        if (existsSync(filePath)) {
          await unlink(filePath);
        }
      } catch {
        // Ignore cleanup errors
      }
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { image: null },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Avatar delete error:", error);
    return NextResponse.json(
      { error: "Erreur lors de la suppression de l'avatar" },
      { status: 500 }
    );
  }
}
