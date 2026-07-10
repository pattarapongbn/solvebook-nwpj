import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

export function formatPrice(price: number | null, currency: string | null): string {
  if (price === null) return "—";
  const symbol = currency === "CNY" ? "¥" : currency === "THB" ? "฿" : "$";
  return `${symbol}${price.toFixed(2)}`;
}

export function formatNumber(value: number | null): string {
  if (value === null) return "—";
  return new Intl.NumberFormat("en-US").format(value);
}
