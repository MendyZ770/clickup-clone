import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function safeHref(url: string | null | undefined): string {
  if (!url) return "#";
  if (url.startsWith("/")) return url;
  try {
    const parsed = new URL(url);
    return parsed.protocol === "http:" || parsed.protocol === "https:" ? url : "#";
  } catch {
    return "#";
  }
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
