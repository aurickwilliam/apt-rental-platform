import { useCallback, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@repo/supabase";
import type { ApartmentCardProps } from "components/cards/ApartmentCard";
import type { TenantPreferences } from "@/hooks/preferences/useUserPreferences";
import { toRpcFilters } from "@/hooks/preferences/useUserPreferences";

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

export function transformApartments(data: any[]): ApartmentCardProps[] {
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
  committedSearch: string;
  enabled?: boolean;
  preferences?: TenantPreferences | null;
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function matchesPreferences(raw: any, prefs: TenantPreferences): boolean {
  if (prefs.selectedCities.length > 0 && !prefs.selectedCities.includes(raw.city)) return false;
  const rent = raw.monthly_rent ?? 0;
  if (rent < prefs.budgetMin || rent > prefs.budgetMax) return false;
  if (prefs.bedroomCount === "1-2 Bedrooms") {
    if (raw.no_bedrooms == null || raw.no_bedrooms < 1 || raw.no_bedrooms > 2) return false;
  } else if (prefs.bedroomCount === "2-4 Bedrooms") {
    if (raw.no_bedrooms == null || raw.no_bedrooms < 2 || raw.no_bedrooms > 4) return false;
  } else if (prefs.bedroomCount === "4+ Bedrooms") {
    if (raw.no_bedrooms == null || raw.no_bedrooms < 4) return false;
  }
  const amenities: string[] = raw.amenities ?? [];
  if (prefs.hasPets && !amenities.includes("petfriendly")) return false;
  if (prefs.hasParking && !amenities.includes("parking")) return false;
  if (prefs.hasDisability && !amenities.includes("wheelchair")) return false;
  if (prefs.hasSmoker && !amenities.includes("nonsmoking")) return false;
  return true;
}

export function scorePreferences(raw: any, prefs: TenantPreferences): number {
  let score = 0;
  if (prefs.selectedCities.length > 0) {
    if (prefs.selectedCities.includes(raw.city)) score += 3;
    else return 0; // city is hard filter when cities set
  } else {
    score += 1; // no city pref, mild
  }
  const rent = raw.monthly_rent ?? 0;
  if (rent >= prefs.budgetMin && rent <= prefs.budgetMax) score += 2;
  else {
    // Close to budget still partial
    const dist = Math.min(Math.abs(rent - prefs.budgetMin), Math.abs(rent - prefs.budgetMax));
    if (dist < 5000) score += 1;
  }
  if (prefs.bedroomCount === "1-2 Bedrooms") {
    if (raw.no_bedrooms >= 1 && raw.no_bedrooms <= 2) score += 2;
    else if (raw.no_bedrooms === 3) score += 1;
  } else if (prefs.bedroomCount === "2-4 Bedrooms") {
    if (raw.no_bedrooms >= 2 && raw.no_bedrooms <= 4) score += 2;
    else if (raw.no_bedrooms === 1) score += 1;
  } else if (prefs.bedroomCount === "4+ Bedrooms") {
    if (raw.no_bedrooms >= 4) score += 3;
    else if (raw.no_bedrooms === 3) score += 1;
  } else {
    score += 1;
  }
  const amenities: string[] = raw.amenities ?? [];
  if (prefs.hasPets && amenities.includes("petfriendly")) score += 2;
  else if (prefs.hasPets) score -= 1;
  if (prefs.hasParking && amenities.includes("parking")) score += 1;
  if (prefs.hasDisability && amenities.includes("wheelchair")) score += 1;
  if (prefs.hasSmoker && amenities.includes("nonsmoking")) score += 1;
  if (raw.is_verified) score += 1;
  return score;
}

export function useSearchSections({ selectedCity, committedSearch, enabled = true, preferences = null }: UseSearchSectionsParams) {
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

  const prefsHash = preferences ? JSON.stringify(preferences) : null;

  const query = useQuery({
    queryKey: ["searchSections", selectedCity, committedSearch, prefsHash] as const,
    queryFn: async ({ signal }) => {
      const rpcFilters = preferences ? toRpcFilters(preferences) : {};
      const { data, error } = await supabase.rpc("get_search_sections", {
        p_city: selectedCity,
        p_search: committedSearch || undefined,
        p_filters: rpcFilters as any,
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

  // Personalized mixing: scored For you + In city on top of all base sections (optimized: single dedup + score sort)
  const sections = useMemo(() => {
    const baseSections = query.data ?? [];
    if (!preferences) return baseSections;

    // Keep all base sections as-is (generic) per decision 1 — personalization via added sections, not by blanking base
    // Build scored pool from generic base for For you / In city (ensures For you appears even when strict filter would be 0)
    const seen = new Set<string>();
    const genericPool: any[] = [];
    for (const s of baseSections) {
      for (const raw of s.rawApartments) {
        if (!seen.has(raw.id)) {
          seen.add(raw.id);
          genericPool.push(raw);
        }
      }
    }

    const scored = genericPool
      .map((raw: any) => ({ raw, score: scorePreferences(raw, preferences) }))
      .filter((s) => s.score > 0)
      .sort((a, b) => b.score - a.score || (b.raw.average_rating ?? 0) - (a.raw.average_rating ?? 0));

    const forYouRaw = scored.slice(0, SECTION_LIMIT).map((s) => s.raw);
    const inCityRaw = scored.filter((s) => s.raw.city === selectedCity).slice(0, SECTION_LIMIT).map((s) => s.raw);

    const result: SearchSection[] = [];
    if (forYouRaw.length > 0) {
      result.push({
        id: "for_you",
        title: "Recommended for you",
        rawApartments: forYouRaw,
        apartments: transformApartments(forYouRaw),
      });
    }
    if (selectedCity !== "CAMANAVA" && inCityRaw.length > 0) {
      const isDuplicateForYou = forYouRaw.length === inCityRaw.length && forYouRaw.every((r: any, i: number) => r.id === inCityRaw[i]?.id);
      if (!isDuplicateForYou) {
        result.push({
          id: "in_city",
          title: `In ${selectedCity}`,
          rawApartments: inCityRaw,
          apartments: transformApartments(inCityRaw),
        });
      }
    }
    for (const s of baseSections) {
      if (!result.some((r) => r.id === s.id)) result.push(s);
    }
    return result;
  }, [query.data, preferences, selectedCity]);

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
