import { useInfiniteQuery } from "@tanstack/react-query";
import type { BrowseRowSpec } from "@repo/utils";

import type { ApartmentCardProps } from "@/components/cards/ApartmentCard";
import { fetchBrowseRowCards } from "@/service/search/browseRowsService";

export const BROWSE_ROW_PAGE_SIZE = 10;

interface UseBrowseRowPageParams {
  spec: BrowseRowSpec | null;
  enabled?: boolean;
}

/** See All for a spec-built row: its listings in pages of BROWSE_ROW_PAGE_SIZE. */
export function useBrowseRowPage({ spec, enabled = true }: UseBrowseRowPageParams) {
  return useInfiniteQuery({
    queryKey: ["browseRowPage", spec?.id ?? null, spec ? JSON.stringify(spec.criteria) : null, spec?.sort ?? null] as const,
    initialPageParam: 0,
    queryFn: ({ pageParam, signal }): Promise<ApartmentCardProps[]> =>
      fetchBrowseRowCards(spec as BrowseRowSpec, {
        limit: BROWSE_ROW_PAGE_SIZE,
        offset: pageParam,
        signal,
      }),
    // A short page is the last one.
    getNextPageParam: (lastPage, pages) =>
      lastPage.length < BROWSE_ROW_PAGE_SIZE ? undefined : pages.length * BROWSE_ROW_PAGE_SIZE,
    staleTime: 30_000,
    enabled: enabled && spec !== null,
  });
}
