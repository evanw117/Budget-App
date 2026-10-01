import { expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { TransactionForm } from "@/components/transactions/transaction-form";
import type { Account, Category } from "@/types/finance";
const accounts: Account[] = [
  {
    id: "a",
    name: "Euro",
    currency: "EUR",
    accountType: "CASH",
    openingBalance: "0",
    currentBalance: "0",
    active: true,
    createdAt: "",
    updatedAt: "",
  },
];
const categories: Category[] = [
  {
    id: "e",
    name: "Food",
    type: "EXPENSE",
    active: true,
    defaultCategory: false,
    createdAt: "",
    updatedAt: "",
  },
  {
    id: "i",
    name: "Salary",
    type: "INCOME",
    active: true,
    defaultCategory: false,
    createdAt: "",
    updatedAt: "",
  },
  {
    id: "old",
    name: "Archived",
    type: "EXPENSE",
    active: false,
    defaultCategory: false,
    createdAt: "",
    updatedAt: "",
  },
];
it("keeps large decimal amounts exact and only offers matching active categories", async () => {
  const save = vi.fn().mockResolvedValue(undefined);
  render(
    <TransactionForm
      accounts={accounts}
      categories={categories}
      onSave={save}
      onCancel={() => {}}
    />,
  );
  expect(
    screen.queryByRole("option", { name: "Salary" }),
  ).not.toBeInTheDocument();
  expect(
    screen.queryByRole("option", { name: "Archived" }),
  ).not.toBeInTheDocument();
  await userEvent.selectOptions(screen.getByLabelText("Account"), "a");
  await userEvent.selectOptions(screen.getByLabelText("Category"), "e");
  await userEvent.type(
    screen.getByLabelText("Amount (EUR)"),
    "123456789012345.6789",
  );
  await userEvent.click(
    screen.getByRole("button", { name: "Save transaction" }),
  );
  expect(save).toHaveBeenCalledWith(
    expect.objectContaining({
      accountId: "a",
      categoryId: "e",
      type: "EXPENSE",
      amount: "123456789012345.6789",
    }),
  );
});
it("resets category when type changes and preserves fields after a failed save", async () => {
  const save = vi.fn().mockRejectedValue(new Error("Please try again."));
  render(
    <TransactionForm
      accounts={accounts}
      categories={categories}
      onSave={save}
      onCancel={() => {}}
    />,
  );
  await userEvent.selectOptions(screen.getByLabelText("Category"), "e");
  await userEvent.selectOptions(
    screen.getByLabelText("Transaction type"),
    "INCOME",
  );
  expect(screen.getByLabelText("Category")).toHaveValue("");
  expect(
    screen.queryByRole("option", { name: "Food" }),
  ).not.toBeInTheDocument();
  await userEvent.selectOptions(screen.getByLabelText("Category"), "i");
  await userEvent.selectOptions(screen.getByLabelText("Account"), "a");
  await userEvent.type(screen.getByLabelText("Amount (EUR)"), "20.1234");
  await userEvent.click(
    screen.getByRole("button", { name: "Save transaction" }),
  );
  expect(await screen.findByRole("alert")).toHaveTextContent(
    "Please try again.",
  );
  expect(screen.getByLabelText("Amount (EUR)")).toHaveValue("20.1234");
});
