import { useQuery } from "@tanstack/react-query";

import { useCurrentUserId } from "@/hooks/auth";
import { fetchRentDues } from "@/service/dashboard/dashboardService";

export const getRentDuesQueryKey = (landlordId: string | null) =>
  ["dashboard-rent-dues", landlordId] as const;

export function useRentDues() {
  const landlordId = useCurrentUserId();

  return useQuery({
    queryKey: getRentDuesQueryKey(landlordId),
    queryFn: () => fetchRentDues(landlordId as string),
    enabled: landlordId !== null,
  });
}
