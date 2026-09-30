import { test, expect } from "@playwright/test";
test("dashboard and placeholder navigation work without horizontal overflow", async ({
  page,
  isMobile,
}) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toContainText(
    "A clearer picture",
  );
  await expect(page.getByText(/Sample data/)).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  if (isMobile)
    await page.getByRole("button", { name: "Open navigation" }).click();
  await page
    .getByRole("link", { name: "Accounts", exact: true })
    .filter({ visible: true })
    .click();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Accounts");
  if (isMobile) await expect(page.getByRole("dialog")).not.toBeVisible();
  await page.getByRole("link", { name: "Back to dashboard" }).click();
  await expect(page.getByRole("heading", { level: 1 })).toContainText(
    "A clearer picture",
  );
});
test("registration form has labelled inputs and native password validation", async ({
  page,
}) => {
  await page.goto("/register");
  await page.getByLabel("Display name").fill("Alice");
  await page.getByLabel("Email address").fill("alice@example.com");
  await page.getByLabel("Password", { exact: true }).fill("short");
  await page
    .getByRole("button", { name: "Create account", exact: true })
    .click();
  expect(
    await page
      .getByLabel("Password", { exact: true })
      .evaluate((element: HTMLInputElement) => element.validity.tooShort),
  ).toBe(true);
});

test("sign-in and sign-out update the account screen", async ({ page }) => {
  let signedIn = false;
  await page.route("**/api/auth/me", (route) =>
    route.fulfill({
      status: signedIn ? 200 : 401,
      contentType: "application/json",
      body: JSON.stringify(
        signedIn
          ? {
              id: "demo-user",
              email: "alice@example.com",
              displayName: "Alice",
              role: "ROLE_USER",
            }
          : { error: "Sign in" },
      ),
    }),
  );
  await page.route("**/api/auth/login", (route) => {
    signedIn = true;
    return route.fulfill({ json: { authenticated: true } });
  });
  await page.route("**/api/auth/logout", (route) => {
    signedIn = false;
    return route.fulfill({ json: { authenticated: false } });
  });
  await page.goto("/login");
  await page.getByLabel("Email address").fill("alice@example.com");
  await page
    .getByLabel("Password", { exact: true })
    .fill("a-long-test-password");
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Welcome, Alice" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Sign out" }).click();
  await expect(
    page.getByRole("heading", { name: "Welcome back" }),
  ).toBeVisible();
});
