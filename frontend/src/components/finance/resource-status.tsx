import Link from "next/link";
import { Button, buttonStyles } from "@/components/ui/button";
import { EmptyState, ErrorState } from "@/components/ui/states";
export function SignInState() {
  return (
    <EmptyState
      title="Your workspace starts with you"
      description="Sign in to manage your own accounts, categories, and transactions. The dashboard preview is separate from your saved data."
      action={
        <Link href="/login" className={buttonStyles()}>
          Sign in
        </Link>
      }
    />
  );
}
export function ResourceError({
  message,
  retry,
}: {
  message: string;
  retry: () => void;
}) {
  return (
    <ErrorState
      message={message}
      action={
        <Button variant="secondary" onClick={retry}>
          Try again
        </Button>
      }
    />
  );
}
