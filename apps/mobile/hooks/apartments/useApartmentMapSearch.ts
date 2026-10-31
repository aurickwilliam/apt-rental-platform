import { useQuery } from '@tanstack/react-query';

import { BBox, fetchApartmentsInBbox, type MapApartment } from '@/service/apartments/mapSearchService';

export const getMapSearchQueryKey = (bbox: BBox | null, search = '') =>
  ['apartment-map-search', bbox?.minLng, bbox?.minLat, bbox?.maxLng, bbox?.maxLat, search] as const;

export function useApartmentMapSearch(bbox: BBox | null, opts?: { enabled?: boolean; limit?: number; search?: string }) {
  const enabled = (opts?.enabled ?? true) && bbox != null;
  const limit = opts?.limit ?? 100;
  const search = opts?.search ?? '';

  const query = useQuery<MapApartment[], Error>({
    queryKey: getMapSearchQueryKey(bbox, search),
    queryFn: () => fetchApartmentsInBbox(bbox as BBox, limit, search),
    enabled,
    staleTime: 30_000,
    gcTime: 5 * 60_000,
  });

  return {
    apartments: query.data ?? [],
    loading: query.isLoading,
    isFetching: query.isFetching,
    error: query.error?.message ?? null,
    refetch: query.refetch,
  };
}
