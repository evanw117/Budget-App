"use client";
import { useState, type FormEvent } from "react";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { ErrorState } from "@/components/ui/states";
import {
  accountTypes,
  typeLabel,
  type Account,
  type AccountInput,
  type AccountType,
} from "@/types/finance";
export function AccountForm({
  account,
  onSave,
  onCancel,
}: {
  account?: Account;
  onSave: (input: AccountInput) => Promise<void>;
  onCancel: () => void;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    const form = new FormData(event.currentTarget);
    const name = String(form.get("name")).trim();
    if (!name) {
      setError("Enter an account name.");
      return;
    }
    const input: AccountInput = {
      name,
      accountType: String(form.get("accountType")) as AccountType,
      currency: String(form.get("currency")).trim().toUpperCase(),
      openingBalance: String(form.get("openingBalance")).trim(),
    };
    setBusy(true);
    try {
      await onSave(input);
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Could not save this account.",
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <form
      onSubmit={submit}
      className="space-y-5"
      aria-label={account ? "Edit account" : "Add account"}
    >
      <h2 className="text-lg font-semibold">
        {account ? "Edit account" : "Add an account"}
      </h2>
      {error && <ErrorState message={error} />}
      <fieldset disabled={busy} className="space-y-5 disabled:opacity-70">
        <Input
          label="Account name"
          id="account-name"
          name="name"
          required
          maxLength={100}
          defaultValue={account?.name}
          placeholder="Everyday checking"
        />
        <div className="grid gap-5 sm:grid-cols-2">
          <Select
            label="Account type"
            id="account-type"
            name="accountType"
            defaultValue={account?.accountType ?? "CHECKING"}
            required
          >
            {accountTypes.map((type) => (
              <option key={type} value={type}>
                {typeLabel(type)}
              </option>
            ))}
          </Select>
          <Input
            label="Currency code"
            id="account-currency"
            name="currency"
            required
            pattern="[A-Za-z]{3}"
            minLength={3}
            maxLength={3}
            defaultValue={account?.currency ?? "USD"}
            hint="Three letters, for example USD, GBP, or EUR."
          />
        </div>
        <Input
          label="Opening / manual balance"
          id="opening-balance"
          name="openingBalance"
          type="text"
          inputMode="decimal"
          required
          pattern="-?[0-9]{1,15}([.][0-9]{1,4})?"
          defaultValue={account?.openingBalance ?? "0.00"}
          hint="Use a decimal point and up to 4 decimal places. Negative balances are allowed. Changing this adjusts your current balance. Currency cannot change while transactions exist."
        />
        <div className="flex flex-wrap gap-3">
          <Button type="submit">{busy ? "Saving..." : "Save account"}</Button>
          <Button variant="secondary" onClick={onCancel}>
            Cancel
          </Button>
        </div>
      </fieldset>
    </form>
  );
}
