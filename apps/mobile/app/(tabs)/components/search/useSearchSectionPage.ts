import { useInfiniteQuery } from "@tanstack/react-query";
import { supabase } from "@repo/supabase";
import type { ApartmentCardProps } from "components/cards/ApartmentCard";
import { transformApartments } from "./useSearchSections";

export const SECTION_PAGE_SIZE = 10;

interface UseSearchSectionPageParams {
  sectionId: string;
  selectedCity: string;
  committedSearch: string;
  enabled?: boolean;
}

export function useSearchSectionPage({
  sectionId,
  selectedCity,
  committedSearch,
  enabled = true,
}: UseSearchSectionPageParams) {
  return useInfiniteQuery({
    queryKey: ["searchSectionPage", sectionId, selectedCity, committedSearch] as const,
    initialPageParam: 0,
    queryFn: async ({ pageParam, signal }): Promise<ApartmentCardProps[]> => {
      const { data, error } = await supabase
        .rpc("get_search_section_page", {
          p_section_id: sectionId,
          p_city: selectedCity,
          p_search: committedSearch || undefined,
          p_offset: pageParam,
          p_limit: SECTION_PAGE_SIZE,
        })
        .abortSignal(signal);
      if (error) throw error;
      return transformApartments((data as unknown as any[]) ?? []);
    },
    getNextPageParam: (lastPage, allPages) =>
      lastPage.length < SECTION_PAGE_SIZE ? undefined : allPages.length * SECTION_PAGE_SIZE,
    staleTime: 30_000,
    enabled,
  });
}
