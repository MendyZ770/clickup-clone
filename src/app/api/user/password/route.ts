import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth-helpers";

export async function PATCH(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { currentPassword, newPassword } = body;

    if (typeof newPassword !== "string" || newPassword.length < 8) {
      return NextResponse.json(
        { error: "Le nouveau mot de passe doit contenir au moins 8 caractères" },
        { status: 400 }
      );
    }
    if (newPassword.length > 200) {
      return NextResponse.json(
        { error: "Le mot de passe est trop long" },
        { status: 400 }
      );
    }

    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { hashedPassword: true },
    });

    if (!dbUser?.hashedPassword) {
      return NextResponse.json(
        { error: "Aucun mot de passe défini pour ce compte" },
        { status: 400 }
      );
    }

    if (typeof currentPassword !== "string") {
      return NextResponse.json(
        { error: "Mot de passe actuel requis" },
        { status: 400 }
      );
    }

    const valid = await bcrypt.compare(currentPassword, dbUser.hashedPassword);
    if (!valid) {
      return NextResponse.json(
        { error: "Mot de passe actuel incorrect" },
        { status: 400 }
      );
    }

    const hashed = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
      where: { id: user.id },
      data: { hashedPassword: hashed },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("PATCH /api/user/password error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
