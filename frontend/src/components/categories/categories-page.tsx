"use client";
import Link from "next/link";
import { useState } from "react";
import { Plus } from "lucide-react";
import { categoryService } from "@/lib/services/finance";
import { useResource } from "@/components/finance/use-resource";
import {
  SignInState,
  ResourceError,
} from "@/components/finance/resource-status";
import { CategoryForm } from "./category-form";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EmptyState, LoadingState } from "@/components/ui/states";
import { typeLabel, type Category, type CategoryInput } from "@/types/finance";
export function CategoriesPage() {
  const state = useResource(categoryService.list);
  const [editing, setEditing] = useState<Category | "new" | null>(null);
  const [showArchived, setShowArchived] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [notice, setNotice] = useState("");
  async function save(input: CategoryInput) {
    try {
      const result =
        editing && editing !== "new"
          ? await categoryService.update(editing.id, input)
          : await categoryService.create(input);
      state.setItems((items) =>
        items.some((item) => item.id === result.id)
          ? items.map((item) => (item.id === result.id ? result : item))
          : [...items, result],
      );
      setEditing(null);
      state.setError("");
      setNotice("Category saved.");
    } catch (cause) {
      state.handleError(cause);
      throw cause;
    }
  }
  async function toggle(category: Category) {
    if (
      category.active &&
      !window.confirm(`Archive ${category.name}? You can restore it later.`)
    )
      return;
    setBusyId(category.id);
    setNotice("");
    try {
      const result = category.active
        ? (await categoryService.archive(category.id),
          { ...category, active: false })
        : await categoryService.update(category.id, { active: true });
      state.setItems((items) =>
        items.map((item) => (item.id === result.id ? result : item)),
      );
      state.setError("");
      setNotice(
        category.active
          ? "Category archived. You can restore it using Show archived."
          : "Category restored.",
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
          <h1 className="text-3xl font-semibold tracking-tight">Categories</h1>
          <p className="mt-3 max-w-xl text-sm leading-6 text-muted">
            Your personal labels for future income and expenses, including the
            cost of moving. Start with your defaults, then make them your own.
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
            Add category
          </Button>
        )}
      </div>
      <Link
        href="/accounts"
        className="inline-block text-sm font-medium text-accent underline underline-offset-4"
      >
        Manage accounts
      </Link>
      {state.loading ? (
        <LoadingState label="Loading your categories..." />
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
            <Card className="max-w-xl p-5 sm:p-7">
              <CategoryForm
                key={editing === "new" ? "new" : editing.id}
                category={editing === "new" ? undefined : editing}
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
                title="No active categories"
                description="Add a category or show archived categories to restore one."
              />
            </Card>
          ) : (
            <div className="grid items-start gap-6 xl:grid-cols-2">
              {(["INCOME", "EXPENSE"] as const).map((type) => (
                <Card key={type} className="p-5">
                  <h2 className="mb-3 text-lg font-semibold">
                    {typeLabel(type)}
                  </h2>
                  <ul className="divide-y divide-line">
                    {visible
                      .filter((item) => item.type === type)
                      .map((category) => (
                        <li
                          key={category.id}
                          className="flex flex-wrap items-center justify-between gap-3 py-4"
                        >
                          <div className="min-w-0">
                            <h3 className="break-words text-sm font-semibold">
                              {category.name}
                            </h3>
                            <p className="mt-1 text-xs text-muted">
                              {category.defaultCategory
                                ? "Personal default"
                                : "Custom"}{" "}
                              · {category.active ? "Active" : "Archived"}
                            </p>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              variant="secondary"
                              disabled={busyId !== null || editing !== null}
                              onClick={() => {
                                setEditing(category);
                                setNotice("");
                              }}
                            >
                              Edit
                              <span className="sr-only"> {category.name}</span>
                            </Button>
                            <Button
                              variant="secondary"
                              disabled={busyId !== null || editing !== null}
                              onClick={() => toggle(category)}
                            >
                              {busyId === category.id
                                ? "Saving..."
                                : category.active
                                  ? "Archive"
                                  : "Restore"}
                              <span className="sr-only"> {category.name}</span>
                            </Button>
                          </div>
                        </li>
                      ))}
                  </ul>
                  {!visible.some((item) => item.type === type) && (
                    <p className="py-5 text-sm text-muted">
                      No {type.toLowerCase()} categories to show.
                    </p>
                  )}
                </Card>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
