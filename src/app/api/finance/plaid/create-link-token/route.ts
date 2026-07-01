import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { plaidClient } from "@/lib/plaid";
import { CountryCode, Products } from "plaid";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { workspaceId } = await req.json();

    if (!workspaceId) {
      return NextResponse.json({ error: "Workspace ID required" }, { status: 400 });
    }

    const request = {
      user: {
        client_user_id: session.user.id,
      },
      client_name: "ClickUp Clone Finance",
      products: [Products.Transactions],
      country_codes: [CountryCode.Fr, CountryCode.Us],
      language: "fr",
      webhook: "https://your-domain.com/api/finance/plaid/webhook",
      redirect_uri: process.env.PLAID_REDIRECT_URI || undefined,
    };

    const response = await plaidClient.linkTokenCreate(request);

    return NextResponse.json(response.data);
  } catch (error: any) {
    console.error("Error creating link token:", error.response?.data || error.message);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
