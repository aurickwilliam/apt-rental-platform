import { useInfiniteQuery } from "@tanstack/react-query";
import { supabase } from "@repo/supabase";
import type { Json } from "@repo/supabase";
import type { ApartmentCardProps } from "components/cards/ApartmentCard";
import { transformApartments } from "./useSearchSections";

export const SECTION_PAGE_SIZE = 10;

interface SectionPage {
  apartments: ApartmentCardProps[];
  nextCursor: Json | null;
}

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
    initialPageParam: null as Json | null,
    queryFn: async ({ pageParam, signal }): Promise<SectionPage> => {
      const { data, error } = await supabase
        .rpc("get_search_section_page", {
          p_section_id: sectionId,
          p_city: selectedCity,
          p_search: committedSearch || undefined,
          p_after: pageParam ?? undefined,
          p_limit: SECTION_PAGE_SIZE,
        })
        .abortSignal(signal);
      if (error) throw error;
      const result = data as unknown as { items: any[]; next_cursor: Json | null };
      return {
        apartments: transformApartments(result?.items ?? []),
        nextCursor: result?.next_cursor ?? null,
      };
    },
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    staleTime: 30_000,
    enabled,
  });
}
