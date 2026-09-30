import type { ButtonHTMLAttributes } from "react";
export function buttonStyles(variant: "primary" | "secondary" = "primary") {
  return `inline-flex min-h-11 items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${variant === "primary" ? "bg-accent text-white hover:bg-[#125448]" : "border border-line bg-white text-ink hover:bg-slate-50"}`;
}
export function Button({
  variant = "primary",
  className = "",
  type = "button",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary";
}) {
  return (
    <button
      type={type}
      className={`${buttonStyles(variant)} ${className}`}
      {...props}
    />
  );
}
