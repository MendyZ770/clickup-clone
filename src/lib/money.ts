import { Prisma } from "@prisma/client";

const MAX_ABSOLUTE_AMOUNT = new Prisma.Decimal("999999999999.99");
const MONEY_SCALE = 2;

interface ParseMoneyOptions {
  allowNegative?: boolean;
  allowZero?: boolean;
}

export function parseMoney(
  value: unknown,
  { allowNegative = false, allowZero = false }: ParseMoneyOptions = {}
): Prisma.Decimal | null {
  if (typeof value !== "number" && typeof value !== "string") return null;
  if (typeof value === "number" && !Number.isFinite(value)) return null;
  if (typeof value === "string" && value.trim() === "") return null;

  let decimal: Prisma.Decimal;
  try {
    decimal = new Prisma.Decimal(value);
  } catch {
    return null;
  }

  if (!decimal.isFinite()) return null;

  const rounded = decimal.toDecimalPlaces(MONEY_SCALE, Prisma.Decimal.ROUND_HALF_UP);
  if (rounded.abs().gt(MAX_ABSOLUTE_AMOUNT)) return null;
  if (!allowZero && rounded.isZero()) return null;
  if (!allowNegative && rounded.isNegative()) return null;

  return rounded;
}

export function toMoneyNumber(
  value: Prisma.Decimal | number | string | null | undefined
): number {
  if (value === null || value === undefined) return 0;
  const decimal = Prisma.Decimal.isDecimal(value) ? value : new Prisma.Decimal(value);
  return Number(decimal.toFixed(MONEY_SCALE));
}

export function signedSourceEffect(transaction: {
  amount: Prisma.Decimal;
  type: string;
  isTransfer: boolean;
}): Prisma.Decimal {
  const amount = new Prisma.Decimal(transaction.amount);
  if (transaction.isTransfer) return amount.negated();
  return transaction.type === "income" ? amount : amount.negated();
}

export function signedTargetEffect(transaction: {
  amount: Prisma.Decimal;
  isTransfer: boolean;
}): Prisma.Decimal {
  return transaction.isTransfer ? new Prisma.Decimal(transaction.amount) : new Prisma.Decimal(0);
}

export function serializeMoney<T>(value: T): T {
  if (Prisma.Decimal.isDecimal(value)) {
    return toMoneyNumber(value) as T;
  }
  if (Array.isArray(value)) {
    return value.map((item) => serializeMoney(item)) as T;
  }
  if (value !== null && typeof value === "object" && !(value instanceof Date)) {
    const serialized: Record<string, unknown> = {};
    for (const [key, entry] of Object.entries(value)) {
      serialized[key] = serializeMoney(entry);
    }
    return serialized as T;
  }
  return value;
}
