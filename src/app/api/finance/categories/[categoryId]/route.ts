 
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

    const category = await (prisma as any).financeCategory.update({
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

    await (prisma as any).financeCategory.delete({
      where: { id: categoryId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[FINANCE_CATEGORY_DELETE]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
