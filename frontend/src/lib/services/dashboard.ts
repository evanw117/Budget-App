import { mockDashboard } from "@/lib/mock/dashboard";
import type { DashboardData } from "@/types/dashboard";

// Replace this adapter with a backend request once the dashboard API exists.
// Keep its contract stable so presentation components do not need to change.
export async function getDashboard(): Promise<DashboardData> {
  return mockDashboard;
}
