import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth-helpers";
import { isWorkspaceAdmin } from "@/lib/workspace-auth";
import { parseMoney, serializeMoney } from "@/lib/money";
import { z } from "zod";

const updateSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional(),
  amount: z.union([z.number(), z.string()]).optional(),
  currency: z.string().regex(/^[A-Z]{3}$/).optional(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
});

async function checkBudgetAccess(userId: string, budgetId: string) {
  const budget = await prisma.budget.findFirst({
    where: {
      id: budgetId,
      workspace: { members: { some: { userId } } },
    },
    select: { id: true, workspaceId: true },
  });
  return budget;
}

interface RouteContext {
  params: Promise<{ budgetId: string }>;
}

export async function GET(request: Request, context: RouteContext) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { budgetId } = await context.params;

    const access = await checkBudgetAccess(user.id, budgetId);
    if (!access) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const budget = await prisma.budget.findUnique({
      where: { id: budgetId },
      include: {
        transactions: {
          orderBy: { date: "desc" },
          include: { category: true },
        },
        creator: { select: { id: true, name: true, image: true } },
      },
    });

    if (!budget) return NextResponse.json({ error: "Not found" }, { status: 404 });

    return NextResponse.json(serializeMoney(budget));
  } catch (error) {
    console.error("[BUDGET_DETAIL_GET]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(request: Request, context: RouteContext) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { budgetId } = await context.params;

    const access = await checkBudgetAccess(user.id, budgetId);
    if (!access) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    if (!(await isWorkspaceAdmin(access.workspaceId, user.id))) {
      return NextResponse.json(
        { error: "Seuls les administrateurs peuvent modifier ce budget" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const parsed = updateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const { amount, ...rest } = parsed.data;
    let parsedAmount = undefined;
    if (amount !== undefined) {
      const normalized = parseMoney(amount);
      if (!normalized) {
        return NextResponse.json({ error: "Montant invalide" }, { status: 400 });
      }
      parsedAmount = normalized;
    }

    const budget = await prisma.budget.update({
      where: { id: budgetId },
      data: { ...rest, ...(parsedAmount !== undefined && { amount: parsedAmount }) },
      include: {
        transactions: { orderBy: { date: "desc" } },
        creator: { select: { id: true, name: true, image: true } },
      },
    });

    return NextResponse.json(serializeMoney(budget));
  } catch (error) {
    console.error("[BUDGET_PUT]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(request: Request, context: RouteContext) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { budgetId } = await context.params;

    const access = await checkBudgetAccess(user.id, budgetId);
    if (!access) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    if (!(await isWorkspaceAdmin(access.workspaceId, user.id))) {
      return NextResponse.json(
        { error: "Seuls les administrateurs peuvent supprimer ce budget" },
        { status: 403 }
      );
    }

    await prisma.budget.delete({ where: { id: budgetId } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[BUDGET_DELETE]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
