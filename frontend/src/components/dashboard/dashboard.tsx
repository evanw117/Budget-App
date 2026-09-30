import Link from "next/link";
import {
  ArrowDownLeft,
  ArrowUpRight,
  CalendarDays,
  ChevronRight,
  Leaf,
  MoveUpRight,
  Wallet,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { formatDate, formatMoney } from "@/lib/format";
import type { DashboardData } from "@/types/dashboard";
const summaryIcons = {
  balance: Wallet,
  income: ArrowDownLeft,
  spending: ArrowUpRight,
  savings: Leaf,
};
function SectionHeading({
  title,
  subtitle,
  href,
}: {
  title: string;
  subtitle: string;
  href: string;
}) {
  return (
    <div className="flex items-start justify-between gap-3 px-5 pb-5 pt-6 sm:px-6">
      <div>
        <h2 className="text-base font-semibold">{title}</h2>
        <p className="mt-1.5 text-xs text-muted">{subtitle}</p>
      </div>
      <Link
        href={href}
        className="flex min-h-9 shrink-0 items-center gap-1 text-xs font-semibold text-accent"
        aria-label={`View all ${title.toLowerCase()}`}
      >
        View all
        <ChevronRight aria-hidden="true" className="size-3.5" />
      </Link>
    </div>
  );
}
export function Dashboard({ data }: { data: DashboardData }) {
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="mb-2 text-xs font-semibold tracking-[0.13em] text-accent">
            YOUR MONEY, AT A GLANCE
          </p>
          <h1 className="text-3xl font-semibold tracking-tight sm:text-[32px]">
            A clearer picture of your money.
          </h1>
          <p className="mt-2.5 text-sm leading-6 text-muted">
            Everyday spending, future plans, and a fresh start in Chicago.
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-lg border border-line bg-white px-3 py-2.5 text-xs font-medium">
          <CalendarDays aria-hidden="true" className="size-4 text-muted" />
          {data.period}
        </div>
      </div>
      <div className="flex items-center gap-2 text-xs text-muted">
        <span
          aria-hidden="true"
          className="size-1.5 rounded-full bg-[#b18b49]"
        />
        <span>Sample data · USD · A preview of your future workspace</span>
      </div>
      <section
        aria-label="Monthly summary"
        className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
      >
        {data.summaries.map((summary) => {
          const Icon = summaryIcons[summary.icon];
          const accent = summary.icon === "savings";
          return (
            <Card
              key={summary.label}
              className={`p-5 ${accent ? "border-[#17675b] bg-[#17675b]! text-white" : ""}`}
            >
              <div className="flex items-center justify-between gap-2">
                <h2
                  className={`text-xs font-medium ${accent ? "text-[#dbeee7]" : "text-muted"}`}
                >
                  {summary.label}
                </h2>
                <span
                  className={`rounded-lg p-2 ${accent ? "bg-white/10" : "bg-[#f0f5f2] text-accent"}`}
                >
                  <Icon aria-hidden="true" className="size-[18px]" />
                </span>
              </div>
              <p className="mt-4 text-[29px] font-semibold tracking-tight tabular-nums">
                {formatMoney(summary.value)}
              </p>
              <p
                className={`mt-3 text-[11px] leading-5 ${accent ? "text-[#dbeee7]" : "text-muted"}`}
              >
                {summary.note}
              </p>
            </Card>
          );
        })}
      </section>
      <div className="grid gap-6 xl:grid-cols-[1.55fr_1fr]">
        <Card className="overflow-hidden">
          <SectionHeading
            title="Recent transactions"
            subtitle="The little details behind the bigger picture"
            href="/transactions"
          />
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <caption className="sr-only">
                Sample recent transactions in US dollars
              </caption>
              <thead className="border-y border-line bg-[#fafbf9] text-[10px] uppercase tracking-wider text-muted">
                <tr>
                  <th scope="col" className="px-5 py-3 font-semibold sm:px-6">
                    Transaction
                  </th>
                  <th
                    scope="col"
                    className="hidden px-3 py-3 font-semibold sm:table-cell"
                  >
                    Category
                  </th>
                  <th
                    scope="col"
                    className="px-5 py-3 text-right font-semibold sm:px-6"
                  >
                    Amount
                  </th>
                </tr>
              </thead>
              <tbody>
                {data.transactions.map((transaction) => (
                  <tr
                    key={transaction.id}
                    className="border-b border-line last:border-0"
                  >
                    <td className="px-5 py-4 sm:px-6">
                      <div className="flex items-center gap-3">
                        <span
                          aria-hidden="true"
                          className={`flex size-9 shrink-0 items-center justify-center rounded-xl text-[10px] font-bold ${transaction.direction === "income" ? "bg-[#e7f2ed] text-accent" : "bg-[#f2f3f0] text-muted"}`}
                        >
                          {transaction.initials}
                        </span>
                        <div>
                          <p className="text-xs font-semibold sm:text-sm">
                            {transaction.merchant}
                          </p>
                          <p className="mt-1 text-[11px] text-muted">
                            <time dateTime={transaction.date}>
                              {formatDate(transaction.date)}
                            </time>
                            <span className="hidden 2xl:inline">
                              {" "}
                              · {transaction.description}
                            </span>
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="hidden px-3 py-4 sm:table-cell">
                      <span className="rounded-md bg-[#f3f5f4] px-2 py-1 text-[10px] text-muted">
                        {transaction.category}
                      </span>
                    </td>
                    <td
                      className={`whitespace-nowrap px-5 py-4 text-right text-xs font-semibold tabular-nums sm:px-6 ${transaction.direction === "income" ? "text-accent" : ""}`}
                    >
                      {transaction.direction === "income" ? "+" : "−"}
                      {formatMoney(transaction.amount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="border-t border-line px-6 py-3.5 text-[11px] text-muted">
            Illustrative transactions. No bank accounts connected.
          </div>
        </Card>
        <Card>
          <SectionHeading
            title="Spending by category"
            subtitle="Where September’s money went"
            href="/analytics"
          />
          <div className="px-5 pb-6 sm:px-6">
            <div className="mb-5 flex items-baseline gap-2">
              <span className="text-3xl font-semibold tracking-tight">
                {formatMoney(data.summaries[2].value)}
              </span>
              <span className="text-xs text-muted">total spent</span>
            </div>
            <div
              aria-hidden="true"
              className="mb-6 flex h-3 gap-0.5 overflow-hidden rounded-full"
            >
              {data.spending.map((item) => (
                <div
                  key={item.category}
                  style={{
                    width: `${item.percentage}%`,
                    background: item.color,
                  }}
                />
              ))}
            </div>
            <ul className="space-y-4">
              {data.spending.map((item) => (
                <li
                  key={item.category}
                  className="flex items-center gap-2.5 text-xs"
                >
                  <span
                    aria-hidden="true"
                    className="size-2 rounded-full"
                    style={{ background: item.color }}
                  />
                  <span>{item.category}</span>
                  <span className="ml-auto font-medium tabular-nums">
                    {formatMoney(item.amount)}
                  </span>
                  <span className="w-10 text-right text-[11px] tabular-nums text-muted">
                    {item.percentage}%
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </Card>
      </div>
      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <SectionHeading
            title="Upcoming recurring payments"
            subtitle="A little planning. Fewer surprises."
            href="/recurring"
          />
          <ul className="divide-y divide-line px-5 pb-2 sm:px-6">
            {data.upcoming.map((item) => (
              <li
                key={item.id}
                className="flex items-center gap-3 py-4 first:pt-0"
              >
                <div className="flex size-10 shrink-0 flex-col items-center justify-center rounded-lg border border-line bg-[#fafbf9]">
                  <span className="text-[9px] uppercase text-muted">Oct</span>
                  <span className="text-sm font-semibold">
                    {item.date.slice(-2)}
                  </span>
                </div>
                <div>
                  <p className="text-sm font-medium">{item.name}</p>
                  <p className="mt-1 text-[11px] text-muted">{item.detail}</p>
                </div>
                <div className="ml-auto text-right">
                  <p className="text-xs font-semibold tabular-nums">
                    {formatMoney(item.amount)}
                  </p>
                  <time
                    dateTime={item.date}
                    className="mt-1 block text-[10px] text-muted"
                  >
                    {formatDate(item.date)}
                  </time>
                </div>
              </li>
            ))}
          </ul>
        </Card>
        <Card>
          <SectionHeading
            title="Savings goals"
            subtitle="Small steps toward your next chapter"
            href="/savings-goals"
          />
          <div className="space-y-6 px-5 pb-6 sm:px-6">
            {data.goals.map((goal) => (
              <div key={goal.id}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-medium">{goal.name}</h3>
                    <p className="mt-1 text-[11px] text-muted">
                      {goal.description}
                    </p>
                  </div>
                  <span className="rounded-md bg-[#eef5f1] px-2 py-1 text-[11px] font-semibold text-accent">
                    {goal.percentage}%
                  </span>
                </div>
                <div
                  role="progressbar"
                  aria-label={goal.name}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={goal.percentage}
                  className="mb-2 mt-4 h-1.5 overflow-hidden rounded-full bg-[#edf1ed]"
                >
                  <div
                    className="h-full rounded-full bg-accent"
                    style={{ width: `${goal.percentage}%` }}
                  />
                </div>
                <p className="text-[11px] text-muted">
                  <span className="font-semibold text-ink">
                    {formatMoney(goal.saved)}
                  </span>{" "}
                  of {formatMoney(goal.target)}
                </p>
              </div>
            ))}
          </div>
        </Card>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line pt-5 text-xs text-muted">
        <p>Built for the everyday. Ready for what’s next.</p>
        <Link
          href="/register"
          className="flex min-h-10 items-center gap-1 font-medium text-accent"
        >
          Create your account
          <MoveUpRight aria-hidden="true" className="size-3.5" />
        </Link>
      </div>
    </div>
  );
}
