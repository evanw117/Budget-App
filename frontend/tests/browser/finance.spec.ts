import { expect, test } from "@playwright/test";
test("accounts add, edit, archive and restore without mixing currencies", async ({
  page,
}) => {
  type Row = {
    id: string;
    name: string;
    currency: string;
    openingBalance: string;
    currentBalance: string;
    accountType: string;
    active: boolean;
  };
  let rows: Row[] = [];
  await page.route("**/api/finance/accounts**", async (route) => {
    const method = route.request().method();
    const body =
      method === "POST" || method === "PATCH"
        ? route.request().postDataJSON()
        : {};
    if (method === "POST") {
      const row = {
        ...body,
        id: "11111111-1111-4111-8111-111111111111",
        active: true,
        currentBalance: body.openingBalance,
      };
      rows = [row];
      return route.fulfill({ status: 201, json: row });
    }
    if (method === "PATCH") {
      rows = rows.map((row) => ({ ...row, ...body }));
      return route.fulfill({ json: rows[0] });
    }
    if (method === "DELETE") {
      rows = rows.map((row) => ({ ...row, active: false }));
      return route.fulfill({ status: 204 });
    }
    return route.fulfill({ json: rows });
  });
  await page.goto("/accounts");
  await expect(
    page.getByRole("heading", { name: "Start with your first account" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Add account", exact: true }).click();
  await page.getByLabel("Account name").fill("Euro savings");
  await page.getByLabel("Account type").selectOption("SAVINGS");
  await page.getByLabel("Currency code").fill("EUR");
  await page.getByLabel("Opening / manual balance").fill("123.4567");
  await page.getByRole("button", { name: "Save account", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Euro savings" }),
  ).toBeVisible();
  await expect(page.getByText("123.4567 EUR", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Edit Euro savings" }).click();
  await page.getByLabel("Account name").fill("Travel fund");
  await page.getByRole("button", { name: "Save account", exact: true }).click();
  page.once("dialog", (dialog) => dialog.accept());
  await page.getByRole("button", { name: "Archive Travel fund" }).click();
  await expect(
    page.getByRole("heading", { name: "No active accounts" }),
  ).toBeVisible();
  await page.getByLabel("Show archived").check();
  await page.getByRole("button", { name: "Restore Travel fund" }).click();
  await expect(page.getByText("Active", { exact: true })).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
});
test("category duplicate errors keep the form usable", async ({ page }) => {
  await page.route("**/api/finance/categories**", (route) =>
    route.request().method() === "POST"
      ? route.fulfill({
          status: 409,
          json: {
            error:
              "This name and type already exist. Check archived categories.",
          },
        })
      : route.fulfill({
          json: [
            {
              id: "22222222-2222-4222-8222-222222222222",
              name: "Moving / Relocation",
              type: "EXPENSE",
              active: true,
              defaultCategory: true,
            },
          ],
        }),
  );
  await page.goto("/categories");
  await expect(
    page.getByRole("heading", { name: "Moving / Relocation" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Add category", exact: true }).click();
  await page.getByLabel("Category name").fill("Moving / Relocation");
  await page
    .getByRole("button", { name: "Save category", exact: true })
    .click();
  await expect(page.getByRole("main").getByRole("alert")).toContainText(
    "already exist",
  );
  await expect(page.getByLabel("Category name")).toHaveValue(
    "Moving / Relocation",
  );
});
test("financial pages handle missing sessions and retry server errors", async ({
  page,
}) => {
  let retry = false;
  await page.route("**/api/finance/accounts**", (route) =>
    route.fulfill({
      status: retry ? 200 : 503,
      json: retry ? [] : { error: "Temporarily unavailable" },
    }),
  );
  await page.goto("/accounts");
  await expect(page.getByRole("main").getByRole("alert")).toContainText(
    "Temporarily unavailable",
  );
  retry = true;
  await page.getByRole("button", { name: "Try again" }).click();
  await expect(
    page.getByRole("heading", { name: "Start with your first account" }),
  ).toBeVisible();
  await page.route("**/api/finance/categories**", (route) =>
    route.fulfill({ status: 401, json: { error: "Sign in" } }),
  );
  await page.goto("/categories");
  await expect(
    page.getByRole("link", { name: "Sign in", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Add category", exact: true }),
  ).toHaveCount(0);
});
