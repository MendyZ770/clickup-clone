 
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

    const result = await prisma.$transaction(async (tx) => {
      const oldTransaction = await tx.financeTransaction.findUnique({
        where: { id: transactionId, userId: user.id },
      });
      if (!oldTransaction) throw new Error("Transaction not found");

      const transaction = await tx.financeTransaction.update({
        where: { id: transactionId },
        data: { amount, type, description, date: date ? new Date(date) : undefined, categoryId },
      });

      if (amount !== undefined && amount !== oldTransaction.amount) {
        const amountDiff = amount - oldTransaction.amount;
        const balanceChange = oldTransaction.type === "income" ? amountDiff : -amountDiff;
        
        await tx.financeAccount.update({
          where: { id: oldTransaction.accountId },
          data: { balance: { increment: balanceChange } },
        });

        if (oldTransaction.isTransfer && oldTransaction.targetAccountId) {
          await tx.financeAccount.update({
            where: { id: oldTransaction.targetAccountId },
            data: { balance: { increment: amountDiff } },
          });
        }
      }

      return transaction;
    });

    return NextResponse.json(result);
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

    await prisma.$transaction(async (tx) => {
      const transaction = await tx.financeTransaction.findUnique({
        where: { id: transactionId, userId: user.id },
      });
      if (!transaction) throw new Error("Transaction not found");

      await tx.financeTransaction.delete({
        where: { id: transactionId },
      });

      const revertChange = transaction.type === "income" ? -transaction.amount : transaction.amount;
      
      await tx.financeAccount.update({
        where: { id: transaction.accountId },
        data: { balance: { increment: revertChange } },
      });

      if (transaction.isTransfer && transaction.targetAccountId) {
        await tx.financeAccount.update({
          where: { id: transaction.targetAccountId },
          data: { balance: { decrement: transaction.amount } },
        });
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[FINANCE_TRANSACTION_DELETE]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
