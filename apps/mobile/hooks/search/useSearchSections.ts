import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@repo/supabase";
import type { ApartmentCardProps } from "components/cards/ApartmentCard";
import { hasMeaningfulPreferences, normalizedRecommendationCity, rankCandidates, recommendationPreferenceIssue, scoreListing, type RecommendationPreferences, type RecommendationStatus } from "@repo/utils/recommendations";
import { fetchPersonalizedCandidates } from "@/service/search/recommendations";

export type SearchSection = {
  id: string;
  title: string;
  apartments: ApartmentCardProps[];
  rawApartments: any[];
  recommendationStatus?: RecommendationStatus | "loading";
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
  preferences?: RecommendationPreferences | null;
  accountId?: string;
};

export const scorePreferences = (raw: Parameters<typeof scoreListing>[0], prefs: RecommendationPreferences) =>
  scoreListing(raw, prefs, { accessibilitySignal: true });

export function useSearchSections({ selectedCity, committedSearch, enabled = true, preferences = null, accountId }: UseSearchSectionsParams) {
  // Tenant preferences personalize client-side (below); `p_filters` is reserved for explicit search filters.
  const query = useQuery({
    queryKey: ["searchSections", selectedCity, committedSearch] as const,
    queryFn: async ({ signal }) => {
      const { data, error } = await supabase.rpc("get_search_sections", {
        p_city: selectedCity,
        p_search: committedSearch || undefined,
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

  const hasPreferences = hasMeaningfulPreferences(preferences);
  const issue = preferences ? recommendationPreferenceIssue(preferences) : null;
  const personalEnabled = enabled && hasPreferences && !issue && !!accountId;
  const personalized = useQuery({
    queryKey: ["recommendationCandidates", accountId, preferences ? JSON.stringify(preferences) : null],
    queryFn: ({ signal }) => fetchPersonalizedCandidates(preferences!, signal),
    enabled: personalEnabled,
    staleTime: 30_000,
    gcTime: 5 * 60 * 1000,
  });

  // Personalized sections: strict eligibility, then optional ranking. Generic
  // sections remain untouched and are never used as recommendation fallbacks.
  const sections = useMemo(() => {
    const baseSections = query.data ?? [];
    if (!preferences || !hasPreferences) return baseSections;

    const forYouRaw = rankCandidates(personalized.data ?? [], preferences, SECTION_LIMIT, { accessibilitySignal: true }).map((item) => item.candidate);
    const inCityRaw = forYouRaw.filter((raw) => normalizedRecommendationCity(raw.city) === normalizedRecommendationCity(selectedCity));

    const result: SearchSection[] = [];
    {
      result.push({
        id: "for_you",
        title: "Recommended for You",
        rawApartments: forYouRaw,
        apartments: transformApartments(forYouRaw),
        recommendationStatus: issue ? "invalid" : personalized.isError ? "error" : !accountId || personalized.isLoading ? "loading" : forYouRaw.length ? "ready" : "empty",
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
  }, [query.data, preferences, hasPreferences, selectedCity, personalized.data, personalized.isError, personalized.isLoading, issue, accountId]);

  return {
    sections,
    isLoading: query.isLoading,
    isFetching: query.isFetching || personalized.isFetching,
    error: (query.error as Error)?.message ?? null,
    refetch: () => Promise.all([query.refetch(), ...(personalEnabled ? [personalized.refetch()] : [])]),
  };
}
