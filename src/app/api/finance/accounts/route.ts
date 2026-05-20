/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth-helpers";

export async function GET(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const workspaceId = searchParams.get("workspaceId");

    if (!workspaceId) {
      return NextResponse.json({ error: "workspaceId required" }, { status: 400 });
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const accounts = await (prisma as any).financeAccount.findMany({
      where: { workspaceId, userId: user.id },
      include: {
        _count: { select: { transactions: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(accounts);
  } catch (error) {
    console.error("[FINANCE_ACCOUNTS_GET]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const { name, type, bankName, currency, balance, color, workspaceId } = body;

    if (!name || !type || !workspaceId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const account = await (prisma as any).financeAccount.create({
      data: {
        name,
        type,
        bankName,
        currency: currency || "EUR",
        balance: balance || 0,
        color: color || "#3B82F6",
        workspaceId,
        userId: user.id,
      },
    });

    return NextResponse.json(account);
  } catch (error) {
    console.error("[FINANCE_ACCOUNTS_POST]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
