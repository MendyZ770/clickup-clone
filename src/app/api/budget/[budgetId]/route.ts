import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth-helpers";
import { z } from "zod";

const updateSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional(),
  amount: z.number().positive().optional(),
  currency: z.string().max(3).optional(),
  color: z.string().max(7).optional(),
});

async function checkBudgetAccess(userId: string, budgetId: string) {
  const budget = await prisma.budget.findFirst({
    where: {
      id: budgetId,
      workspace: { members: { some: { userId } } },
    },
    select: { id: true },
  });
  return !!budget;
}

interface RouteContext {
  params: Promise<{ budgetId: string }>;
}

export async function GET(request: Request, context: RouteContext) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { budgetId } = await context.params;

    const hasAccess = await checkBudgetAccess(user.id, budgetId);
    if (!hasAccess) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

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

    return NextResponse.json(budget);
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

    const hasAccess = await checkBudgetAccess(user.id, budgetId);
    if (!hasAccess) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const body = await request.json();
    const parsed = updateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const budget = await prisma.budget.update({
      where: { id: budgetId },
      data: parsed.data,
      include: {
        transactions: { orderBy: { date: "desc" } },
        creator: { select: { id: true, name: true, image: true } },
      },
    });

    return NextResponse.json(budget);
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

    const hasAccess = await checkBudgetAccess(user.id, budgetId);
    if (!hasAccess) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    await prisma.budget.delete({ where: { id: budgetId } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[BUDGET_DELETE]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
