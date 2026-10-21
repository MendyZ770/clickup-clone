import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth-helpers";
import { parseMoney, serializeMoney } from "@/lib/money";
import { z } from "zod";

const transactionSchema = z.object({
  amount: z.union([z.number(), z.string()]),
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

    const budget = await checkBudgetAccess(user.id, budgetId);
    if (!budget) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

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

     
    const queryArgs: any = {
      where,
      include: {
        creator: { select: { id: true, name: true, image: true } },
        category: true,
        tags: true,
      },
      orderBy: { date: "desc" },
    };
     
    const transactions = await prisma.budgetTransaction.findMany(queryArgs);

    return NextResponse.json(serializeMoney(transactions));
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

    const budget = await checkBudgetAccess(user.id, budgetId);
    if (!budget) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const body = await request.json();
    const parsed = transactionSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const { tags, recurrenceEnd, amount, ...data } = parsed.data;

    const parsedAmount = parseMoney(amount);
    if (!parsedAmount) {
      return NextResponse.json({ error: "Montant invalide" }, { status: 400 });
    }

    if (data.categoryId) {
      const category = await prisma.budgetCategory.findFirst({
        where: { id: data.categoryId, workspaceId: budget.workspaceId },
        select: { id: true, type: true },
      });
      if (!category) {
        return NextResponse.json(
          { error: "Catégorie introuvable dans ce workspace" },
          { status: 400 }
        );
      }
      if (category.type !== "both" && category.type !== data.type) {
        return NextResponse.json(
          { error: "La catégorie ne correspond pas au type de transaction" },
          { status: 400 }
        );
      }
    }

    const parsedDate = data.date ? new Date(data.date) : new Date();
    if (Number.isNaN(parsedDate.getTime())) {
      return NextResponse.json({ error: "Date invalide" }, { status: 400 });
    }

    let parsedRecurrenceEnd: Date | null = null;
    if (recurrenceEnd) {
      parsedRecurrenceEnd = new Date(recurrenceEnd);
      if (Number.isNaN(parsedRecurrenceEnd.getTime())) {
        return NextResponse.json({ error: "Date de fin invalide" }, { status: 400 });
      }
    }

    const transaction = await prisma.budgetTransaction.create({
      data: {
        ...data,
        amount: parsedAmount,
        budgetId,
        creatorId: user.id,
        date: parsedDate,
        recurrenceEnd: parsedRecurrenceEnd,
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

    return NextResponse.json(serializeMoney(transaction), { status: 201 });
  } catch (error) {
    console.error("[TRANSACTIONS_POST]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
