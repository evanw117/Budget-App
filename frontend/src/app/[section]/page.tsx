import Link from "next/link";
import { notFound } from "next/navigation";
import { navigation } from "@/lib/navigation";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/states";
import { buttonStyles } from "@/components/ui/button";
export function generateStaticParams() {
  return navigation
    .filter((item) => !["/", "/accounts", "/categories", "/transactions"].includes(item.href))
    .map((item) => ({ section: item.href.slice(1) }));
}
export async function generateMetadata({
  params,
}: {
  params: Promise<{ section: string }>;
}) {
  const { section } = await params;
  return {
    title:
      navigation.find((item) => item.href === `/${section}`)?.label ??
      "Not found",
  };
}
export default async function PlaceholderPage({
  params,
}: {
  params: Promise<{ section: string }>;
}) {
  const { section } = await params;
  const item = navigation.find((item) => item.href === `/${section}`);
  if (!item) notFound();
  return (
    <>
      <p className="mb-3 text-xs font-medium text-accent">WORKSPACE PREVIEW</p>
      <h1 className="text-3xl font-semibold tracking-tight">{item.label}</h1>
      <p className="mb-8 mt-3 text-sm text-muted">{item.description}</p>
      <Card>
        <EmptyState
          title="Room for what’s next"
          description={`Your ${item.label.toLowerCase()} workspace is planned for a future phase. For now, explore the sample dashboard to see how everything will come together.`}
          action={
            <Link href="/" className={buttonStyles()}>
              Back to dashboard
            </Link>
          }
        />
      </Card>
    </>
  );
}
