import type { TenantPreferences } from "@/lib/tenant-preferences";
import {
  hasMeaningfulPreferences,
  rankCandidates,
  RECOMMENDATION_LIMIT,
} from "@/lib/recommendations";
import type { BrowseApartment } from "./fetch-browse-results";
import type { BrowseSection } from "./fetch-browse-sections";

export const RECOMMENDED_SECTION_ID = "for_you";
export const RECOMMENDED_SECTION_TITLE = "Recommended for You";
export const RECOMMENDED_SECTION_SUBTITLE = "Based on your rental preferences.";

/**
 * Build a "Recommended for You" section from the already-fetched discovery
 * pool. Pure re-ranking: no extra queries, no filter changes, existing
 * sections untouched. Returns null when preferences are not meaningful or
 * nothing scores above zero.
 */
export function buildRecommendedSection(
  sections: BrowseSection[],
  prefs: TenantPreferences | null | undefined,
  limit: number = RECOMMENDATION_LIMIT,
): BrowseSection | null {
  if (!hasMeaningfulPreferences(prefs)) return null;
  const validPrefs = prefs as TenantPreferences;

  const seen = new Set<string>();
  const pool: BrowseApartment[] = [];
  for (const section of sections) {
    for (const apt of section.apartments) {
      if (seen.has(apt.id)) continue;
      seen.add(apt.id);
      pool.push(apt);
    }
  }
  if (pool.length === 0) return null;

  const ranked = rankCandidates(
    pool.map((apt) => ({
      id: apt.id,
      city: apt.city ?? null,
      monthly_rent: apt.price ?? 0,
      no_bedrooms: apt.bedrooms ?? null,
      amenities: apt.amenities ?? [],
      is_verified: apt.isVerified ?? false,
      average_rating: apt.rating ?? 0,
    })),
    validPrefs,
    limit,
  );
  if (ranked.length === 0) return null;

  const byId = new Map(pool.map((apt) => [apt.id, apt]));
  const apartments = ranked
    .map((s) => byId.get(s.candidate.id))
    .filter((apt): apt is BrowseApartment => apt !== undefined);

  return {
    id: RECOMMENDED_SECTION_ID,
    title: RECOMMENDED_SECTION_TITLE,
    subtitle: RECOMMENDED_SECTION_SUBTITLE,
    apartments,
    seeAllHref: null,
  };
}
