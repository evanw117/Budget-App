import { expect, test } from "@playwright/test";
test("transactions create, edit, filter and delete on desktop and mobile", async ({
  page,
}) => {
  const accountId = "11111111-1111-4111-8111-111111111111";
  const categoryId = "22222222-2222-4222-8222-222222222222";
  let rows: Record<string, string>[] = [];
  await page.route("**/api/finance/accounts", (route) =>
    route.fulfill({
      json: [
        {
          id: accountId,
          name: "Euro",
          currency: "EUR",
          active: true,
          openingBalance: "100",
          currentBalance: "100",
        },
      ],
    }),
  );
  await page.route("**/api/finance/categories", (route) =>
    route.fulfill({
      json: [
        { id: categoryId, name: "Groceries", type: "EXPENSE", active: true },
      ],
    }),
  );
  await page.route("**/api/finance/transactions**", (route) => {
    const method = route.request().method();
    if (method === "POST" || method === "PUT") {
      rows = [
        {
          ...route.request().postDataJSON(),
          id: "33333333-3333-4333-8333-333333333333",
          accountName: "Euro",
          categoryName: "Groceries",
          currency: "EUR",
        },
      ];
      return route.fulfill({
        status: method === "POST" ? 201 : 200,
        json: rows[0],
      });
    }
    if (method === "DELETE") {
      rows = [];
      return route.fulfill({ status: 204 });
    }
    const type = new URL(route.request().url()).searchParams.get("type");
    const items = rows.filter((row) => !type || row.type === type);
    return route.fulfill({
      json: {
        items,
        page: 0,
        size: 20,
        totalElements: items.length,
        totalPages: items.length ? 1 : 0,
      },
    });
  });
  await page.goto("/transactions");
  await expect(page).toHaveTitle("Transactions · Budget App");
  await expect(
    page.getByRole("heading", { name: "No transactions found" }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Add transaction", exact: true })
    .click();
  await page.getByLabel("Account", { exact: true }).selectOption(accountId);
  await page.getByLabel("Category", { exact: true }).selectOption(categoryId);
  await page.getByLabel("Amount (EUR)").fill("12.3456");
  await page.getByLabel("Description (optional)").fill("Weekly shop");
  await page.getByRole("button", { name: "Save transaction" }).click();
  await expect(page.getByText("−12.3456 EUR", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Edit Weekly shop" }).click();
  await page.getByLabel("Amount (EUR)").fill("15.0001");
  await page.getByRole("button", { name: "Save transaction" }).click();
  await expect(page.getByText("−15.0001 EUR", { exact: true })).toBeVisible();
  await page.getByLabel("Filter type").selectOption("INCOME");
  await page.getByRole("button", { name: "Apply filters" }).click();
  await expect(
    page.getByRole("heading", { name: "No transactions found" }),
  ).toBeVisible();
  await page.getByLabel("Filter type").selectOption("");
  await page.getByRole("button", { name: "Apply filters" }).click();
  page.once("dialog", (dialog) => dialog.accept());
  await page.getByRole("button", { name: "Delete Weekly shop" }).click();
  await expect(
    page.getByRole("heading", { name: "No transactions found" }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
});
test("transactions retry failures and show sign-in for expired sessions", async ({
  page,
}) => {
  let status = 503;
  await page.route("**/api/finance/accounts", (route) =>
    route.fulfill({ json: [] }),
  );
  await page.route("**/api/finance/categories", (route) =>
    route.fulfill({ json: [] }),
  );
  await page.route("**/api/finance/transactions**", (route) =>
    route.fulfill({
      status,
      json: { error: status === 401 ? "Sign in" : "Temporarily unavailable" },
    }),
  );
  await page.goto("/transactions");
  await expect(page.getByRole("main").getByRole("alert")).toContainText(
    "Temporarily unavailable",
  );
  status = 401;
  await page.getByRole("button", { name: "Try again" }).click();
  await expect(
    page.getByRole("main").getByRole("link", { name: "Sign in", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Add transaction", exact: true }),
  ).toHaveCount(0);
});
