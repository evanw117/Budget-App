import type { Money } from "@/types/dashboard";
export function formatMoney(value: Money) {
  // Conversion is only for display. No balances or totals are calculated here.
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: value.currency,
  }).format(Number(value.amount));
}
export function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${value}T12:00:00Z`));
}
