import { useQuery } from "@tanstack/react-query";

import { fetchHasActiveTenancyAsLandlord } from "@/service/landlord/activeTenancyService";

export const getHasActiveTenancyQueryKey = (landlordId: string) =>
  ["landlord-active-tenancy", landlordId] as const;

/** Enabled only for a landlord who is not verified; verified accounts never ask. */
export function useHasActiveTenancy(landlordId: string | null, enabled: boolean): boolean {
  const { data } = useQuery({
    queryKey: getHasActiveTenancyQueryKey(landlordId as string),
    queryFn: () => fetchHasActiveTenancyAsLandlord(landlordId as string),
    enabled: enabled && landlordId !== null,
  });

  return data ?? false;
}
