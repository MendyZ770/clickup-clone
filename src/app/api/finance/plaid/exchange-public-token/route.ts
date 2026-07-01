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

    const { publicToken, workspaceId, metadata } = await req.json();

    if (!publicToken || !workspaceId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Verify workspace access
    const workspace = await prisma.workspace.findFirst({
      where: {
        id: workspaceId,
        members: { some: { userId: session.user.id } },
      },
    });

    if (!workspace) {
      return NextResponse.json({ error: "Workspace not found or unauthorized" }, { status: 403 });
    }

    // Exchange public token for access token
    const exchangeResponse = await plaidClient.itemPublicTokenExchange({
      public_token: publicToken,
    });

    const accessToken = exchangeResponse.data.access_token;
    const itemId = exchangeResponse.data.item_id;

    // Save each account returned by Plaid link into our DB
    for (const account of metadata.accounts) {
      await prisma.financeAccount.create({
        data: {
          name: account.name,
          type: "bank",
          balance: 0, // Will be updated on sync
          workspaceId,
          userId: session.user.id,
          plaidAccessToken: accessToken,
          plaidItemId: itemId,
          color: "#3B82F6",
        },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error exchanging public token:", error.response?.data || error.message);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
