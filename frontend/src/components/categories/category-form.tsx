"use client";
import { useState, type FormEvent } from "react";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { ErrorState } from "@/components/ui/states";
import type { Category, CategoryInput, CategoryType } from "@/types/finance";
export function CategoryForm({
  category,
  onSave,
  onCancel,
}: {
  category?: Category;
  onSave: (input: CategoryInput) => Promise<void>;
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
      setError("Enter a category name.");
      return;
    }
    setBusy(true);
    try {
      await onSave({ name, type: String(form.get("type")) as CategoryType });
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Could not save this category.",
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <form
      onSubmit={submit}
      aria-label={category ? "Edit category" : "Add category"}
      className="space-y-5"
    >
      <h2 className="text-lg font-semibold">
        {category ? "Edit category" : "Add a category"}
      </h2>
      {error && <ErrorState message={error} />}
      <fieldset disabled={busy} className="space-y-5 disabled:opacity-70">
        <Input
          label="Category name"
          id="category-name"
          name="name"
          required
          maxLength={100}
          defaultValue={category?.name}
        />
        <Select
          label="Category type"
          id="category-type"
          name="type"
          defaultValue={category?.type ?? "EXPENSE"}
          required
        >
          <option value="EXPENSE">Expense</option>
          <option value="INCOME">Income</option>
        </Select>
        <p className="text-xs leading-5 text-muted">
          Each name must be unique within its type, including archived
          categories. Your defaults are personal copies you can rename or
          archive.
        </p>
        <div className="flex flex-wrap gap-3">
          <Button type="submit">{busy ? "Saving..." : "Save category"}</Button>
          <Button variant="secondary" onClick={onCancel}>
            Cancel
          </Button>
        </div>
      </fieldset>
    </form>
  );
}
