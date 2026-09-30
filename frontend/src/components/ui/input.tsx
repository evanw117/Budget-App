import type { InputHTMLAttributes } from "react";
export function Input({
  label,
  id,
  hint,
  error,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  id: string;
  hint?: string;
  error?: string;
}) {
  return (
    <div className="space-y-2">
      <label htmlFor={id} className="block text-sm font-semibold">
        {label}
      </label>
      <input
        id={id}
        aria-invalid={error ? true : undefined}
        aria-describedby={error || hint ? `${id}-help` : undefined}
        className="min-h-11 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-base placeholder:text-slate-400 focus:border-accent"
        {...props}
      />
      {(error || hint) && (
        <p
          id={`${id}-help`}
          className={`text-sm ${error ? "text-red-700" : "text-muted"}`}
        >
          {error || hint}
        </p>
      )}
    </div>
  );
}
