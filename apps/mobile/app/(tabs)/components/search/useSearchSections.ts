import { useCallback, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@repo/supabase";
import type { ApartmentCardProps } from "components/cards/ApartmentCard";

export type SearchSection = {
  id: string;
  title: string;
  apartments: ApartmentCardProps[];
  rawApartments: any[];
};

export const SECTION_DEFS = [
  { id: "verified", title: "Verified in CAMANAVA" },
  { id: "budget_low", title: "Under ₱10k" },
  { id: "studio", title: "Studio Units" },
  { id: "top_rated", title: "Top Rated" },
  { id: "near_you", title: "Near You" },
  { id: "spacious", title: "Spacious (≥60sqm)" },
] as const;

export type SectionId = (typeof SECTION_DEFS)[number]["id"];

const SECTION_LIMIT = 8;

function transformApartments(data: any[]): ApartmentCardProps[] {
  return data.map((apt) => {
    const images = apt.apartment_images ?? [];
    const cover = images.find((img: any) => img.is_cover);
    const earliest = [...images].sort(
      (a: any, b: any) => new Date(a.created_at ?? 0).getTime() - new Date(b.created_at ?? 0).getTime()
    )[0];
    const thumbnailUrl = (cover?.url_thumb || cover?.url) ?? (earliest?.url_thumb || earliest?.url) ?? undefined;
    return {
      id: apt.id,
      thumbnail: thumbnailUrl ? { uri: thumbnailUrl } : undefined,
      name: apt.name,
      location: `${apt.barangay}, ${apt.city}`,
      ratings: apt.average_rating?.toFixed(1) ?? "0.0",
      monthlyRent: apt.monthly_rent ?? 0,
      noBedroom: apt.no_bedrooms ?? 0,
      noBathroom: apt.no_bathrooms ?? 0,
      areaSqm: apt.area_sqm ?? 0,
      isVerified: apt.is_verified,
      isGrid: true,
    };
  });
}

type UseSearchSectionsParams = {
  selectedCity: string;
  debouncedSearch: string;
  enabled?: boolean;
};

export function useSearchSections({ selectedCity, debouncedSearch, enabled = true }: UseSearchSectionsParams) {
  const [visibleIds, setVisibleIds] = useState<Set<string>>(() => new Set([SECTION_DEFS[0].id, SECTION_DEFS[1].id]));

  const onViewableItemsChanged = useCallback(({ viewableItems }: { viewableItems: { item: SearchSection }[] }) => {
    setVisibleIds((prev) => {
      const next = new Set(prev);
      for (const v of viewableItems) {
        if (v.item?.id) next.add(v.item.id);
      }
      return next;
    });
  }, []);

  const query = useQuery({
    queryKey: ["searchSections", selectedCity, debouncedSearch] as const,
    queryFn: async ({ signal }) => {
      const { data, error } = await supabase.rpc("get_search_sections", {
        p_city: selectedCity,
        p_search: debouncedSearch || null,
        p_filters: {} as any,
        p_limit: SECTION_LIMIT,
      }).abortSignal(signal as any);
      if (error) throw error;
      const sectionsRaw = (data as any)?.sections ?? [];
      const sections: SearchSection[] = sectionsRaw.map((s: any) => ({
        id: s.id,
        title: s.id === "verified" && selectedCity !== "CAMANAVA" ? `Verified in ${selectedCity}` :
               s.id === "near_you" && selectedCity !== "CAMANAVA" ? `Near ${selectedCity}` : s.title,
        rawApartments: s.apartments ?? [],
        apartments: transformApartments(s.apartments ?? []),
      }));
      return sections;
    },
    staleTime: 30_000,
    gcTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
    enabled,
  });

  // Always lazy: filter to visible for rendering; but data is batch-fetched. For true per-section lazy DB, would need per-section RPC.
  const visibleSections = useMemo(() => {
    const all = query.data ?? [];
    // If always lazy, only render visible + 1 buffer; but keep all fetched for smooth scroll
    // To truly save render, filter to visible + not yet viewed but keep placeholder
    return all.filter((s) => visibleIds.has(s.id));
  }, [query.data, visibleIds]);

  // For initial load, if not all visible, expose all but UI will lazy-mount horizontals via viewability of vertical list
  const sections = query.data ?? [];

  return {
    sections,
    visibleSections,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    error: (query.error as Error)?.message ?? null,
    refetch: query.refetch,
    onViewableItemsChanged,
    visibleIds,
  };
}
