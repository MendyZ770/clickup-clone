import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, isWorkspaceMember } from "@/lib/auth-helpers";
import { parseMoney, serializeMoney } from "@/lib/money";

const ACCOUNT_TYPES = new Set(["bank", "cash", "crypto", "savings", "investment", "other"]);

export async function GET(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const workspaceId = searchParams.get("workspaceId");

    if (!workspaceId) {
      return NextResponse.json({ error: "workspaceId required" }, { status: 400 });
    }

    if (!(await isWorkspaceMember(workspaceId, user.id))) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const accounts = await prisma.financeAccount.findMany({
      where: { workspaceId, userId: user.id },
      include: {
        _count: { select: { transactions: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(serializeMoney(accounts));
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

    if (typeof name !== "string" || name.trim().length === 0 || name.length > 100) {
      return NextResponse.json({ error: "Nom invalide" }, { status: 400 });
    }
    if (!ACCOUNT_TYPES.has(type)) {
      return NextResponse.json({ error: "Type de compte invalide" }, { status: 400 });
    }
    if (typeof workspaceId !== "string" || !workspaceId) {
      return NextResponse.json({ error: "workspaceId required" }, { status: 400 });
    }

    if (!(await isWorkspaceMember(workspaceId, user.id))) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const normalizedBalance =
      balance === undefined || balance === null
        ? parseMoney(0, { allowZero: true })
        : parseMoney(balance, { allowNegative: true, allowZero: true });
    if (!normalizedBalance) {
      return NextResponse.json({ error: "Solde invalide" }, { status: 400 });
    }

    if (currency !== undefined && (typeof currency !== "string" || !/^[A-Z]{3}$/.test(currency))) {
      return NextResponse.json({ error: "Devise invalide" }, { status: 400 });
    }

    if (color !== undefined && (typeof color !== "string" || !/^#[0-9A-Fa-f]{6}$/.test(color))) {
      return NextResponse.json({ error: "Couleur invalide" }, { status: 400 });
    }

    const account = await prisma.financeAccount.create({
      data: {
        name: name.trim(),
        type,
        bankName: bankName || null,
        currency: currency || "EUR",
        balance: normalizedBalance,
        color: color || "#3B82F6",
        workspaceId,
        userId: user.id,
      },
    });

    return NextResponse.json(serializeMoney(account), { status: 201 });
  } catch (error) {
    console.error("[FINANCE_ACCOUNTS_POST]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
