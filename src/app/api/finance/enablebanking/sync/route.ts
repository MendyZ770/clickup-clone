import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { fetchEnableBanking } from "@/lib/enablebanking";
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

    if (!dbAccount || !dbAccount.ebAccountId) {
      return NextResponse.json({ error: "Account not found or not connected to Enable Banking" }, { status: 404 });
    }

    const isMember = dbAccount.workspace.members.some(m => m.userId === session.user.id);
    if (!isMember) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // L'ID sauvegardé est de la forme "sessionId:accountId"
    const [sessionId, ebAccId] = dbAccount.ebAccountId.split(":");

    // Fetch balance
    try {
      const balancesRes = await fetchEnableBanking(`/accounts/${ebAccId}/balances`);
      // Handle both { balances: [...] } and direct array formats
      const balances = balancesRes.balances || (Array.isArray(balancesRes) ? balancesRes : []);
      if (balances.length > 0) {
        // Try different balance amount field formats
        const balance = balances[0].balance_amount?.amount 
          || balances[0].balanceAmount?.amount 
          || balances[0].amount;
        if (balance) {
          await prisma.financeAccount.update({
            where: { id: dbAccount.id },
            data: { balance: parseFloat(balance) },
          });
        }
      }
    } catch (e: any) {
      console.error("Could not fetch balance", e);
      return NextResponse.json({ error: "Failed to fetch balance: " + e.message }, { status: 500 });
    }

    // Fetch transactions
    let importedCount = 0;
    let skippedCount = 0;
    let rawApiResponse: any = null;
    try {
      const txRes = await fetchEnableBanking(`/accounts/${ebAccId}/transactions`);
      rawApiResponse = txRes;
      
      // Enable Banking API can return transactions in different formats:
      // Format 1: { transactions: { booked: [...], pending: [...] } }
      // Format 2: { booked: [...], pending: [...] }
      const booked = txRes.transactions?.booked || txRes.booked || [];
      const pending = txRes.transactions?.pending || txRes.pending || [];
      const transactions = [...booked, ...pending];

      for (const txn of transactions) {
        const txnId = txn.transactionId || txn.internalTransactionId || txn.entryReference;
        if (!txnId) {
           console.log("Skipping transaction because no ID found:", JSON.stringify(txn));
           skippedCount++;
           continue;
        }
        
        const amountStr = txn.transactionAmount?.amount || txn.amount;
        if (!amountStr) {
           console.log("Skipping transaction because no amount found:", JSON.stringify(txn));
           skippedCount++;
           continue;
        }

        const amount = parseFloat(amountStr);
        const description = txn.remittanceInformationUnstructured || txn.creditorName || txn.debtorName || "Transaction";
        const dateStr = txn.bookingDate || txn.valueDate || new Date().toISOString();

        try {
          await prisma.financeTransaction.upsert({
            where: { ebTransactionId: txnId },
            create: {
              amount: Math.abs(amount),
              description,
              date: new Date(dateStr),
              accountId: dbAccount.id,
              userId: session.user.id,
              ebTransactionId: txnId,
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
          // Ignorer les doublons exacts
        }
      }
    } catch (e: any) {
      console.error("Could not fetch transactions", e);
      return NextResponse.json({ error: "Failed to fetch transactions: " + e.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, importedCount, skippedCount, rawApiResponse });
  } catch (error: any) {
    console.error("Error syncing with Enable Banking:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
