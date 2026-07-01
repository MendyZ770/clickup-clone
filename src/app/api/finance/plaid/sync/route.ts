import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { plaidClient } from "@/lib/plaid";
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

    const account = await prisma.financeAccount.findUnique({
      where: { id: accountId },
      include: { workspace: { include: { members: true } } },
    });

    if (!account || !account.plaidAccessToken) {
      return NextResponse.json({ error: "Account not found or not connected to Plaid" }, { status: 404 });
    }

    const isMember = account.workspace.members.some(m => m.userId === session.user.id);
    if (!isMember) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Fetch latest balance
    const accountsResponse = await plaidClient.accountsGet({
      access_token: account.plaidAccessToken,
    });
    
    // Plaid usually returns multiple accounts per Item. 
    // We update the balance based on the total or find the matching Plaid account id.
    // For simplicity, if we connected one account, we just take the first one or sum them.
    const plaidAccount = accountsResponse.data.accounts[0];
    
    if (plaidAccount?.balances?.current !== undefined) {
      await prisma.financeAccount.update({
        where: { id: account.id },
        data: { balance: plaidAccount.balances.current },
      });
    }

    // Fetch recent transactions (last 30 days)
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30);
    const endDate = new Date();

    const transactionsResponse = await plaidClient.transactionsGet({
      access_token: account.plaidAccessToken,
      start_date: startDate.toISOString().split("T")[0],
      end_date: endDate.toISOString().split("T")[0],
    });

    const transactions = transactionsResponse.data.transactions;

    let importedCount = 0;

    for (const txn of transactions) {
      // Upsert transaction to avoid duplicates
      // Plaid amounts are positive for expenses, negative for income.
      // Our DB expects: amount > 0 for income, amount < 0 for expenses.
      const mappedAmount = -txn.amount; 
      
      try {
        await prisma.financeTransaction.upsert({
          where: { plaidTransactionId: txn.transaction_id },
          create: {
            amount: mappedAmount,
            description: txn.name,
            date: new Date(txn.date),
            accountId: account.id,
            workspaceId: account.workspaceId,
            userId: session.user.id,
            plaidTransactionId: txn.transaction_id,
            type: mappedAmount > 0 ? "income" : "expense",
          },
          update: {
            amount: mappedAmount,
            description: txn.name,
            date: new Date(txn.date),
          },
        });
        importedCount++;
      } catch (err) {
        // Ignore unique constraint errors on race conditions
      }
    }

    return NextResponse.json({ success: true, importedCount });
  } catch (error: any) {
    console.error("Error syncing with Plaid:", error.response?.data || error.message);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
