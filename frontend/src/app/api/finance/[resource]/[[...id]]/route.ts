import { NextRequest, NextResponse } from "next/server";
import { backendRequest } from "@/lib/api/backend";
import { cookieName, cookieOptions, noCache } from "@/lib/api/session";

type Context = { params: Promise<{ resource: string; id?: string[] }> };
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
function failure(status: number, message: string) {
  return NextResponse.json({ error: message }, { status, headers: noCache });
}
async function handle(request: NextRequest, context: Context) {
  const { resource, id } = await context.params;
  if (
    resource !== "accounts" &&
    resource !== "categories" &&
    resource !== "transactions"
  )
    return failure(404, "Not found.");
  if (id && (id.length !== 1 || !uuid.test(id[0])))
    return failure(404, "Not found.");
  const method = request.method;
  if (
    (method === "POST" && id) ||
    ((method === "PATCH" || method === "PUT" || method === "DELETE") && !id) ||
    (method === "PUT" && resource !== "transactions") ||
    (method === "PATCH" && resource === "transactions")
  )
    return failure(405, "Method not allowed.");
  if (
    method !== "GET" &&
    request.headers.get("origin") !== request.nextUrl.origin
  )
    return failure(403, "Request origin is not allowed.");
  const token = request.cookies.get(cookieName)?.value;
  if (!token)
    return failure(401, "Sign in to manage your financial workspace.");
  let body: string | undefined;
  if (method === "POST" || method === "PATCH" || method === "PUT") {
    if (!request.headers.get("content-type")?.includes("application/json"))
      return failure(415, "JSON is required.");
    try {
      const text = await request.text();
      if (text.length > 4096) return failure(413, "Request is too large.");
      const input = JSON.parse(text);
      if (!input || typeof input !== "object" || Array.isArray(input))
        return failure(400, "Invalid request.");
      const allowed =
        resource === "accounts"
          ? ["name", "accountType", "currency", "openingBalance"]
          : resource === "transactions"
            ? [
                "accountId",
                "categoryId",
                "type",
                "amount",
                "date",
                "description",
              ]
            : ["name", "type"];
      if (method === "PATCH") allowed.push("active");
      body = JSON.stringify(
        Object.fromEntries(
          allowed
            .filter((key) => Object.hasOwn(input, key))
            .map((key) => [key, input[key]]),
        ),
      );
    } catch {
      return failure(400, "Invalid request.");
    }
  }
  const query = new URLSearchParams();
  if (resource === "transactions" && method === "GET" && !id) {
    for (const key of ["accountId", "type", "from", "to", "page", "size"]) {
      const value = request.nextUrl.searchParams.get(key);
      if (value !== null) query.set(key, value);
    }
  }
  try {
    const path =
      `/api/v1/${resource}${id ? `/${id[0]}` : ""}${query.size ? `?${query}` : ""}` as `/api/v1/${"accounts" | "categories" | "transactions"}${string}`;
    const upstream = await backendRequest(path, {
      method,
      body,
      headers: { Authorization: `Bearer ${token}` },
    });
    if (upstream.status === 401) {
      const response = failure(
        401,
        "Your session has expired. Please sign in again.",
      );
      response.cookies.set(cookieName, "", { ...cookieOptions, maxAge: 0 });
      return response;
    }
    if (upstream.status === 403)
      return failure(403, "You do not have access to this resource.");
    if (upstream.status === 404)
      return failure(
        404,
        "This item was not found. Refresh the page and try again.",
      );
    if (upstream.status === 409)
      return failure(
        409,
        "This change conflicts with existing data. Category names must be unique per type. Account currency and category type cannot change while transactions use them.",
      );
    if (upstream.status === 400)
      return failure(
        400,
        resource === "transactions"
          ? "Check your fields and filters. Use a positive amount (up to 15 whole digits and 4 decimal places), a date no later than today, and an active account and matching category."
          : "Check the name, type, currency code, and balance format. Balances allow up to 15 whole digits and 4 decimal places.",
      );
    if (!upstream.ok)
      return failure(
        503,
        "We cannot reach your financial workspace right now. Please try again.",
      );
    if (upstream.status === 204)
      return new NextResponse(null, { status: 204, headers: noCache });
    return NextResponse.json(await upstream.json(), {
      status: upstream.status,
      headers: noCache,
    });
  } catch {
    return failure(
      503,
      "We cannot reach your financial workspace right now. Please try again.",
    );
  }
}
export {
  handle as GET,
  handle as POST,
  handle as PATCH,
  handle as PUT,
  handle as DELETE,
};
