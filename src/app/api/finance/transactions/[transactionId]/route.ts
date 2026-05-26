 
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth-helpers";

export async function PATCH(request: Request, { params }: { params: Promise<{ transactionId: string }> }) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { transactionId } = await params;

    const body = await request.json();
    const { amount, type, description, date, categoryId } = body;

    const transaction = await (prisma as any).financeTransaction.update({
      where: { id: transactionId, userId: user.id },
      data: { amount, type, description, date: date ? new Date(date) : undefined, categoryId },
    });

    return NextResponse.json(transaction);
  } catch (error) {
    console.error("[FINANCE_TRANSACTION_PATCH]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ transactionId: string }> }) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { transactionId } = await params;

    await (prisma as any).financeTransaction.delete({
      where: { id: transactionId, userId: user.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[FINANCE_TRANSACTION_DELETE]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
