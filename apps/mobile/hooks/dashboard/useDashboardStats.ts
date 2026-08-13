import { useQuery } from "@tanstack/react-query";

import { useCurrentUser } from "@/hooks/auth";
import { fetchDashboardStats, type DashboardStats } from "@/service/dashboardService";

const EMPTY_DASHBOARD_STATS: DashboardStats = {
  totalProperties: 0,
  unitsOccupied: 0,
  pendingPayments: 0,
  maintenanceRequests: 0,
};

export const getDashboardStatsQueryKey = (landlordId: string) =>
  ["dashboard-stats", landlordId] as const;

function getErrorMessage(error: unknown): string | null {
  if (!error) return null;
  if (error instanceof Error) return error.message;

  if (
    typeof error === "object" &&
    "message" in error &&
    typeof (error as { message?: unknown }).message === "string"
  ) {
    return (error as { message: string }).message;
  }

  return "Failed to load dashboard stats.";
}

export function useDashboardStats() {
  const currentUserQuery = useCurrentUser();
  const landlordId = currentUserQuery.data?.id ?? null;
  const dashboardStatsQuery = useQuery({
    queryKey: ["dashboard-stats", landlordId] as const,
    queryFn: () => fetchDashboardStats(landlordId as string),
    enabled: landlordId !== null,
  });

  return {
    stats: dashboardStatsQuery.data ?? EMPTY_DASHBOARD_STATS,
    loading: currentUserQuery.isLoading || dashboardStatsQuery.isLoading,
    error: getErrorMessage(currentUserQuery.error ?? dashboardStatsQuery.error),
    refetch: dashboardStatsQuery.refetch,
  };
}
