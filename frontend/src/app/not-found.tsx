import Link from "next/link";
import { EmptyState } from "@/components/ui/states";
import { buttonStyles } from "@/components/ui/button";
export default function NotFound() {
  return (
    <EmptyState
      title="This page isn’t here"
      description="The address may have changed. Let’s get you back to your overview."
      action={
        <Link href="/" className={buttonStyles()}>
          Back to dashboard
        </Link>
      }
    />
  );
}
