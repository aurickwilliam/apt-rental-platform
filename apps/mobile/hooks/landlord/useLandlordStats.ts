import { useQuery } from "@tanstack/react-query";

import { fetchLandlordStats } from "@/service/landlordService";

import type { LandlordStats } from "@/service/landlordService";

export function useLandlordStats(landlordId: string | undefined) {
  const statsQuery = useQuery({
    queryKey: ["landlord-stats", landlordId] as const,
    queryFn: () => fetchLandlordStats(landlordId as string),
    enabled: landlordId !== undefined,
  });

  return {
    stats: (statsQuery.data ?? { averageRating: 0, totalProperties: 0 }) as LandlordStats,
    loading: statsQuery.isLoading,
    refetch: statsQuery.refetch,
  };
}