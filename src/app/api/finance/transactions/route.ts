 
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth-helpers";

export async function GET(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const workspaceId = searchParams.get("workspaceId");
    const accountId = searchParams.get("accountId");
    const type = searchParams.get("type");
    const categoryId = searchParams.get("categoryId");
    const from = searchParams.get("from");
    const to = searchParams.get("to");

    if (!workspaceId) {
      return NextResponse.json({ error: "workspaceId required" }, { status: 400 });
    }

    const where: Record<string, unknown> = {
      userId: user.id,
      account: { workspaceId },
    };

    if (accountId) {
      where.OR = [
        { accountId: accountId },
        { targetAccountId: accountId }
      ];
    }
    if (type) where.type = type;
    if (categoryId) where.categoryId = categoryId;
    if (from || to) {
      where.date = {} as Record<string, Date>;
      if (from) (where.date as Record<string, Date>).gte = new Date(from);
      if (to) (where.date as Record<string, Date>).lte = new Date(to);
    }

    const transactions = await prisma.financeTransaction.findMany({
      where,
      include: { category: true, account: { select: { id: true, name: true, currency: true } } },
      orderBy: { date: "desc" },
    });

    return NextResponse.json(transactions);
  } catch (error) {
    console.error("[FINANCE_TRANSACTIONS_GET]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const { amount, type, description, date, accountId, categoryId, isTransfer, targetAccountId, isRecurring, recurringFrequency } = body;

    if (!amount || !type || !accountId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    if (isTransfer && !targetAccountId) {
      return NextResponse.json({ error: "Le compte de destination est requis pour un transfert" }, { status: 400 });
    }

    const result = await prisma.$transaction(async (tx) => {
      const transaction = await tx.financeTransaction.create({
        data: {
          amount,
          type,
          description,
          date: date ? new Date(date) : new Date(),
          accountId,
          userId: user.id,
          categoryId,
          isTransfer: isTransfer || false,
          targetAccountId,
          isRecurring: isRecurring || false,
          recurringFrequency,
        },
      });

      // Update account balance
      const balanceChange = type === "income" ? amount : -amount;
      await tx.financeAccount.update({
        where: { id: accountId },
        data: { balance: { increment: balanceChange } },
      });

      // If transfer, update target account
      if (isTransfer && targetAccountId) {
        await tx.financeAccount.update({
          where: { id: targetAccountId },
          data: { balance: { increment: amount } },
        });
      }

      return transaction;
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("[FINANCE_TRANSACTIONS_POST]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
