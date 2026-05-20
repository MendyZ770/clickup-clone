import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth-helpers";
import { z } from "zod";

const transactionSchema = z.object({
  amount: z.number().positive(),
  type: z.enum(["income", "expense"]),
  subType: z.string().optional(),
  description: z.string().max(500).optional(),
  date: z.string().datetime().optional(),
  categoryId: z.string().optional().nullable(),
  isRecurring: z.boolean().optional(),
  recurrenceRule: z.string().optional(),
  recurrenceEnd: z.string().datetime().optional(),
  isTransfer: z.boolean().optional(),
  tags: z.array(z.string()).optional(),
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

    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type");
    const categoryId = searchParams.get("categoryId");
    const from = searchParams.get("from");
    const to = searchParams.get("to");

    const subType = searchParams.get("subType");
    const isRecurring = searchParams.get("isRecurring");
    const search = searchParams.get("search");
    const minAmount = searchParams.get("minAmount");
    const maxAmount = searchParams.get("maxAmount");

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = {
      budgetId,
      ...(type ? { type } : {}),
      ...(subType ? { subType } : {}),
      ...(categoryId ? { categoryId } : {}),
      ...(isRecurring ? { isRecurring: isRecurring === "true" } : {}),
      ...(search
        ? {
            OR: [
              { description: { contains: search, mode: "insensitive" } },
              { subType: { contains: search, mode: "insensitive" } },
            ],
          }
        : {}),
      ...(from || to
        ? {
            date: {
              ...(from ? { gte: new Date(from) } : {}),
              ...(to ? { lte: new Date(to) } : {}),
            },
          }
        : {}),
      ...(minAmount || maxAmount
        ? {
            amount: {
              ...(minAmount ? { gte: parseFloat(minAmount) } : {}),
              ...(maxAmount ? { lte: parseFloat(maxAmount) } : {}),
            },
          }
        : {}),
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const queryArgs: any = {
      where,
      include: {
        creator: { select: { id: true, name: true, image: true } },
        category: true,
        tags: true,
      },
      orderBy: { date: "desc" },
    };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const transactions = await (prisma.budgetTransaction.findMany as any)(queryArgs);

    return NextResponse.json(transactions);
  } catch (error) {
    console.error("[TRANSACTIONS_GET]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: Request, context: RouteContext) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { budgetId } = await context.params;

    const hasAccess = await checkBudgetAccess(user.id, budgetId);
    if (!hasAccess) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const body = await request.json();
    const parsed = transactionSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const { tags, recurrenceEnd, ...data } = parsed.data;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const transaction = await (prisma.budgetTransaction.create as any)({
      data: {
        ...data,
        budgetId,
        creatorId: user.id,
        date: data.date ? new Date(data.date) : new Date(),
        recurrenceEnd: recurrenceEnd ? new Date(recurrenceEnd) : null,
        tags: tags && tags.length > 0
          ? { create: tags.map((name) => ({ name })) }
          : undefined,
      },
      include: {
        creator: { select: { id: true, name: true, image: true } },
        category: true,
        tags: true,
      },
    });

    return NextResponse.json(transaction, { status: 201 });
  } catch (error) {
    console.error("[TRANSACTIONS_POST]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
