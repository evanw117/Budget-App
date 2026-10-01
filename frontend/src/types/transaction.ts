import type { CategoryType } from "./finance";
export type TransactionInput = {
  accountId: string;
  categoryId: string;
  type: CategoryType;
  amount: string;
  date: string;
  description: string;
};
export type Transaction = TransactionInput & {
  id: string;
  accountName: string;
  categoryName: string;
  currency: string;
  createdAt: string;
  updatedAt: string;
};
export type TransactionPage = {
  items: Transaction[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
};
export type TransactionFilters = {
  accountId: string;
  type: string;
  from: string;
  to: string;
};
