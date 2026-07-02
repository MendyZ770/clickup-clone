 
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth-helpers";

export async function PATCH(request: Request, { params }: { params: Promise<{ categoryId: string }> }) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { categoryId } = await params;

    const body = await request.json();
    const { name, color, icon } = body;

    const existing = await prisma.financeCategory.findUnique({
      where: { id: categoryId },
      include: { workspace: { include: { members: { where: { userId: user.id } } } } },
    });
    if (!existing || existing.workspace.members.length === 0) return NextResponse.json({ error: "Not found or Forbidden" }, { status: 404 });

    const category = await prisma.financeCategory.update({
      where: { id: categoryId },
      data: { name, color, icon },
    });

    return NextResponse.json(category);
  } catch (error) {
    console.error("[FINANCE_CATEGORY_PATCH]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ categoryId: string }> }) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { categoryId } = await params;

    const existing = await prisma.financeCategory.findUnique({
      where: { id: categoryId },
      include: { workspace: { include: { members: { where: { userId: user.id } } } } },
    });
    if (!existing || existing.workspace.members.length === 0) return NextResponse.json({ error: "Not found or Forbidden" }, { status: 404 });

    await prisma.financeCategory.delete({
      where: { id: categoryId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[FINANCE_CATEGORY_DELETE]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
