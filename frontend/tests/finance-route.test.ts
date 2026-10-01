// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
vi.mock("@/lib/api/backend", () => ({ backendRequest: vi.fn() }));
import { backendRequest } from "@/lib/api/backend";
import {
  GET,
  POST,
  PATCH,
  DELETE,
} from "@/app/api/finance/[resource]/[[...id]]/route";
const upstream = vi.mocked(backendRequest);
const id = "11111111-1111-4111-8111-111111111111";
const context = (resource = "accounts", item?: string[]) => ({
  params: Promise.resolve({ resource, id: item }),
});
function request(
  method = "GET",
  body?: object,
  origin = "http://localhost:3000",
  cookie = "waymark_session=private-token",
) {
  return new NextRequest("http://localhost:3000/api/finance/accounts", {
    method,
    headers: { origin, cookie, "content-type": "application/json" },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
}
beforeEach(() => upstream.mockReset());
describe("financial API boundary", () => {
  it("requires a session before reaching Spring Boot", async () => {
    expect(
      (
        await GET(
          request("GET", undefined, "http://localhost:3000", ""),
          context(),
        )
      ).status,
    ).toBe(401);
    expect(upstream).not.toHaveBeenCalled();
  });
  it("rejects cross-origin writes including archive", async () => {
    expect(
      (await POST(request("POST", {}, "https://other.example"), context()))
        .status,
    ).toBe(403);
    expect(
      (
        await DELETE(
          request("DELETE", undefined, "https://other.example"),
          context("accounts", [id]),
        )
      ).status,
    ).toBe(403);
    expect(upstream).not.toHaveBeenCalled();
  });
  it("only proxies known resources and UUID item paths", async () => {
    expect((await GET(request(), context("users"))).status).toBe(404);
    expect(
      (await GET(request(), context("accounts", ["..", "users"]))).status,
    ).toBe(404);
    expect(upstream).not.toHaveBeenCalled();
  });
  it("forwards only financial inputs and keeps decimal strings exact", async () => {
    upstream.mockResolvedValue(
      Response.json({ id, openingBalance: "123.4567" }, { status: 201 }),
    );
    const response = await POST(
      request("POST", {
        name: "Checking",
        accountType: "CHECKING",
        currency: "EUR",
        openingBalance: "123.4567",
        userId: "victim",
        active: false,
      }),
      context(),
    );
    expect(response.status).toBe(201);
    const options = upstream.mock.calls[0][1];
    expect(JSON.parse(String(options?.body))).toEqual({
      name: "Checking",
      accountType: "CHECKING",
      currency: "EUR",
      openingBalance: "123.4567",
    });
    expect(options?.headers).toEqual({ Authorization: "Bearer private-token" });
    expect(response.headers.get("cache-control")).toBe("no-store");
  });
  it("preserves partial updates and handles empty archive responses", async () => {
    upstream.mockResolvedValue(Response.json({ id, active: true }));
    await PATCH(request("PATCH", { active: true }), context("accounts", [id]));
    expect(JSON.parse(String(upstream.mock.calls[0][1]?.body))).toEqual({
      active: true,
    });
    upstream.mockResolvedValue(new Response(null, { status: 204 }));
    const response = await DELETE(request("DELETE"), context("accounts", [id]));
    expect(response.status).toBe(204);
    expect(await response.text()).toBe("");
  });
  it("clears invalid sessions and sanitizes backend failures", async () => {
    upstream.mockResolvedValue(new Response(null, { status: 401 }));
    const unauthorized = await GET(request(), context());
    expect(unauthorized.headers.get("set-cookie")).toContain("Max-Age=0");
    upstream.mockResolvedValue(
      Response.json({ detail: "private SQL data" }, { status: 500 }),
    );
    const failed = await GET(request(), context());
    expect(failed.status).toBe(503);
    expect(await failed.text()).not.toContain("private SQL");
  });
  it("preserves duplicate and foreign-resource statuses", async () => {
    upstream.mockResolvedValue(new Response(null, { status: 409 }));
    expect(
      (
        await POST(
          request("POST", { name: "Housing", type: "EXPENSE" }),
          context("categories"),
        )
      ).status,
    ).toBe(409);
    upstream.mockResolvedValue(new Response(null, { status: 404 }));
    expect((await GET(request(), context("accounts", [id]))).status).toBe(404);
  });
});
