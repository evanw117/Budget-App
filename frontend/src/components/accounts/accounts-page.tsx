"use client";
import Link from "next/link";
import { useState } from "react";
import { Wallet, Plus } from "lucide-react";
import { accountService } from "@/lib/services/finance";
import { useResource } from "@/components/finance/use-resource";
import {
  SignInState,
  ResourceError,
} from "@/components/finance/resource-status";
import { AccountForm } from "./account-form";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EmptyState, LoadingState } from "@/components/ui/states";
import { typeLabel, type Account, type AccountInput } from "@/types/finance";
export function AccountsPage() {
  const state = useResource(accountService.list);
  const [editing, setEditing] = useState<Account | "new" | null>(null);
  const [showArchived, setShowArchived] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [notice, setNotice] = useState("");
  async function save(input: AccountInput) {
    try {
      const result =
        editing && editing !== "new"
          ? await accountService.update(editing.id, input)
          : await accountService.create(input);
      state.setItems((items) =>
        items.some((item) => item.id === result.id)
          ? items.map((item) => (item.id === result.id ? result : item))
          : [...items, result],
      );
      setEditing(null);
      state.setError("");
      setNotice("Account saved.");
    } catch (cause) {
      state.handleError(cause);
      throw cause;
    }
  }
  async function toggle(account: Account) {
    if (
      account.active &&
      !window.confirm(
        `Archive ${account.name}? Its opening balance and record will be kept.`,
      )
    )
      return;
    setBusyId(account.id);
    setNotice("");
    try {
      const result = account.active
        ? (await accountService.archive(account.id),
          { ...account, active: false })
        : await accountService.update(account.id, { active: true });
      state.setItems((items) =>
        items.map((item) => (item.id === result.id ? result : item)),
      );
      state.setError("");
      setNotice(
        account.active
          ? "Account archived. You can restore it using Show archived."
          : "Account restored.",
      );
    } catch (cause) {
      state.handleError(cause);
    } finally {
      setBusyId(null);
    }
  }
  const visible = state.items.filter((item) => showArchived || item.active);
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Accounts</h1>
          <p className="mt-3 max-w-xl text-sm leading-6 text-muted">
            Your accounts, in their own currencies. Balances are calculated from
            opening balances plus recorded income minus expenses.
          </p>
        </div>
        {!state.loading && !state.unauthorized && !editing && (
          <Button
            onClick={() => {
              setEditing("new");
              setNotice("");
            }}
          >
            <Plus aria-hidden="true" className="size-4" />
            Add account
          </Button>
        )}
      </div>
      <Link
        href="/"
        className="inline-block text-sm font-medium text-accent underline underline-offset-4"
      >
        Back to dashboard
      </Link>
      {state.loading ? (
        <LoadingState label="Loading your accounts..." />
      ) : state.unauthorized ? (
        <SignInState />
      ) : (
        <>
          {notice && (
            <p
              role="status"
              className="rounded-lg bg-[#e7f2ed] p-3 text-sm text-accent"
            >
              {notice}
            </p>
          )}
          {state.error && !editing && (
            <ResourceError message={state.error} retry={state.refresh} />
          )}
          {editing && (
            <Card className="max-w-2xl p-5 sm:p-7">
              <AccountForm
                key={editing === "new" ? "new" : editing.id}
                account={editing === "new" ? undefined : editing}
                onSave={save}
                onCancel={() => {
                  setEditing(null);
                  state.setError("");
                }}
              />
            </Card>
          )}
          <label className="flex min-h-11 items-center gap-3 text-sm text-muted">
            <input
              type="checkbox"
              checked={showArchived}
              onChange={(event) => setShowArchived(event.target.checked)}
              className="size-4 accent-accent"
            />
            Show archived
          </label>
          {!state.error && visible.length === 0 ? (
            <Card>
              <EmptyState
                title={
                  state.items.length
                    ? "No active accounts"
                    : "Start with your first account"
                }
                description="Add a checking account, savings, cash, or another balance. Accounts are private to you; no currencies are combined."
              />
            </Card>
          ) : (
            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {visible.map((account) => (
                <Card key={account.id} className="min-w-0 p-5">
                  <div className="flex items-start gap-3">
                    <Wallet
                      aria-hidden="true"
                      className="mt-1 size-5 shrink-0 text-accent"
                    />
                    <div className="min-w-0">
                      <h2 className="break-words text-lg font-semibold">
                        {account.name}
                      </h2>
                      <p className="mt-1 text-sm text-muted">
                        {typeLabel(account.accountType)} · {account.currency}
                      </p>
                    </div>
                    <span className="ml-auto shrink-0 rounded-md bg-slate-100 px-2 py-1 text-xs text-muted">
                      {account.active ? "Active" : "Archived"}
                    </span>
                  </div>
                  <p className="mt-6 text-xs text-muted">Current balance</p>
                  <p className="mt-2 break-all text-2xl font-semibold tabular-nums">
                    {account.currentBalance}{" "}
                    <span className="text-sm font-medium text-muted">
                      {account.currency}
                    </span>
                  </p>
                  <div className="mt-5 flex flex-wrap gap-2">
                    <Button
                      variant="secondary"
                      disabled={busyId !== null || editing !== null}
                      onClick={() => {
                        setEditing(account);
                        setNotice("");
                      }}
                    >
                      Edit<span className="sr-only"> {account.name}</span>
                    </Button>
                    <Button
                      variant="secondary"
                      disabled={busyId !== null || editing !== null}
                      onClick={() => toggle(account)}
                    >
                      {busyId === account.id
                        ? "Saving..."
                        : account.active
                          ? "Archive"
                          : "Restore"}
                      <span className="sr-only"> {account.name}</span>
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
