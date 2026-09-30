import { apiRequest } from "@/lib/api/client";
import type { CurrentUser, LoginInput, RegisterInput } from "@/types/auth";
export const authService = {
  login: (input: LoginInput) =>
    apiRequest<{ authenticated: boolean }>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify(input),
    }),
  register: (input: RegisterInput) =>
    apiRequest<CurrentUser>("/api/auth/register", {
      method: "POST",
      body: JSON.stringify(input),
    }),
  currentUser: (signal?: AbortSignal) =>
    apiRequest<CurrentUser>("/api/auth/me", { signal }),
  logout: () =>
    apiRequest<{ authenticated: boolean }>("/api/auth/logout", {
      method: "POST",
    }),
};
