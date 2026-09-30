"use client";
import Link from "next/link";
import { useEffect, useState, type FormEvent } from "react";
import { CheckCircle2, ShieldCheck } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button, buttonStyles } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ErrorState, LoadingState } from "@/components/ui/states";
import { authService } from "@/lib/services/auth";
import type { CurrentUser } from "@/types/auth";

export function AuthForm({ mode }: { mode: "login" | "register" }) {
  const register = mode === "register";
  const [busy, setBusy] = useState(false);
  const [checking, setChecking] = useState(!register);
  const [error, setError] = useState("");
  const [created, setCreated] = useState(false);
  const [user, setUser] = useState<CurrentUser | null>(null);
  useEffect(() => {
    if (register) return;
    const controller = new AbortController();
    authService
      .currentUser(controller.signal)
      .then(setUser)
      .catch(() => {})
      .finally(() => {
        if (!controller.signal.aborted) setChecking(false);
      });
    return () => controller.abort();
  }, [register]);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setBusy(true);
    const form = new FormData(event.currentTarget);
    const credentials = {
      email: String(form.get("email")),
      password: String(form.get("password")),
    };
    try {
      if (register) {
        await authService.register({
          ...credentials,
          displayName: String(form.get("displayName")),
        });
        setCreated(true);
      } else {
        await authService.login(credentials);
        setUser(await authService.currentUser());
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Please try again.");
    } finally {
      setBusy(false);
    }
  }
  async function logout() {
    setBusy(true);
    setError("");
    try {
      await authService.logout();
      setUser(null);
    } catch {
      setError("We couldn’t sign you out. Please try again.");
    } finally {
      setBusy(false);
    }
  }
  if (checking) return <LoadingState label="Checking your session…" />;
  return (
    <div className="mx-auto max-w-md py-5 sm:py-10">
      <p className="mb-3 text-center text-xs font-semibold tracking-widest text-accent">
        YOUR NEXT CHAPTER
      </p>
      <h1 className="text-center text-3xl font-semibold tracking-tight">
        {user
          ? `Welcome, ${user.displayName}`
          : created
            ? "You’re all set"
            : register
              ? "A fresh start for your finances"
              : "Welcome back"}
      </h1>
      <p className="mb-8 mt-3 text-center text-sm leading-6 text-muted">
        {user
          ? "You’re signed in. Your financial workspace is still a sample preview."
          : "A little clarity for everyday life and everything ahead."}
      </p>
      <Card className="p-6 sm:p-8">
        {error && (
          <div className="mb-5">
            <ErrorState message={error} />
          </div>
        )}
        {user ? (
          <div className="space-y-5">
            <p className="break-words text-sm text-muted">{user.email}</p>
            <Link href="/" className={`${buttonStyles()} w-full`}>
              Explore the sample dashboard
            </Link>
            <Button
              variant="secondary"
              className="w-full"
              onClick={logout}
              disabled={busy}
            >
              {busy ? "Signing out…" : "Sign out"}
            </Button>
          </div>
        ) : created ? (
          <div role="status" className="space-y-5 text-center">
            <CheckCircle2
              aria-hidden="true"
              className="mx-auto size-9 text-accent"
            />
            <p className="text-sm text-muted">
              Your account has been created. Sign in to continue.
            </p>
            <Link href="/login" className={buttonStyles()}>
              Go to sign in
            </Link>
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-5">
            {register && (
              <Input
                id="displayName"
                name="displayName"
                label="Display name"
                autoComplete="nickname"
                maxLength={100}
                required
              />
            )}
            <Input
              id="email"
              name="email"
              type="email"
              label="Email address"
              autoComplete="email"
              maxLength={254}
              placeholder="you@example.com"
              required
            />
            <Input
              id="password"
              name="password"
              type="password"
              label="Password"
              autoComplete={register ? "new-password" : "current-password"}
              minLength={register ? 12 : 1}
              maxLength={128}
              required
              hint={
                register
                  ? "Use 12–128 characters. A memorable passphrase works well."
                  : undefined
              }
            />
            <Button type="submit" className="w-full" disabled={busy}>
              {busy ? "Please wait…" : register ? "Create account" : "Sign in"}
            </Button>
            <p className="text-center text-sm text-muted">
              {register ? "Already have an account?" : "New to Waymark?"}{" "}
              <Link
                className="font-semibold text-accent underline underline-offset-4"
                href={register ? "/login" : "/register"}
              >
                {register ? "Sign in" : "Create an account"}
              </Link>
            </p>
          </form>
        )}
      </Card>
      <p className="mt-5 flex items-center justify-center gap-2 text-xs text-muted">
        <ShieldCheck aria-hidden="true" className="size-4" />
        Your account is separate from the demo data.
      </p>
    </div>
  );
}
