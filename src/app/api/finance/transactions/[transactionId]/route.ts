import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth-helpers";
import { parseMoney, serializeMoney, signedSourceEffect, signedTargetEffect } from "@/lib/money";

export async function PATCH(request: Request, { params }: { params: Promise<{ transactionId: string }> }) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { transactionId } = await params;

    const body = await request.json();

    const result = await prisma.$transaction(async (tx) => {
      const oldTransaction = await tx.financeTransaction.findFirst({
        where: { id: transactionId, userId: user.id },
        include: { account: { select: { workspaceId: true } } },
      });
      if (!oldTransaction) throw new Error("TRANSACTION_NOT_FOUND");

      const newAmount =
        body.amount === undefined ? oldTransaction.amount : parseMoney(body.amount);
      if (!newAmount) throw new Error("INVALID_AMOUNT");

      let newType: string;
      if (oldTransaction.isTransfer) {
        if (body.type !== undefined && body.type !== "transfer") {
          throw new Error("TRANSFER_TYPE_IMMUTABLE");
        }
        newType = "transfer";
      } else {
        newType = body.type === undefined ? oldTransaction.type : body.type;
        if (newType !== "income" && newType !== "expense") {
          throw new Error("INVALID_TYPE");
        }
      }

      let newDate = oldTransaction.date;
      if (body.date !== undefined) {
        const parsed = new Date(body.date);
        if (Number.isNaN(parsed.getTime())) throw new Error("INVALID_DATE");
        newDate = parsed;
      }

      if (
        body.description !== undefined &&
        body.description !== null &&
        (typeof body.description !== "string" || body.description.length > 500)
      ) {
        throw new Error("INVALID_DESCRIPTION");
      }

      let newCategoryId: string | null = oldTransaction.categoryId;
      if (oldTransaction.isTransfer || newType === "transfer") {
        newCategoryId = null;
      } else if (body.categoryId !== undefined) {
        if (body.categoryId === null || body.categoryId === "") {
          newCategoryId = null;
        } else {
          if (typeof body.categoryId !== "string") throw new Error("INVALID_CATEGORY");
          const category = await tx.financeCategory.findFirst({
            where: { id: body.categoryId, workspaceId: oldTransaction.account.workspaceId },
            select: { id: true, type: true },
          });
          if (!category) throw new Error("INVALID_CATEGORY");
          if (category.type !== newType) throw new Error("CATEGORY_TYPE_MISMATCH");
          newCategoryId = category.id;
        }
      } else if (newType !== oldTransaction.type) {
        newCategoryId = null;
      }

      const oldSourceEffect = signedSourceEffect(oldTransaction);
      const newSourceEffect = signedSourceEffect({
        amount: newAmount,
        type: newType,
        isTransfer: oldTransaction.isTransfer,
      });
      const sourceDelta = newSourceEffect.minus(oldSourceEffect);

      const oldTargetEffect = signedTargetEffect(oldTransaction);
      const newTargetEffect = signedTargetEffect({
        amount: newAmount,
        isTransfer: oldTransaction.isTransfer,
      });
      const targetDelta = newTargetEffect.minus(oldTargetEffect);

      const transaction = await tx.financeTransaction.update({
        where: { id: transactionId },
        data: {
          amount: newAmount,
          type: newType,
          description:
            body.description === undefined ? oldTransaction.description : body.description || null,
          date: newDate,
          categoryId: newCategoryId,
        },
      });

      if (!sourceDelta.isZero()) {
        await tx.financeAccount.update({
          where: { id: oldTransaction.accountId },
          data: { balance: { increment: sourceDelta } },
        });
      }

      if (oldTransaction.targetAccountId && !targetDelta.isZero()) {
        await tx.financeAccount.update({
          where: { id: oldTransaction.targetAccountId },
          data: { balance: { increment: targetDelta } },
        });
      }

      return transaction;
    });

    return NextResponse.json(serializeMoney(result));
  } catch (error) {
    if (error instanceof Error) {
      switch (error.message) {
        case "TRANSACTION_NOT_FOUND":
          return NextResponse.json({ error: "Transaction introuvable" }, { status: 404 });
        case "INVALID_AMOUNT":
          return NextResponse.json({ error: "Montant invalide" }, { status: 400 });
        case "INVALID_TYPE":
          return NextResponse.json({ error: "Type invalide" }, { status: 400 });
        case "TRANSFER_TYPE_IMMUTABLE":
          return NextResponse.json(
            { error: "Un transfert ne peut pas être converti en revenu ou dépense" },
            { status: 400 }
          );
        case "INVALID_DATE":
          return NextResponse.json({ error: "Date invalide" }, { status: 400 });
        case "INVALID_DESCRIPTION":
          return NextResponse.json({ error: "Description invalide" }, { status: 400 });
        case "INVALID_CATEGORY":
          return NextResponse.json({ error: "Catégorie introuvable" }, { status: 400 });
        case "CATEGORY_TYPE_MISMATCH":
          return NextResponse.json(
            { error: "La catégorie ne correspond pas au type de transaction" },
            { status: 400 }
          );
      }
    }
    console.error("[FINANCE_TRANSACTION_PATCH]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ transactionId: string }> }) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { transactionId } = await params;

    await prisma.$transaction(async (tx) => {
      const transaction = await tx.financeTransaction.findFirst({
        where: { id: transactionId, userId: user.id },
      });
      if (!transaction) throw new Error("TRANSACTION_NOT_FOUND");

      const sourceReversal = signedSourceEffect(transaction).negated();
      const targetReversal = signedTargetEffect(transaction).negated();

      await tx.financeTransaction.delete({ where: { id: transactionId } });

      await tx.financeAccount.update({
        where: { id: transaction.accountId },
        data: { balance: { increment: sourceReversal } },
      });

      if (transaction.targetAccountId && !targetReversal.isZero()) {
        await tx.financeAccount.update({
          where: { id: transaction.targetAccountId },
          data: { balance: { increment: targetReversal } },
        });
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof Error && error.message === "TRANSACTION_NOT_FOUND") {
      return NextResponse.json({ error: "Transaction introuvable" }, { status: 404 });
    }
    console.error("[FINANCE_TRANSACTION_DELETE]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
