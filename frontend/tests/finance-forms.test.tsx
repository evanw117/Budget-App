import { expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AccountForm } from "@/components/accounts/account-form";
import { CategoryForm } from "@/components/categories/category-form";
import { apiRequest } from "@/lib/api/client";

it("sends opening balances as exact strings and normalizes currency", async () => {
  const save = vi.fn().mockResolvedValue(undefined);
  render(<AccountForm onSave={save} onCancel={() => {}} />);
  await userEvent.type(screen.getByLabelText("Account name"), "Savings");
  await userEvent.clear(screen.getByLabelText("Currency code"));
  await userEvent.type(screen.getByLabelText("Currency code"), "eur");
  await userEvent.clear(screen.getByLabelText("Opening / manual balance"));
  await userEvent.type(
    screen.getByLabelText("Opening / manual balance"),
    "123456789012345.6789",
  );
  await userEvent.click(screen.getByRole("button", { name: "Save account" }));
  expect(save).toHaveBeenCalledWith({
    name: "Savings",
    currency: "EUR",
    accountType: "CHECKING",
    openingBalance: "123456789012345.6789",
  });
});
it("shows duplicate errors without losing entered category fields", async () => {
  const save = vi
    .fn()
    .mockRejectedValue(new Error("This category already exists."));
  render(<CategoryForm onSave={save} onCancel={() => {}} />);
  await userEvent.type(screen.getByLabelText("Category name"), "Housing");
  await userEvent.click(screen.getByRole("button", { name: "Save category" }));
  expect(await screen.findByRole("alert")).toHaveTextContent("already exists");
  expect(screen.getByLabelText("Category name")).toHaveValue("Housing");
});
it("handles 204 responses without attempting JSON parsing", async () => {
  const fetchMock = vi
    .spyOn(globalThis, "fetch")
    .mockResolvedValue(new Response(null, { status: 204 }));
  await expect(
    apiRequest<void>("/api/finance/accounts/test", { method: "DELETE" }),
  ).resolves.toBeUndefined();
  fetchMock.mockRestore();
});
