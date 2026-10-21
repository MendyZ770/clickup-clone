import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth-helpers";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { randomUUID } from "crypto";

export const dynamic = "force-dynamic";

const MAX_SIZE = 10 * 1024 * 1024; // 10 MB

// Extension déduite du type MIME : le nom envoyé par le client ne décide jamais de
// l'extension, sinon un .html ou .svg téléversé serait exécuté sur notre origine.
const ALLOWED_TYPES: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/gif": ".gif",
  "image/webp": ".webp",
  "application/pdf": ".pdf",
  "text/plain": ".txt",
  "text/csv": ".csv",
  "application/msword": ".doc",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": ".docx",
  "application/vnd.ms-excel": ".xls",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": ".xlsx",
  "application/zip": ".zip",
};

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { error: `Fichier trop volumineux. Taille maximale : ${MAX_SIZE / 1024 / 1024} Mo` },
        { status: 400 }
      );
    }

    const ext = ALLOWED_TYPES[file.type];
    if (!ext) {
      return NextResponse.json(
        { error: `Type de fichier non autorisé : ${file.type}` },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const key = `${randomUUID()}${ext}`;
    const blobToken = process.env.BLOB_READ_WRITE_TOKEN;

    let url: string;
    if (blobToken) {
      const { put } = await import("@vercel/blob");
      const blob = await put(`uploads/${key}`, buffer, {
        access: "public",
        token: blobToken,
      });
      url = blob.url;
    } else {
      // Self-hosted / Capacitor server : disque local. Sur Vercel le système de
      // fichiers est en lecture seule, d'où l'erreur explicite plutôt qu'un 500.
      const uploadsDir = join(process.cwd(), "public", "uploads");
      try {
        await mkdir(uploadsDir, { recursive: true });
        await writeFile(join(uploadsDir, key), buffer);
      } catch {
        return NextResponse.json(
          {
            error:
              "Stockage indisponible : configurez BLOB_READ_WRITE_TOKEN pour activer le téléversement.",
          },
          { status: 501 }
        );
      }
      url = `/uploads/${key}`;
    }

    return NextResponse.json({
      url,
      name: file.name,
      type: "file",
      mimeType: file.type,
      size: file.size,
    });
  } catch (error) {
    console.error("POST /api/upload error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
