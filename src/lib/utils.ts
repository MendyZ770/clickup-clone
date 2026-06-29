import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number, currency: string = "EUR") {
  try {
    return amount.toLocaleString("fr-FR", {
      style: "currency",
      currency: currency,
    });
  } catch (e) {
    const symbol = currency === "BTC" ? "₿" : currency;
    return `${amount.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 6 })} ${symbol}`;
  }
}
