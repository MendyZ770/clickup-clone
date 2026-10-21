import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, isWorkspaceMember } from "@/lib/auth-helpers";
import { parseMoney, serializeMoney, signedSourceEffect, signedTargetEffect } from "@/lib/money";

const RECURRING_FREQUENCIES = new Set(["weekly", "monthly", "yearly"]);

export async function GET(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const workspaceId = searchParams.get("workspaceId");
    const accountId = searchParams.get("accountId");
    const type = searchParams.get("type");
    const categoryId = searchParams.get("categoryId");
    const from = searchParams.get("from");
    const to = searchParams.get("to");

    if (!workspaceId) {
      return NextResponse.json({ error: "workspaceId required" }, { status: 400 });
    }

    if (!(await isWorkspaceMember(workspaceId, user.id))) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (type && !["income", "expense", "transfer"].includes(type)) {
      return NextResponse.json({ error: "Type invalide" }, { status: 400 });
    }

    const where: Record<string, unknown> = {
      userId: user.id,
      account: { workspaceId },
    };

    if (accountId) {
      where.OR = [{ accountId }, { targetAccountId: accountId }];
    }
    if (type) where.type = type;
    if (categoryId) where.categoryId = categoryId;

    if (from || to) {
      const dateFilter: Record<string, Date> = {};
      if (from) {
        const parsed = new Date(from);
        if (Number.isNaN(parsed.getTime())) {
          return NextResponse.json({ error: "Date de début invalide" }, { status: 400 });
        }
        dateFilter.gte = parsed;
      }
      if (to) {
        const parsed = new Date(to);
        if (Number.isNaN(parsed.getTime())) {
          return NextResponse.json({ error: "Date de fin invalide" }, { status: 400 });
        }
        dateFilter.lte = parsed;
      }
      where.date = dateFilter;
    }

    const transactions = await prisma.financeTransaction.findMany({
      where,
      include: { category: true, account: { select: { id: true, name: true, currency: true } } },
      orderBy: { date: "desc" },
    });

    return NextResponse.json(serializeMoney(transactions));
  } catch (error) {
    console.error("[FINANCE_TRANSACTIONS_GET]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const { accountId, targetAccountId, categoryId, description, date } = body;

    const amount = parseMoney(body.amount);
    if (!amount) {
      return NextResponse.json({ error: "Montant invalide" }, { status: 400 });
    }

    const isTransfer = body.isTransfer === true || body.isTransfer === "true" || body.type === "transfer";
    let type: "income" | "expense" | "transfer";
    if (isTransfer) {
      type = "transfer";
    } else if (body.type === "income" || body.type === "expense") {
      type = body.type;
    } else {
      return NextResponse.json({ error: "Type invalide" }, { status: 400 });
    }

    if (typeof accountId !== "string" || accountId.length === 0) {
      return NextResponse.json({ error: "Compte requis" }, { status: 400 });
    }

    if (isTransfer) {
      if (typeof targetAccountId !== "string" || targetAccountId.length === 0) {
        return NextResponse.json(
          { error: "Le compte de destination est requis pour un transfert" },
          { status: 400 }
        );
      }
      if (targetAccountId === accountId) {
        return NextResponse.json(
          { error: "Le compte de destination doit être différent du compte source" },
          { status: 400 }
        );
      }
    }

    const transactionDate = date ? new Date(date) : new Date();
    if (Number.isNaN(transactionDate.getTime())) {
      return NextResponse.json({ error: "Date invalide" }, { status: 400 });
    }

    let isRecurring = false;
    let recurringFrequency: string | null = null;
    if (body.isRecurring === true || body.isRecurring === "true") {
      if (!RECURRING_FREQUENCIES.has(body.recurringFrequency)) {
        return NextResponse.json({ error: "Fréquence de récurrence invalide" }, { status: 400 });
      }
      isRecurring = true;
      recurringFrequency = body.recurringFrequency;
    }

    if (description !== undefined && (typeof description !== "string" || description.length > 500)) {
      return NextResponse.json({ error: "Description invalide" }, { status: 400 });
    }

    const sourceAccount = await prisma.financeAccount.findFirst({
      where: {
        id: accountId,
        userId: user.id,
        workspace: { members: { some: { userId: user.id } } },
      },
      select: { id: true, currency: true, workspaceId: true },
    });
    if (!sourceAccount) {
      return NextResponse.json({ error: "Forbidden: Compte source invalide" }, { status: 403 });
    }

    let target = null;
    if (isTransfer) {
      target = await prisma.financeAccount.findFirst({
        where: {
          id: targetAccountId,
          userId: user.id,
          workspaceId: sourceAccount.workspaceId,
        },
        select: { id: true, currency: true },
      });
      if (!target) {
        return NextResponse.json(
          { error: "Forbidden: Compte de destination invalide" },
          { status: 403 }
        );
      }
      if (target.currency !== sourceAccount.currency) {
        return NextResponse.json(
          { error: "Les comptes d'un transfert doivent utiliser la même devise" },
          { status: 400 }
        );
      }
    }

    let resolvedCategoryId: string | null = null;
    if (!isTransfer && categoryId) {
      if (typeof categoryId !== "string") {
        return NextResponse.json({ error: "Catégorie invalide" }, { status: 400 });
      }
      const category = await prisma.financeCategory.findFirst({
        where: { id: categoryId, workspaceId: sourceAccount.workspaceId },
        select: { id: true, type: true },
      });
      if (!category) {
        return NextResponse.json({ error: "Catégorie introuvable" }, { status: 400 });
      }
      if (category.type !== type) {
        return NextResponse.json(
          { error: "La catégorie ne correspond pas au type de transaction" },
          { status: 400 }
        );
      }
      resolvedCategoryId = category.id;
    }

    const result = await prisma.$transaction(async (tx) => {
      const transaction = await tx.financeTransaction.create({
        data: {
          amount,
          type,
          description: description || null,
          date: transactionDate,
          accountId,
          userId: user.id,
          categoryId: resolvedCategoryId,
          isTransfer,
          targetAccountId: isTransfer ? targetAccountId : null,
          isRecurring,
          recurringFrequency,
        },
      });

      const sourceEffect = signedSourceEffect({ amount, type, isTransfer });
      await tx.financeAccount.update({
        where: { id: accountId },
        data: { balance: { increment: sourceEffect } },
      });

      if (isTransfer && target) {
        const targetEffect = signedTargetEffect({ amount, isTransfer });
        await tx.financeAccount.update({
          where: { id: target.id },
          data: { balance: { increment: targetEffect } },
        });
      }

      return transaction;
    });

    return NextResponse.json(serializeMoney(result), { status: 201 });
  } catch (error) {
    console.error("[FINANCE_TRANSACTIONS_POST]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
