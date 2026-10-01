export const accountTypes = [
  "CHECKING",
  "SAVINGS",
  "CREDIT_CARD",
  "CASH",
  "INVESTMENT",
  "OTHER",
] as const;
export type AccountType = (typeof accountTypes)[number];
export type AccountInput = {
  name: string;
  accountType: AccountType;
  currency: string;
  openingBalance: string;
};
export type Account = AccountInput & {
  currentBalance: string;
  id: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
};
export type CategoryType = "INCOME" | "EXPENSE";
export type CategoryInput = { name: string; type: CategoryType };
export type Category = CategoryInput & {
  id: string;
  active: boolean;
  defaultCategory: boolean;
  createdAt: string;
  updatedAt: string;
};
export function typeLabel(value: string) {
  return value
    .toLowerCase()
    .replaceAll("_", " ")
    .replace(/^./, (letter) => letter.toUpperCase());
}
