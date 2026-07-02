import { NextResponse } from "next/server";
import { fetchEnableBanking } from "@/lib/enablebanking";

export async function GET() {
  try {
    const accId = 'f37c5c0a-8eb9-4e42-a543-399dccdc5739'; // Compte joint
    const bal = await fetchEnableBanking(`/accounts/${accId}/balances`);
    const tx = await fetchEnableBanking(`/accounts/${accId}/transactions`);
    return NextResponse.json({ balances: bal, transactions: tx });
  } catch(e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
