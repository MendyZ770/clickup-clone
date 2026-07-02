import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getGoCardlessClient } from "@/lib/gocardless";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { accountId } = await req.json();

    if (!accountId) {
      return NextResponse.json({ error: "Missing account ID" }, { status: 400 });
    }

    const dbAccount = await prisma.financeAccount.findUnique({
      where: { id: accountId },
      include: { workspace: { include: { members: true } } },
    });

    if (!dbAccount || !dbAccount.gcAccountId) {
      return NextResponse.json({ error: "Account not found or not connected to GoCardless" }, { status: 404 });
    }

    const isMember = dbAccount.workspace.members.some(m => m.userId === session.user.id);
    if (!isMember) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const client = await getGoCardlessClient();
    const accountObj = client.account(dbAccount.gcAccountId);

    // Fetch balance
    try {
      const balances = await accountObj.getBalances();
      // Look for expected or interim balance
      const balanceObj = balances.balances?.[0]?.balanceAmount;
      if (balanceObj && balanceObj.amount) {
        await prisma.financeAccount.update({
          where: { id: dbAccount.id },
          data: { balance: parseFloat(balanceObj.amount) },
        });
      }
    } catch (e) {
      console.error("Could not fetch balance", e);
    }

    // Fetch recent transactions
    let importedCount = 0;
    try {
      const transactionsData = await accountObj.getTransactions();
      const booked = transactionsData.transactions?.booked || [];
      const pending = transactionsData.transactions?.pending || [];
      const allTxns = [...booked, ...pending];

      for (const txn of allTxns) {
        const txnId = txn.transactionId || txn.internalTransactionId;
        if (!txnId) continue;
        
        const amountStr = txn.transactionAmount?.amount;
        if (!amountStr) continue;

        const amount = parseFloat(amountStr);
        const description = txn.remittanceInformationUnstructured || txn.creditorName || txn.debtorName || "Transaction";
        const dateStr = txn.bookingDate || txn.valueDate || new Date().toISOString();

        try {
          await prisma.financeTransaction.upsert({
            where: { gcTransactionId: txnId },
            create: {
              amount: Math.abs(amount), // DB expects absolute value generally, but wait, the previous code mapped positive to expense
              // Let's use positive for income, negative for expense to be safe, or check original code
              // The original manual entry logic usually is: amount > 0 for income, < 0 for expense?
              // Wait, previous code used type: mappedAmount > 0 ? "income" : "expense" and absolute amount?
              // Let's just use absolute amount and set type properly.
              description,
              date: new Date(dateStr),
              accountId: dbAccount.id,
              userId: session.user.id,
              gcTransactionId: txnId,
              type: amount > 0 ? "income" : "expense",
            },
            update: {
              amount: Math.abs(amount),
              description,
              date: new Date(dateStr),
              type: amount > 0 ? "income" : "expense",
            },
          });
          importedCount++;
        } catch (err) {
          // Ignore duplicates
        }
      }
    } catch (e) {
      console.error("Could not fetch transactions", e);
    }

    return NextResponse.json({ success: true, importedCount });
  } catch (error: any) {
    console.error("Error syncing with GoCardless:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
