"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRef, useState, type ReactNode } from "react";
import {
  ArrowLeftRight,
  ArrowUpRight,
  ChartNoAxesCombined,
  ChevronRight,
  Compass,
  FileUp,
  House,
  LayoutDashboard,
  Menu,
  Repeat2,
  Settings,
  Target,
  Tags,
  Wallet,
  X,
} from "lucide-react";
import { navigation } from "@/lib/navigation";

const icons = {
  dashboard: LayoutDashboard,
  accounts: Wallet,
  categories: Tags,
  transactions: ArrowLeftRight,
  budgets: ChartNoAxesCombined,
  recurring: Repeat2,
  savings: Target,
  imports: FileUp,
  analytics: ChartNoAxesCombined,
  settings: Settings,
};
function Brand() {
  return (
    <Link
      href="/"
      className="flex items-center gap-3 rounded-lg"
      aria-label="Budget App dashboard"
    >
      <span className="rounded-xl bg-accent p-2.5 text-white">
        <Compass className="size-6" aria-hidden="true" />
      </span>
      <span>
        <span className="block text-xl font-bold tracking-tight">
          Budget App
        </span>
        <span className="whitespace-nowrap text-[9px] font-medium tracking-[0.04em] text-muted">
          FINANCE & RELOCATION
        </span>
      </span>
    </Link>
  );
}
function Navigation({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  return (
    <nav aria-label="Main navigation" className="space-y-1.5">
      {navigation.map(({ href, label, icon }) => {
        const Icon = icons[icon];
        const active = pathname === href;
        return (
          <Link
            key={href}
            href={href}
            onClick={onNavigate}
            aria-current={active ? "page" : undefined}
            className={`flex min-h-11 items-center gap-3 rounded-lg px-3 text-sm font-medium ${active ? "bg-[#e7f2ed] text-[#125448]" : "text-muted hover:bg-slate-50 hover:text-ink"}`}
          >
            <Icon aria-hidden="true" className="size-[18px]" />
            {label}
            {active && (
              <span
                aria-hidden="true"
                className="ml-auto size-1.5 rounded-full bg-accent"
              />
            )}
          </Link>
        );
      })}
    </nav>
  );
}
function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <div className="flex h-full flex-col p-5">
      <div className="px-2 pb-10 pt-3">
        <Brand />
      </div>
      <p className="mb-3 px-3 text-[10px] font-bold tracking-[0.16em] text-muted">
        YOUR WORKSPACE
      </p>
      <Navigation onNavigate={onNavigate} />
      <div className="mt-auto pt-10">
        <div className="rounded-xl border border-[#dce9e1] bg-[#f4f8f4] p-4">
          <House aria-hidden="true" className="mb-3 size-5 text-accent" />
          <p className="text-sm font-semibold">A new chapter, in focus.</p>
          <p className="mt-2 text-xs leading-5 text-muted">
            Make room for everyday life and the move ahead.
          </p>
          <span className="mt-3 inline-flex rounded-md bg-white px-2 py-1 text-[11px] font-medium text-accent">
            Chicago, USA
          </span>
        </div>
        <p className="mt-5 px-2 text-xs text-muted">
          Your money. Your next chapter.
        </p>
      </div>
    </div>
  );
}
export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const current =
    navigation.find((item) => item.href === pathname)?.label ??
    (pathname === "/register" ? "Create account" : "Sign in");
  const dialog = useRef<HTMLDialogElement>(null);
  const [open, setOpen] = useState(false);
  const close = () => {
    dialog.current?.close();
    setOpen(false);
  };
  return (
    <div className="min-h-screen">
      <a
        href="#main-content"
        className="sr-only fixed left-4 top-4 z-50 rounded-lg bg-white p-3 focus:not-sr-only"
      >
        Skip to content
      </a>
      <aside className="fixed inset-y-0 left-0 hidden w-60 overflow-y-auto border-r border-line bg-white lg:block">
        <SidebarContent />
      </aside>
      <dialog
        id="mobile-navigation"
        aria-label="Navigation"
        ref={dialog}
        onClose={() => setOpen(false)}
        className="mobile-drawer bg-white text-ink"
      >
        <button
          aria-label="Close navigation"
          onClick={close}
          className="absolute right-2 top-2 rounded-lg p-3"
        >
          <X aria-hidden="true" className="size-5" />
        </button>
        <SidebarContent onNavigate={close} />
      </dialog>
      <div className="lg:pl-60">
        <header className="flex min-h-20 items-center justify-between gap-3 border-b border-line bg-white px-4 sm:px-8">
          <div className="flex items-center gap-3">
            <button
              aria-label="Open navigation"
              aria-controls="mobile-navigation"
              aria-expanded={open}
              onClick={() => {
                dialog.current?.showModal();
                setOpen(true);
              }}
              className="rounded-lg p-2.5 lg:hidden"
            >
              <Menu aria-hidden="true" className="size-5" />
            </button>
            <span className="hidden text-sm text-muted sm:inline">
              Workspace
            </span>
            <ChevronRight
              aria-hidden="true"
              className="hidden size-3.5 text-muted sm:block"
            />
            <span className="text-sm font-semibold">{current}</span>
          </div>
          <div className="flex items-center gap-3 sm:gap-5">
            <span className="rounded-full border border-[#d7e6dc] bg-[#f1f7f2] px-2.5 py-1 text-[11px] font-medium text-accent">
              {["/accounts", "/categories", "/transactions"].includes(pathname)
                ? "Personal"
                : "Demo"}
              <span className="hidden sm:inline"> workspace</span>
            </span>
            <Link
              href="/login"
              className="inline-flex min-h-11 items-center gap-1.5 text-sm font-semibold text-accent"
            >
              <span className="sm:hidden">Account</span>
              <span className="hidden sm:inline">Your account</span>
              <ArrowUpRight aria-hidden="true" className="size-4" />
            </Link>
          </div>
        </header>
        <main
          id="main-content"
          tabIndex={-1}
          className="mx-auto max-w-[1500px] px-4 py-7 outline-none sm:px-8 sm:py-9"
        >
          {children}
        </main>
      </div>
    </div>
  );
}
