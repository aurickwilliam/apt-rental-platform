import { useQuery } from "@tanstack/react-query";

import { useCurrentUser } from "@/hooks/auth";
import {
  fetchDashboardData,
  type DashboardData,
} from "@/service/dashboard/dashboardService";

const EMPTY_DASHBOARD_DATA: DashboardData = {
  stats: {
    totalProperties: 0,
    unitsOccupied: 0,
    pendingPayments: 0,
    maintenanceRequests: 0,
  },
  monthlyRevenue: [],
  revenueByProperty: [],
  rentDues: [],
};

export const getDashboardDataQueryKey = (landlordId: string) =>
  ["dashboard-data", landlordId] as const;

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

  return "Failed to load dashboard data.";
}

export function useDashboardData() {
  const currentUserQuery = useCurrentUser();
  const landlordId = currentUserQuery.data?.id ?? null;
  const dashboardQuery = useQuery({
    queryKey: ["dashboard-data", landlordId] as const,
    queryFn: () => fetchDashboardData(landlordId as string),
    enabled: landlordId !== null,
  });

  return {
    data: dashboardQuery.data ?? EMPTY_DASHBOARD_DATA,
    isLoading: currentUserQuery.isLoading || dashboardQuery.isLoading,
    error: getErrorMessage(currentUserQuery.error ?? dashboardQuery.error),
    refetch: dashboardQuery.refetch,
  };
}
