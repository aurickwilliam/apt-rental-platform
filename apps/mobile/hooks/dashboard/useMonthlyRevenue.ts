import { useQuery } from "@tanstack/react-query";

import { useCurrentUserId } from "@/hooks/auth";
import { fetchMonthlyRevenue } from "@/service/dashboard/dashboardService";

export const getMonthlyRevenueQueryKey = (landlordId: string | null) =>
  ["dashboard-monthly-revenue", landlordId] as const;

export function useMonthlyRevenue() {
  const landlordId = useCurrentUserId();

  return useQuery({
    queryKey: getMonthlyRevenueQueryKey(landlordId),
    queryFn: () => fetchMonthlyRevenue(landlordId as string),
    enabled: landlordId !== null,
  });
}
