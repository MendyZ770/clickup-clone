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

    const { requisitionId, workspaceId } = await req.json();

    if (!requisitionId || !workspaceId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const client = await getGoCardlessClient();
    const requisitionData = await client.requisition.getRequisitionById(requisitionId);

    if (!requisitionData.accounts || requisitionData.accounts.length === 0) {
      return NextResponse.json({ error: "No accounts found in requisition" }, { status: 400 });
    }

    for (const accountId of requisitionData.accounts) {
      const accountObj = client.account(accountId);
      let metaName = "Compte Bancaire";
      try {
        const metadata = await accountObj.getMetadata();
        metaName = metadata.institution_id || "Compte Bancaire";
      } catch (e) {
        // ignore
      }

      await prisma.financeAccount.create({
        data: {
          name: metaName,
          type: "bank",
          balance: 0,
          workspaceId,
          userId: session.user.id,
          gcRequisitionId: requisitionId,
          gcAccountId: accountId,
          color: "#10B981", // Emerald green for GoCardless
        },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error in GoCardless callback:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
