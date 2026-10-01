import { apiRequest } from "@/lib/api/client";
import type {
  Transaction,
  TransactionInput,
  TransactionPage,
  TransactionFilters,
} from "@/types/transaction";
export const transactionService = {
  list: (filters: TransactionFilters, page: number, signal?: AbortSignal) => {
    const query = new URLSearchParams({ page: String(page), size: "20" });
    Object.entries(filters).forEach(([key, value]) => {
      if (value) query.set(key, value);
    });
    return apiRequest<TransactionPage>(`/api/finance/transactions?${query}`, {
      signal,
    });
  },
  create: (input: TransactionInput) =>
    apiRequest<Transaction>("/api/finance/transactions", {
      method: "POST",
      body: JSON.stringify(input),
    }),
  update: (id: string, input: TransactionInput) =>
    apiRequest<Transaction>(`/api/finance/transactions/${id}`, {
      method: "PUT",
      body: JSON.stringify(input),
    }),
  delete: (id: string) =>
    apiRequest<void>(`/api/finance/transactions/${id}`, { method: "DELETE" }),
};
