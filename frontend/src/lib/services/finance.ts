import { apiRequest } from "@/lib/api/client";
import type {
  Account,
  AccountInput,
  Category,
  CategoryInput,
} from "@/types/finance";
export const accountService = {
  list: (signal?: AbortSignal) =>
    apiRequest<Account[]>("/api/finance/accounts", { signal }),
  create: (input: AccountInput) =>
    apiRequest<Account>("/api/finance/accounts", {
      method: "POST",
      body: JSON.stringify(input),
    }),
  update: (id: string, input: Partial<AccountInput> & { active?: boolean }) =>
    apiRequest<Account>(`/api/finance/accounts/${id}`, {
      method: "PATCH",
      body: JSON.stringify(input),
    }),
  archive: (id: string) =>
    apiRequest<void>(`/api/finance/accounts/${id}`, { method: "DELETE" }),
};
export const categoryService = {
  list: (signal?: AbortSignal) =>
    apiRequest<Category[]>("/api/finance/categories", { signal }),
  create: (input: CategoryInput) =>
    apiRequest<Category>("/api/finance/categories", {
      method: "POST",
      body: JSON.stringify(input),
    }),
  update: (id: string, input: Partial<CategoryInput> & { active?: boolean }) =>
    apiRequest<Category>(`/api/finance/categories/${id}`, {
      method: "PATCH",
      body: JSON.stringify(input),
    }),
  archive: (id: string) =>
    apiRequest<void>(`/api/finance/categories/${id}`, { method: "DELETE" }),
};
