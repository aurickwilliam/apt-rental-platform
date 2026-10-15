import { useCallback } from "react";
import { queryOptions, useQuery, useQueryClient, type QueryClient } from "@tanstack/react-query";

import { usePortalStore } from "@/stores/usePortalStore";
import {
  loadRentalsLayoutHint,
  saveRentalsLayoutHint,
  type RentalsLayoutHint,
} from "@/service/tenancy/rentalsLayoutHint";

export type { RentalsLayoutHint } from "@/service/tenancy/rentalsLayoutHint";

export const getRentalsLayoutHintQueryKey = (authUserId: string) =>
  ["rentals-layout-hint", authUserId] as const;

const rentalsLayoutHintQuery = (authUserId: string) =>
  queryOptions({
    queryKey: getRentalsLayoutHintQueryKey(authUserId),
    queryFn: () => loadRentalsLayoutHint(authUserId),
    // Read from the device, not the server; `remember` keeps it current.
    staleTime: Infinity,
  });

export function prefetchRentalsLayoutHint(queryClient: QueryClient, authUserId: string) {
  return queryClient.prefetchQuery(rentalsLayoutHintQuery(authUserId));
}

// Which Rentals skeleton to show before the tenancy is known. The auth user id
// comes from the portal store, which the tabs layout guarantees is set.
export function useRentalsLayoutHint() {
  const queryClient = useQueryClient();
  const authUserId = usePortalStore((state) => state.authUserId);

  const hintQuery = useQuery({
    ...rentalsLayoutHintQuery(authUserId ?? ""),
    enabled: authUserId !== null,
  });
  const hint = hintQuery.data ?? null;

  const remember = useCallback(
    (nextHint: RentalsLayoutHint) => {
      if (!authUserId || hint === nextHint) return;

      queryClient.setQueryData(getRentalsLayoutHintQueryKey(authUserId), nextHint);
      void saveRentalsLayoutHint(authUserId, nextHint);
    },
    [authUserId, hint, queryClient],
  );

  return {
    hint,
    isReady: authUserId === null || !hintQuery.isPending,
    remember,
  };
}
