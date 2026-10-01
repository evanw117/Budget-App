// @vitest-environment node
import { beforeEach, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
vi.mock("@/lib/api/backend", () => ({ backendRequest: vi.fn() }));
import { backendRequest } from "@/lib/api/backend";
import {
  GET,
  PUT,
  PATCH,
  DELETE,
} from "@/app/api/finance/[resource]/[[...id]]/route";
const upstream = vi.mocked(backendRequest);
const id = "11111111-1111-4111-8111-111111111111";
const context = (item = false) => ({
  params: Promise.resolve({
    resource: "transactions",
    ...(item ? { id: [id] } : {}),
  }),
});
function request(
  method: string,
  query = "",
  body?: object,
  origin = "http://localhost:3000",
  cookie = "waymark_session=private-token",
) {
  return new NextRequest(
    "http://localhost:3000/api/finance/transactions" + query,
    {
      method,
      headers: { origin, cookie, "content-type": "application/json" },
      ...(body ? { body: JSON.stringify(body) } : {}),
    },
  );
}
beforeEach(() => upstream.mockReset());
it("forwards allowlisted filters only and never forwards a client owner", async () => {
  upstream.mockResolvedValue(Response.json({ items: [] }));
  await GET(
    request(
      "GET",
      "?accountId=" +
        id +
        "&type=EXPENSE&from=2026-01-01&to=2026-02-01&page=2&size=20&userId=victim",
    ),
    context(),
  );
  expect(upstream.mock.calls[0][0]).toBe(
    "/api/v1/transactions?accountId=" +
      id +
      "&type=EXPENSE&from=2026-01-01&to=2026-02-01&page=2&size=20",
  );
});
it("forwards full edits with exact decimal strings and strips currency and ownership", async () => {
  upstream.mockResolvedValue(Response.json({ id }));
  const input = {
    accountId: id,
    categoryId: id,
    amount: "123456789012345.6789",
    type: "EXPENSE",
    date: "2026-01-01",
    description: "",
  };
  await PUT(
    request("PUT", "", { ...input, userId: "victim", currency: "GBP" }),
    context(true),
  );
  expect(upstream.mock.calls[0][1]?.method).toBe("PUT");
  expect(JSON.parse(String(upstream.mock.calls[0][1]?.body))).toEqual(input);
});
it("requires a session and same origin for edits and deletes", async () => {
  expect(
    (await PUT(request("PUT", "", {}, "https://evil.example"), context(true)))
      .status,
  ).toBe(403);
  expect(
    (
      await DELETE(
        request("DELETE", "", undefined, "http://localhost:3000", ""),
        context(true),
      )
    ).status,
  ).toBe(401);
  expect((await PATCH(request("PATCH", "", {}), context(true))).status).toBe(
    405,
  );
  expect((await PUT(request("PUT", "", {}), context())).status).toBe(405);
  expect(upstream).not.toHaveBeenCalled();
});
