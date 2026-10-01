import type { SelectHTMLAttributes } from "react";
export function Select({
  label,
  id,
  children,
  ...props
}: SelectHTMLAttributes<HTMLSelectElement> & { label: string; id: string }) {
  return (
    <div className="space-y-2">
      <label htmlFor={id} className="block text-sm font-semibold">
        {label}
      </label>
      <select
        id={id}
        className="min-h-11 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-base"
        {...props}
      >
        {children}
      </select>
    </div>
  );
}
