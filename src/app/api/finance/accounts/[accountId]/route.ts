/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth-helpers";

export async function GET(request: Request, { params }: { params: { accountId: string } }) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const account = await (prisma as any).financeAccount.findUnique({
      where: { id: params.accountId, userId: user.id },
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
    return NextResponse.json(account);
  } catch (error) {
    console.error("[FINANCE_ACCOUNT_GET]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(request: Request, { params }: { params: { accountId: string } }) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const { name, type, bankName, currency, balance, color } = body;

    const account = await (prisma as any).financeAccount.update({
      where: { id: params.accountId, userId: user.id },
      data: { name, type, bankName, currency, balance, color },
    });

    return NextResponse.json(account);
  } catch (error) {
    console.error("[FINANCE_ACCOUNT_PATCH]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: { accountId: string } }) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await (prisma as any).financeAccount.delete({
      where: { id: params.accountId, userId: user.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[FINANCE_ACCOUNT_DELETE]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
