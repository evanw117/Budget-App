import { NextRequest, NextResponse } from "next/server";
import { backendRequest } from "@/lib/api/backend";

const cookieName = "waymark_session";
const noCache = { "Cache-Control": "no-store" };
const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
};
type Context = { params: Promise<{ action: string }> };
function failure(status: number, message: string) {
  return NextResponse.json({ error: message }, { status, headers: noCache });
}
function upstreamError(status: number) {
  if (status === 400)
    return failure(400, "Check your email, password, and display name.");
  if (status === 401)
    return failure(401, "Email or password is incorrect. Please try again.");
  if (status === 409)
    return failure(409, "An account with that email already exists.");
  if (status === 429)
    return failure(429, "Too many attempts. Please try again later.");
  return failure(
    503,
    "We can’t reach your account right now. Please try again shortly.",
  );
}
export async function POST(request: NextRequest, context: Context) {
  // The BFF adds cookies, so it must enforce CSRF protection even though the
  // backend is stateless. Require the browser's exact same-origin POST header.
  if (request.headers.get("origin") !== request.nextUrl.origin)
    return failure(403, "Request origin is not allowed.");
  const { action } = await context.params;
  if (action === "logout") {
    const response = NextResponse.json(
      { authenticated: false },
      { headers: noCache },
    );
    response.cookies.set(cookieName, "", { ...cookieOptions, maxAge: 0 });
    return response;
  }
  if (action !== "login" && action !== "register")
    return failure(404, "Not found.");
  if (!request.headers.get("content-type")?.includes("application/json"))
    return failure(415, "JSON is required.");
  let input: Record<string, unknown>;
  try {
    const text = await request.text();
    if (text.length > 4096) return failure(413, "Request is too large.");
    input = JSON.parse(text);
    if (!input || typeof input !== "object" || Array.isArray(input))
      return failure(400, "Invalid request.");
  } catch {
    return failure(400, "Invalid request.");
  }
  // Forward only the intended fields. Never forward client-supplied roles or IDs.
  const body = {
    email: input.email,
    password: input.password,
    ...(action === "register" ? { displayName: input.displayName } : {}),
  };
  try {
    const upstream = await backendRequest(`/api/v1/auth/${action}`, {
      method: "POST",
      body: JSON.stringify(body),
    });
    if (!upstream.ok) return upstreamError(upstream.status);
    const data = await upstream.json();
    if (action === "register") {
      return NextResponse.json(
        {
          id: data.id,
          email: data.email,
          displayName: data.displayName,
          role: data.role,
        },
        { status: 201, headers: noCache },
      );
    }
    if (
      typeof data.accessToken !== "string" ||
      !data.accessToken ||
      !Number.isInteger(data.expiresIn) ||
      data.expiresIn < 1 ||
      data.expiresIn > 3600
    )
      return upstreamError(502);
    const response = NextResponse.json(
      { authenticated: true },
      { headers: noCache },
    );
    response.cookies.set(cookieName, data.accessToken, {
      ...cookieOptions,
      maxAge: data.expiresIn,
    });
    return response;
  } catch {
    return upstreamError(503);
  }
}
export async function GET(request: NextRequest, context: Context) {
  if ((await context.params).action !== "me") return failure(404, "Not found.");
  const token = request.cookies.get(cookieName)?.value;
  if (!token) return failure(401, "Sign in to view your account.");
  try {
    const upstream = await backendRequest("/api/v1/users/me", {
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
    if (!upstream.ok) return upstreamError(upstream.status);
    const data = await upstream.json();
    return NextResponse.json(
      {
        id: data.id,
        email: data.email,
        displayName: data.displayName,
        role: data.role,
      },
      { headers: noCache },
    );
  } catch {
    return upstreamError(503);
  }
}
