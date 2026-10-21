import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth-helpers";
import { parseMoney, serializeMoney } from "@/lib/money";
import { z } from "zod";

const budgetSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  amount: z.union([z.number(), z.string()]),
  currency: z.string().regex(/^[A-Z]{3}$/).default("EUR"),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).default("#10B981"),
  workspaceId: z.string().min(1),
});

async function checkWorkspaceAccess(userId: string, workspaceId: string) {
  const member = await prisma.workspaceMember.findUnique({
    where: { workspaceId_userId: { workspaceId, userId } },
  });
  return !!member;
}

export async function GET(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const workspaceId = searchParams.get("workspaceId");
    if (!workspaceId) return NextResponse.json({ error: "workspaceId required" }, { status: 400 });

    const hasAccess = await checkWorkspaceAccess(user.id, workspaceId);
    if (!hasAccess) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const budgets = await prisma.budget.findMany({
      where: { workspaceId },
      include: {
        transactions: { orderBy: { date: "desc" } },
        creator: { select: { id: true, name: true, image: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(serializeMoney(budgets));
  } catch (error) {
    console.error("[BUDGET_GET]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const parsed = budgetSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const { workspaceId, amount, ...data } = parsed.data;

    const hasAccess = await checkWorkspaceAccess(user.id, workspaceId);
    if (!hasAccess) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const parsedAmount = parseMoney(amount);
    if (!parsedAmount) {
      return NextResponse.json({ error: "Montant invalide" }, { status: 400 });
    }

    const budget = await prisma.budget.create({
      data: {
        ...data,
        amount: parsedAmount,
        workspaceId,
        creatorId: user.id,
      },
      include: {
        transactions: true,
        creator: { select: { id: true, name: true, image: true } },
      },
    });

    return NextResponse.json(serializeMoney(budget), { status: 201 });
  } catch (error) {
    console.error("[BUDGET_POST]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
