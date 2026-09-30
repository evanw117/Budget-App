"use client";
import { ErrorState } from "@/components/ui/states";
import { Button } from "@/components/ui/button";
export default function Error({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <ErrorState
      message="We couldn’t load this page. Please try again."
      action={<Button onClick={reset}>Try again</Button>}
    />
  );
}
