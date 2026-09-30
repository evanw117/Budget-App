// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
vi.mock("@/lib/api/backend", () => ({ backendRequest: vi.fn() }));
import { backendRequest } from "@/lib/api/backend";
import { POST, GET } from "@/app/api/auth/[action]/route";
const upstream = vi.mocked(backendRequest);
const context = (action: string) => ({ params: Promise.resolve({ action }) });
function request(
  origin = "http://localhost:3000",
  body = { email: "alice@example.com", password: "test-password" },
) {
  return new NextRequest("http://localhost:3000/api/auth/login", {
    method: "POST",
    headers: { origin, "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}
beforeEach(() => upstream.mockReset());
describe("authentication boundary", () => {
  it("rejects cross-origin cookie mutations", async () => {
    expect(
      (await POST(request("https://other.example"), context("login"))).status,
    ).toBe(403);
    expect(upstream).not.toHaveBeenCalled();
  });
  it("stores JWT only in an HttpOnly cookie and limits its lifetime", async () => {
    upstream.mockResolvedValue(
      Response.json({ accessToken: "private-jwt", expiresIn: 900 }),
    );
    const response = await POST(request(), context("login"));
    expect(await response.json()).toEqual({ authenticated: true });
    expect(response.headers.get("set-cookie")).toContain("HttpOnly");
    expect(response.headers.get("set-cookie")).toContain("SameSite=lax");
    expect(response.headers.get("set-cookie")).toContain("Max-Age=900");
    expect(response.headers.get("cache-control")).toBe("no-store");
  });
  it("sanitizes backend errors", async () => {
    upstream.mockResolvedValue(
      Response.json({ detail: "database password=secret" }, { status: 500 }),
    );
    const response = await POST(request(), context("login"));
    expect(response.status).toBe(503);
    expect(await response.text()).not.toContain("secret");
  });
  it("rejects absent sessions without contacting the backend", async () => {
    const response = await GET(
      new NextRequest("http://localhost:3000/api/auth/me"),
      context("me"),
    );
    expect(response.status).toBe(401);
    expect(upstream).not.toHaveBeenCalled();
  });
  it("clears an expired session", async () => {
    upstream.mockResolvedValue(new Response(null, { status: 401 }));
    const response = await GET(
      new NextRequest("http://localhost:3000/api/auth/me", {
        headers: { cookie: "waymark_session=expired" },
      }),
      context("me"),
    );
    expect(response.status).toBe(401);
    expect(response.headers.get("set-cookie")).toContain("Max-Age=0");
  });
  it("strips client-supplied privileges from registration", async () => {
    upstream.mockResolvedValue(
      Response.json({
        id: "1",
        email: "alice@example.com",
        displayName: "Alice",
        role: "ROLE_USER",
      }),
    );
    const req = new NextRequest("http://localhost:3000/api/auth/register", {
      method: "POST",
      headers: {
        origin: "http://localhost:3000",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        email: "alice@example.com",
        password: "pass",
        displayName: "Alice",
        role: "ROLE_ADMIN",
        id: "other",
      }),
    });
    await POST(req, context("register"));
    expect(JSON.parse(String(upstream.mock.calls[0][1]?.body))).toEqual({
      email: "alice@example.com",
      password: "pass",
      displayName: "Alice",
    });
  });
});
