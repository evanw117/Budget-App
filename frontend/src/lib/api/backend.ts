import "server-only";

// Explicit allowlist: this is not an arbitrary URL proxy. The backend remains
// responsible for credentials, roles, validation, and financial calculations.
type BackendPath =
  "/api/v1/auth/register" | "/api/v1/auth/login" | "/api/v1/users/me";
export async function backendRequest(
  path: BackendPath,
  options: RequestInit = {},
) {
  const base = process.env.BACKEND_URL ?? "http://localhost:8080";
  return fetch(new URL(path, base), {
    ...options,
    cache: "no-store",
    redirect: "error",
    headers: { "Content-Type": "application/json", ...options.headers },
    signal: AbortSignal.timeout(8_000),
  });
}
