import { useQuery } from "@tanstack/react-query";

import { useCurrentUserId } from "@/hooks/auth";
import { fetchRevenueByProperty } from "@/service/dashboard/dashboardService";

export const getRevenueByPropertyQueryKey = (
  landlordId: string | null,
  year: number,
  monthIndex: number
) => ["dashboard-revenue-by-property", landlordId, year, monthIndex] as const;

export function useRevenueByProperty(year: number, monthIndex: number) {
  const landlordId = useCurrentUserId();

  return useQuery({
    queryKey: getRevenueByPropertyQueryKey(landlordId, year, monthIndex),
    queryFn: () => fetchRevenueByProperty(landlordId as string, year, monthIndex),
    enabled: landlordId !== null,
  });
}
