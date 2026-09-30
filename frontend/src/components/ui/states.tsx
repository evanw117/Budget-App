import { CircleAlert, FolderOpen, LoaderCircle } from "lucide-react";
import type { ReactNode } from "react";
export function LoadingState({
  label = "Loading your overview…",
}: {
  label?: string;
}) {
  return (
    <div
      role="status"
      className="flex min-h-56 items-center justify-center gap-3 text-muted"
    >
      <LoaderCircle aria-hidden="true" className="size-5 animate-spin" />
      <span>{label}</span>
    </div>
  );
}
export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="mx-auto flex max-w-lg flex-col items-center px-6 py-16 text-center">
      <span className="mb-5 rounded-2xl bg-[#eaf3ef] p-4 text-accent">
        <FolderOpen aria-hidden="true" className="size-7" />
      </span>
      <h2 className="text-xl font-semibold">{title}</h2>
      <p className="mt-3 text-sm leading-6 text-muted">{description}</p>
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}
export function ErrorState({
  message = "Something went wrong. Please try again.",
  action,
}: {
  message?: string;
  action?: ReactNode;
}) {
  return (
    <div
      role="alert"
      className="rounded-xl border border-red-200 bg-red-50 p-5"
    >
      <div className="flex items-start gap-3">
        <CircleAlert
          aria-hidden="true"
          className="size-5 shrink-0 text-red-700"
        />
        <p className="text-sm text-red-900">{message}</p>
      </div>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
