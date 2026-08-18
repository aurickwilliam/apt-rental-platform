import { useQuery } from "@tanstack/react-query";

import { useProfile } from "hooks/auth";
import { fetchLandlordVisitRequests } from "@/service/landlord/landlordService";

export type { LandlordVisitRequest } from "@/service/landlord/landlordService";

export const getLandlordVisitRequestsQueryKey = (landlordId: string | null) =>
  ["landlord-visit-requests", landlordId] as const;

export function useLandlordVisitRequests() {
  const { profile, loading: profileLoading } = useProfile();
  const landlordId = profile?.id ?? null;

  const visitRequestsQuery = useQuery({
    queryKey: getLandlordVisitRequestsQueryKey(landlordId),
    queryFn: () => fetchLandlordVisitRequests(landlordId as string),
    enabled: landlordId !== null && !profileLoading,
  });

  return {
    visitRequests: visitRequestsQuery.data ?? [],
    loading: visitRequestsQuery.isLoading || profileLoading,
    refetch: visitRequestsQuery.refetch,
  };
}