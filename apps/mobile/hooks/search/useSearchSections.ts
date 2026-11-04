import { useQuery } from "@tanstack/react-query";
import type { BrowseRowSpec } from "@repo/utils";
import type { ApartmentCardProps } from "components/cards/ApartmentCard";
import type { TenantPreferences } from "@/hooks/preferences/useUserPreferences";
import { loadDiscoverySections } from "@/service/search/browseDiscoveryService";

export type SearchSection = {
  id: string;
  title: string;
  subtitle?: string;
  apartments: ApartmentCardProps[];
  /** Set for rows built from a spec; See All reads it to list the whole row. */
  spec?: BrowseRowSpec;
};

// The fixed rows the RPC returns, in order.
export const SECTION_DEFS = [
  { id: "verified", title: "Verified in CAMANAVA" },
  { id: "budget_low", title: "Under ₱10k" },
  { id: "studio", title: "Studio Units" },
  { id: "top_rated", title: "Top Rated" },
  { id: "near_you", title: "Near You" },
  { id: "spacious", title: "Spacious (≥60sqm)" },
] as const;

export type SectionId = (typeof SECTION_DEFS)[number]["id"];

type UseSearchSectionsParams = {
  selectedCity: string;
  committedSearch: string;
  enabled?: boolean;
  /** Null shows the fixed rows; callers pass saved preferences only for the default view. */
  preferences?: TenantPreferences | null;
};

export function useSearchSections({
  selectedCity,
  committedSearch,
  enabled = true,
  preferences = null,
}: UseSearchSectionsParams) {
  // Saved preferences are part of the key so changing them reloads the rows.
  const preferencesKey = preferences ? JSON.stringify(preferences) : null;

  const query = useQuery({
    queryKey: ["searchSections", selectedCity, committedSearch, preferencesKey] as const,
    queryFn: ({ signal }) =>
      loadDiscoverySections({ selectedCity, committedSearch, preferences, signal }),
    staleTime: 30_000,
    gcTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
    enabled,
  });

  return {
    sections: query.data ?? [],
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    error: (query.error as Error)?.message ?? null,
    refetch: query.refetch,
  };
}
