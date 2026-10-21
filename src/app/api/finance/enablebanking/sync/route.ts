import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { getCurrentUser } from "@/lib/auth-helpers";
import { fetchEnableBanking } from "@/lib/enablebanking";
import { parseMoney, signedSourceEffect, toMoneyNumber } from "@/lib/money";
import { prisma } from "@/lib/prisma";

interface EnableBankingTransaction {
  transactionId?: string;
  internalTransactionId?: string;
  entryReference?: string;
  transactionAmount?: { amount?: string };
  amount?: string;
  remittanceInformationUnstructured?: string;
  creditorName?: string;
  debtorName?: string;
  bookingDate?: string;
  valueDate?: string;
}

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { accountId } = await req.json();

    if (typeof accountId !== "string" || !accountId) {
      return NextResponse.json({ error: "Missing account ID" }, { status: 400 });
    }

    const dbAccount = await prisma.financeAccount.findFirst({
      where: {
        id: accountId,
        userId: user.id,
        workspace: { members: { some: { userId: user.id } } },
      },
    });

    if (!dbAccount || !dbAccount.ebAccountId) {
      return NextResponse.json(
        { error: "Account not found or not connected to Enable Banking" },
        { status: 404 }
      );
    }

    const ebAccId = dbAccount.ebAccountId.split(":").pop();
    if (!ebAccId) {
      return NextResponse.json({ error: "Identifiant bancaire invalide" }, { status: 400 });
    }

    let bankBalance: Prisma.Decimal | null = null;
    try {
      const balancesRes = await fetchEnableBanking(`/accounts/${ebAccId}/balances`);
      const balances = balancesRes.balances || (Array.isArray(balancesRes) ? balancesRes : []);
      if (balances.length > 0) {
        const raw =
          balances[0].balance_amount?.amount ||
          balances[0].balanceAmount?.amount ||
          balances[0].amount;
        bankBalance = parseMoney(raw, { allowNegative: true, allowZero: true });
      }
    } catch (error) {
      // Le solde bancaire reste optionnel : les transactions peuvent être importées seules
      console.warn("Could not fetch Enable Banking balance", error);
    }

    const txRes = await fetchEnableBanking(`/accounts/${ebAccId}/transactions`);

    const booked: EnableBankingTransaction[] = txRes.transactions?.booked || txRes.booked || [];
    const pending: EnableBankingTransaction[] = txRes.transactions?.pending || txRes.pending || [];
    const uniqueTransactions = new Map<string, EnableBankingTransaction>();
    for (const transaction of [...booked, ...pending]) {
      const id =
        transaction.transactionId ||
        transaction.internalTransactionId ||
        transaction.entryReference;
      if (id) uniqueTransactions.set(String(id), transaction);
    }

    const result = await prisma.$transaction(
      async (tx) => {
        const account = await tx.financeAccount.findUnique({
          where: { id: dbAccount.id },
          select: { id: true, balance: true, userId: true },
        });
        if (!account) throw new Error("ACCOUNT_NOT_FOUND");

        const previousImportedCount = await tx.financeTransaction.count({
          where: { accountId: account.id, ebTransactionId: { not: null } },
        });
        const isInitialSync = previousImportedCount === 0;

        let importedCount = 0;
        let updatedCount = 0;
        let skippedCount = 0;
        let balanceDelta = new Prisma.Decimal(0);

        for (const [txnId, txn] of uniqueTransactions) {
          const rawAmount = txn.transactionAmount?.amount ?? txn.amount;
          const amount = parseMoney(rawAmount, { allowNegative: true, allowZero: true });
          if (!amount || amount.isZero()) {
            skippedCount++;
            continue;
          }

          const dateValue = txn.bookingDate || txn.valueDate;
          const date = dateValue ? new Date(dateValue) : new Date();
          if (Number.isNaN(date.getTime())) {
            skippedCount++;
            continue;
          }

          const description = (
            txn.remittanceInformationUnstructured ||
            txn.creditorName ||
            txn.debtorName ||
            "Transaction"
          ).slice(0, 500);
          const type = amount.gt(0) ? "income" : "expense";
          const absoluteAmount = amount.abs();

          const existing = await tx.financeTransaction.findUnique({
            where: { ebTransactionId: txnId },
          });

          if (existing) {
            if (existing.accountId !== account.id) {
              skippedCount++;
              continue;
            }

            const changed =
              !existing.amount.equals(absoluteAmount) ||
              existing.type !== type ||
              existing.description !== description ||
              existing.date.getTime() !== date.getTime();

            if (!changed) {
              skippedCount++;
              continue;
            }

            const oldEffect = signedSourceEffect(existing);
            const newEffect = signedSourceEffect({
              amount: absoluteAmount,
              type,
              isTransfer: false,
            });
            balanceDelta = balanceDelta.plus(newEffect.minus(oldEffect));

            await tx.financeTransaction.update({
              where: { id: existing.id },
              data: { amount: absoluteAmount, type, description, date },
            });
            updatedCount++;
            continue;
          }

          await tx.financeTransaction.create({
            data: {
              amount: absoluteAmount,
              type,
              description,
              date,
              accountId: account.id,
              userId: user.id,
              ebTransactionId: txnId,
              isTransfer: false,
            },
          });
          balanceDelta = balanceDelta.plus(
            signedSourceEffect({ amount: absoluteAmount, type, isTransfer: false })
          );
          importedCount++;
        }

        if (isInitialSync && bankBalance !== null) {
          // Premier import : on ancre le solde bancaire dans le ledger via une
          // écriture d'ouverture, sans jamais écraser le solde existant.
          const openingBalance = bankBalance.minus(account.balance).minus(balanceDelta);
          if (!openingBalance.isZero()) {
            await tx.financeTransaction.create({
              data: {
                amount: openingBalance.abs(),
                type: openingBalance.gt(0) ? "income" : "expense",
                description: "Solde d'ouverture synchronisé",
                accountId: account.id,
                userId: user.id,
                isTransfer: false,
              },
            });
            balanceDelta = balanceDelta.plus(openingBalance);
          }
        }

        if (!balanceDelta.isZero()) {
          await tx.financeAccount.update({
            where: { id: account.id },
            data: { balance: { increment: balanceDelta } },
          });
        }

        return {
          importedCount,
          updatedCount,
          skippedCount,
          balance: toMoneyNumber(account.balance.plus(balanceDelta)),
        };
      },
      { timeout: 20000 }
    );

    return NextResponse.json({ success: true, ...result });
  } catch (error: unknown) {
    console.error("Error syncing with Enable Banking:", error);
    return NextResponse.json(
      { error: "Échec de la synchronisation bancaire" },
      { status: 502 }
    );
  }
}
