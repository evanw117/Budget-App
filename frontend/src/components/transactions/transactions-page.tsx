"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { accountService, categoryService } from "@/lib/services/finance";
import { transactionService } from "@/lib/services/transactions";
import { ApiError } from "@/lib/api/client";
import { TransactionForm } from "./transaction-form";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { EmptyState, LoadingState } from "@/components/ui/states";
import {
  ResourceError,
  SignInState,
} from "@/components/finance/resource-status";
import type { Account, Category } from "@/types/finance";
import type {
  Transaction,
  TransactionPage,
  TransactionFilters,
  TransactionInput,
} from "@/types/transaction";

const emptyFilters: TransactionFilters = {
  accountId: "",
  type: "",
  from: "",
  to: "",
};
export function TransactionsPage() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [result, setResult] = useState<TransactionPage | null>(null);
  const [filters, setFilters] = useState(emptyFilters);
  const [page, setPage] = useState(0);
  const [revision, setRevision] = useState(0);
  const [loading, setLoading] = useState(true);
  const [unauthorized, setUnauthorized] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [editing, setEditing] = useState<Transaction | "new" | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    Promise.all([
      accountService.list(controller.signal),
      categoryService.list(controller.signal),
      transactionService.list(filters, page, controller.signal),
    ])
      .then(([a, c, data]) => {
        if (controller.signal.aborted) return;
        setAccounts(a);
        setCategories(c);
        setResult(data);
        setError("");
        setUnauthorized(false);
        setLoading(false);
      })
      .catch((cause) => {
        if (controller.signal.aborted) return;
        setResult(null);
        setLoading(false);
        if (cause instanceof ApiError && cause.status === 401) {
          setUnauthorized(true);
          setAccounts([]);
          setCategories([]);
          setEditing(null);
        } else
          setError(
            cause instanceof Error
              ? cause.message
              : "Could not load transactions.",
          );
      });
    return () => controller.abort();
  }, [filters, page, revision]);

  function refresh() {
    setLoading(true);
    setError("");
    setRevision((value) => value + 1);
  }
  function handleError(cause: unknown) {
    if (cause instanceof ApiError && cause.status === 401) {
      setUnauthorized(true);
      setResult(null);
      setAccounts([]);
      setCategories([]);
      setEditing(null);
    } else
      setError(
        cause instanceof Error ? cause.message : "Something went wrong.",
      );
  }
  async function save(input: TransactionInput) {
    try {
      if (editing && editing !== "new")
        await transactionService.update(editing.id, input);
      else await transactionService.create(input);
      setEditing(null);
      setNotice("Transaction saved. Account balances have been updated.");
      setPage(0);
      refresh();
    } catch (cause) {
      handleError(cause);
      throw cause;
    }
  }
  async function remove(item: Transaction) {
    if (
      !window.confirm(
        "Delete this transaction? This permanently removes it and updates the account balance.",
      )
    )
      return;
    setDeleting(true);
    setNotice("");
    try {
      await transactionService.delete(item.id);
      setNotice("Transaction deleted. Account balance updated.");
      setPage(0);
      refresh();
    } catch (cause) {
      handleError(cause);
    } finally {
      setDeleting(false);
    }
  }
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">
            Transactions
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-muted">
            Your recorded income and expenses. Amounts stay in their account
            currency; no currencies are combined.
          </p>
        </div>
        {!loading && !unauthorized && !error && !editing && (
          <Button
            disabled={
              deleting ||
              !accounts.some((a) => a.active) ||
              !categories.some((c) => c.active)
            }
            onClick={() => {
              setEditing("new");
              setNotice("");
            }}
          >
            Add transaction
          </Button>
        )}
      </div>
      <Link
        href="/accounts"
        className="inline-block text-sm font-medium text-accent underline underline-offset-4"
      >
        View accounts and balances
      </Link>
      {unauthorized ? (
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
          {editing && (
            <Card className="max-w-3xl p-5 sm:p-7">
              <TransactionForm
                key={editing === "new" ? "new" : editing.id}
                transaction={editing === "new" ? undefined : editing}
                accounts={accounts}
                categories={categories}
                onSave={save}
                onCancel={() => {
                  setEditing(null);
                  setError("");
                }}
              />
            </Card>
          )}
          {!editing && (
            <form
              aria-label="Filter transactions"
              className="grid items-end gap-4 rounded-xl border border-line bg-white p-5 sm:grid-cols-2 xl:grid-cols-5"
              onSubmit={(event) => {
                event.preventDefault();
                const data = new FormData(event.currentTarget);
                setFilters({
                  accountId: String(data.get("accountId")),
                  type: String(data.get("type")),
                  from: String(data.get("from")),
                  to: String(data.get("to")),
                });
                setPage(0);
                setLoading(true);
                setError("");
                setNotice("");
              }}
            >
              <Select
                label="Filter account"
                id="filter-account"
                name="accountId"
                defaultValue={filters.accountId}
              >
                <option value="">All accounts</option>
                {accounts.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name} ({a.currency}){!a.active ? " — archived" : ""}
                  </option>
                ))}
              </Select>
              <Select
                label="Filter type"
                id="filter-type"
                name="type"
                defaultValue={filters.type}
              >
                <option value="">All types</option>
                <option value="INCOME">Income</option>
                <option value="EXPENSE">Expense</option>
              </Select>
              <Input
                label="From date"
                id="filter-from"
                name="from"
                type="date"
                defaultValue={filters.from}
              />
              <Input
                label="To date"
                id="filter-to"
                name="to"
                type="date"
                defaultValue={filters.to}
              />
              <Button type="submit" disabled={loading || deleting}>
                Apply filters
              </Button>
            </form>
          )}
          {loading ? (
            <LoadingState label="Loading your transactions..." />
          ) : error && !editing ? (
            <ResourceError message={error} retry={refresh} />
          ) : (
            !editing &&
            result && (
              <>
                {!accounts.some((a) => a.active) && (
                  <p className="text-sm text-muted">
                    Create or restore an account before adding transactions.
                  </p>
                )}
                {!categories.some((c) => c.active) && (
                  <p className="text-sm text-muted">
                    Create or restore a{" "}
                    <Link href="/categories" className="underline">
                      category
                    </Link>{" "}
                    before adding transactions.
                  </p>
                )}
                {result.items.length === 0 ? (
                  <Card>
                    <EmptyState
                      title="No transactions found"
                      description="Add your first income or expense, or adjust your filters."
                    />
                  </Card>
                ) : (
                  <div className="space-y-3">
                    {result.items.map((item) => (
                      <Card
                        key={item.id}
                        className="flex min-w-0 flex-wrap items-start justify-between gap-4 p-5"
                      >
                        <div className="min-w-0 flex-1">
                          <h2 className="break-words font-semibold">
                            {item.description || item.categoryName}
                          </h2>
                          <p className="mt-2 break-words text-sm text-muted">
                            {item.date} · {item.accountName} ·{" "}
                            {item.categoryName}
                          </p>
                          <p className="mt-2 text-xs text-muted">
                            {item.type === "INCOME" ? "Income" : "Expense"}
                          </p>
                        </div>
                        <div className="min-w-0 text-right">
                          <p
                            className={`break-all font-semibold tabular-nums ${item.type === "INCOME" ? "text-accent" : "text-ink"}`}
                          >
                            {item.type === "INCOME" ? "+" : "−"}
                            {item.amount} {item.currency}
                          </p>
                          <div className="mt-3 flex flex-wrap gap-2">
                            <Button
                              variant="secondary"
                              disabled={deleting}
                              onClick={() => {
                                setEditing(item);
                                setNotice("");
                                setError("");
                              }}
                            >
                              Edit
                              <span className="sr-only">
                                {" "}
                                {item.description || item.categoryName}
                              </span>
                            </Button>
                            <Button
                              variant="secondary"
                              disabled={deleting}
                              onClick={() => remove(item)}
                            >
                              Delete
                              <span className="sr-only">
                                {" "}
                                {item.description || item.categoryName}
                              </span>
                            </Button>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
                <div
                  className="flex flex-wrap items-center justify-between gap-3"
                  aria-label="Pagination"
                >
                  <p className="text-sm text-muted">
                    {result.totalElements} transactions · Page {result.page + 1}{" "}
                    of {Math.max(1, result.totalPages)}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="secondary"
                      disabled={page === 0 || deleting}
                      onClick={() => {
                        setPage(page - 1);
                        setLoading(true);
                      }}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="secondary"
                      disabled={page + 1 >= result.totalPages || deleting}
                      onClick={() => {
                        setPage(page + 1);
                        setLoading(true);
                      }}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              </>
            )
          )}
        </>
      )}
    </div>
  );
}
