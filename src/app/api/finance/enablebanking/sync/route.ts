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
      const balancesRes = await fetchEnableBanking(`/sessions/${sessionId}/accounts/${ebAccId}/balances`);
      if (balancesRes.balances && balancesRes.balances.length > 0) {
        // En général, le premier solde est le plus pertinent
        const balance = balancesRes.balances[0].balanceAmount?.amount;
        if (balance) {
          await prisma.financeAccount.update({
            where: { id: dbAccount.id },
            data: { balance: parseFloat(balance) },
          });
        }
      }
    } catch (e) {
      console.error("Could not fetch balance", e);
    }

    // Fetch transactions
    let importedCount = 0;
    try {
      const txRes = await fetchEnableBanking(`/sessions/${sessionId}/accounts/${ebAccId}/transactions`);
      const transactions = [
        ...(txRes.transactions?.booked || []),
        ...(txRes.transactions?.pending || [])
      ];

      for (const txn of transactions) {
        const txnId = txn.transactionId || txn.internalTransactionId;
        if (!txnId) continue;
        
        const amountStr = txn.transactionAmount?.amount;
        if (!amountStr) continue;

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
    } catch (e) {
      console.error("Could not fetch transactions", e);
    }

    return NextResponse.json({ success: true, importedCount });
  } catch (error: any) {
    console.error("Error syncing with Enable Banking:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
