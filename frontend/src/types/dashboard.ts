export type Money = { amount: string; currency: "USD" };
export type Transaction = {
  id: string;
  merchant: string;
  description: string;
  category: string;
  date: string;
  amount: Money;
  direction: "income" | "expense";
  initials: string;
};
export type DashboardData = {
  period: string;
  summaries: {
    label: string;
    value: Money;
    note: string;
    icon: "balance" | "income" | "spending" | "savings";
  }[];
  transactions: Transaction[];
  spending: {
    category: string;
    amount: Money;
    percentage: number;
    color: string;
  }[];
  upcoming: {
    id: string;
    name: string;
    detail: string;
    date: string;
    amount: Money;
    initials: string;
  }[];
  goals: {
    id: string;
    name: string;
    description: string;
    saved: Money;
    target: Money;
    percentage: number;
  }[];
};
