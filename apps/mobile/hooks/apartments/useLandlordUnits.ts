import { useQuery } from "@tanstack/react-query";

import { useCurrentUser } from "@/hooks/auth";
import { fetchLandlordUnits } from "@/service/landlordService";

export type { LandlordUnitApartment as Apartment } from "@/service/landlordService";

export const getLandlordUnitsQueryKey = (landlordId: string | null) =>
  ["landlord-units", landlordId] as const;

export function useLandlordUnits() {
  const currentUserQuery = useCurrentUser();
  const landlordId = currentUserQuery.data?.id ?? null;

  const unitsQuery = useQuery({
    queryKey: getLandlordUnitsQueryKey(landlordId),
    queryFn: () => fetchLandlordUnits(landlordId as string),
    enabled: landlordId !== null,
  });

  return {
    apartments: unitsQuery.data?.apartments ?? [],
    monthlyProfit: unitsQuery.data?.monthlyProfit ?? null,
    loading: currentUserQuery.isLoading || unitsQuery.isLoading,
    fetchApartments: unitsQuery.refetch,
  };
}