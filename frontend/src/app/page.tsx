import { Dashboard } from "@/components/dashboard/dashboard";
import { getDashboard } from "@/lib/services/dashboard";
export default async function DashboardPage() {
  return <Dashboard data={await getDashboard()} />;
}
