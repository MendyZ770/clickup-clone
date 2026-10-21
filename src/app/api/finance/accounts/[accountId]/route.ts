import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth-helpers";
import { parseMoney, serializeMoney, signedSourceEffect } from "@/lib/money";

const ACCOUNT_TYPES = new Set(["bank", "cash", "crypto", "savings", "investment", "other"]);

export async function GET(request: Request, { params }: { params: Promise<{ accountId: string }> }) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { accountId } = await params;

    const account = await prisma.financeAccount.findFirst({
      where: { id: accountId, userId: user.id },
      include: {
        transactions: {
          orderBy: { date: "desc" },
          take: 50,
          include: { category: true },
        },
        goals: true,
      },
    });

    if (!account) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(serializeMoney(account));
  } catch (error) {
    console.error("[FINANCE_ACCOUNT_GET]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ accountId: string }> }) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { accountId } = await params;

    const body = await request.json();
    const { name, type, bankName, currency, balance, color } = body;

    const existing = await prisma.financeAccount.findFirst({
      where: { id: accountId, userId: user.id },
      select: {
        id: true,
        balance: true,
        currency: true,
        _count: { select: { transactions: true, goals: true } },
      },
    });
    if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

    if (name !== undefined && (typeof name !== "string" || name.trim().length === 0 || name.length > 100)) {
      return NextResponse.json({ error: "Nom invalide" }, { status: 400 });
    }
    if (type !== undefined && !ACCOUNT_TYPES.has(type)) {
      return NextResponse.json({ error: "Type de compte invalide" }, { status: 400 });
    }
    if (color !== undefined && (typeof color !== "string" || !/^#[0-9A-Fa-f]{6}$/.test(color))) {
      return NextResponse.json({ error: "Couleur invalide" }, { status: 400 });
    }
    if (currency !== undefined && (typeof currency !== "string" || !/^[A-Z]{3}$/.test(currency))) {
      return NextResponse.json({ error: "Devise invalide" }, { status: 400 });
    }
    if (currency !== undefined && currency !== existing.currency) {
      const incomingTransfers = await prisma.financeTransaction.count({
        where: { targetAccountId: accountId },
      });
      if (existing._count.transactions > 0 || incomingTransfers > 0 || existing._count.goals > 0) {
        return NextResponse.json(
          { error: "La devise ne peut plus être modifiée une fois le compte utilisé" },
          { status: 400 }
        );
      }
    }

    let newBalance = null;
    if (balance !== undefined) {
      newBalance = parseMoney(balance, { allowNegative: true, allowZero: true });
      if (!newBalance) {
        return NextResponse.json({ error: "Solde invalide" }, { status: 400 });
      }
    }

    const account = await prisma.$transaction(async (tx) => {
      if (newBalance && !newBalance.equals(existing.balance)) {
        const difference = newBalance.minus(existing.balance);
        await tx.financeTransaction.create({
          data: {
            amount: difference.abs(),
            type: difference.isPositive() ? "income" : "expense",
            description: "Ajustement manuel du solde",
            accountId,
            userId: user.id,
            isTransfer: false,
          },
        });
      }

      return tx.financeAccount.update({
        where: { id: accountId },
        data: {
          ...(name !== undefined && { name: name.trim() }),
          ...(type !== undefined && { type }),
          ...(bankName !== undefined && { bankName: bankName || null }),
          ...(currency !== undefined && { currency }),
          ...(color !== undefined && { color }),
          ...(newBalance !== null && { balance: newBalance }),
        },
      });
    });

    return NextResponse.json(serializeMoney(account));
  } catch (error) {
    console.error("[FINANCE_ACCOUNT_PATCH]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ accountId: string }> }) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { accountId } = await params;

    const { searchParams } = new URL(request.url);
    const force = searchParams.get("force") === "true";

    const account = await prisma.financeAccount.findFirst({
      where: { id: accountId, userId: user.id },
      select: { id: true, _count: { select: { transactions: true } } },
    });
    if (!account) return NextResponse.json({ error: "Not found" }, { status: 404 });

    // Les transferts entrants référencent ce compte via targetAccountId (pas de relation FK).
    const incomingTransfers = await prisma.financeTransaction.findMany({
      where: { targetAccountId: accountId, accountId: { not: accountId } },
    });
    const historyCount = account._count.transactions + incomingTransfers.length;

    if (historyCount > 0 && !force) {
      return NextResponse.json(
        {
          error: `Ce compte contient ${historyCount} transaction(s). Confirmez la suppression de l'historique avec ?force=true.`,
        },
        { status: 409 }
      );
    }

    await prisma.$transaction(async (tx) => {
      // Supprimer un transfert entrant annule aussi le débit du compte source.
      for (const transfer of incomingTransfers) {
        await tx.financeAccount.update({
          where: { id: transfer.accountId },
          data: { balance: { increment: signedSourceEffect(transfer).negated() } },
        });
        await tx.financeTransaction.delete({ where: { id: transfer.id } });
      }

      await tx.financeTransaction.deleteMany({ where: { targetAccountId: accountId } });
      await tx.financeAccount.delete({ where: { id: accountId } });
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[FINANCE_ACCOUNT_DELETE]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
