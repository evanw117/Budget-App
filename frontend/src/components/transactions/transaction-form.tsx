"use client";
import { useState, type FormEvent } from "react";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { ErrorState } from "@/components/ui/states";
import type { Account, Category, CategoryType } from "@/types/finance";
import type { Transaction, TransactionInput } from "@/types/transaction";

export function TransactionForm({
  transaction,
  accounts,
  categories,
  onSave,
  onCancel,
}: {
  transaction?: Transaction;
  accounts: Account[];
  categories: Category[];
  onSave: (input: TransactionInput) => Promise<void>;
  onCancel: () => void;
}) {
  const [type, setType] = useState<CategoryType>(
    transaction?.type ?? "EXPENSE",
  );
  const [accountId, setAccountId] = useState(transaction?.accountId ?? "");
  const [categoryId, setCategoryId] = useState(transaction?.categoryId ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const currency = accounts.find(
    (account) => account.id === accountId,
  )?.currency;
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    setError("");
    setBusy(true);
    try {
      await onSave({
        accountId,
        categoryId,
        type,
        amount: String(data.get("amount")).trim(),
        date: String(data.get("date")),
        description: String(data.get("description")).trim(),
      });
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Could not save this transaction.",
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <form
      onSubmit={submit}
      aria-label={transaction ? "Edit transaction" : "Add transaction"}
      className="space-y-5"
    >
      <h2 className="text-lg font-semibold">
        {transaction ? "Edit transaction" : "Add a transaction"}
      </h2>
      <p className="text-sm text-muted">
        Record completed income or spending. The amount uses the selected
        account&apos;s currency. Transfers are not supported yet.
      </p>
      {error && <ErrorState message={error} />}
      <fieldset disabled={busy} className="space-y-5 disabled:opacity-70">
        <div className="grid gap-5 sm:grid-cols-2">
          <Select
            label="Transaction type"
            id="transaction-type"
            value={type}
            onChange={(event) => {
              setType(event.target.value as CategoryType);
              setCategoryId("");
            }}
          >
            <option value="EXPENSE">Expense</option>
            <option value="INCOME">Income</option>
          </Select>
          <Select
            label="Account"
            id="transaction-account"
            value={accountId}
            required
            onChange={(event) => setAccountId(event.target.value)}
          >
            <option value="">Choose an account</option>
            {accounts
              .filter((a) => a.active || a.id === transaction?.accountId)
              .map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name} ({a.currency}){!a.active ? " — archived" : ""}
                </option>
              ))}
          </Select>
          <Select
            label="Category"
            id="transaction-category"
            value={categoryId}
            required
            onChange={(event) => setCategoryId(event.target.value)}
          >
            <option value="">Choose a category</option>
            {categories
              .filter(
                (c) =>
                  c.type === type &&
                  (c.active || c.id === transaction?.categoryId),
              )
              .map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                  {!c.active ? " — archived" : ""}
                </option>
              ))}
          </Select>
          <Input
            label={currency ? `Amount (${currency})` : "Amount"}
            id="transaction-amount"
            name="amount"
            inputMode="decimal"
            required
            pattern="[0-9]{1,15}([.][0-9]{1,4})?"
            defaultValue={transaction?.amount}
            hint="Positive amount, up to 4 decimal places. The server validates the amount."
          />
          <Input
            label="Transaction date"
            id="transaction-date"
            name="date"
            type="date"
            required
            defaultValue={
              transaction?.date ?? new Date().toISOString().slice(0, 10)
            }
            hint="Today or earlier (server date)."
          />
        </div>
        <Input
          label="Description (optional)"
          id="transaction-description"
          name="description"
          maxLength={500}
          defaultValue={transaction?.description}
        />
        <div className="flex flex-wrap gap-3">
          <Button type="submit">
            {busy ? "Saving..." : "Save transaction"}
          </Button>
          <Button variant="secondary" onClick={onCancel}>
            Cancel
          </Button>
        </div>
      </fieldset>
    </form>
  );
}
