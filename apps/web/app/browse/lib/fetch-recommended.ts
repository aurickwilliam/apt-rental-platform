import {
  fetchRecommendationCandidates,
  hasMeaningfulPreferences,
  parseRecommendationPreferences,
  rankCandidates,
  recommendationPreferenceIssue,
  recommendationReasons,
  RECOMMENDATION_LIMIT,
  type RecommendationClient,
  type RecommendationListing,
} from "@/lib/recommendations";
import type { BrowseApartment } from "./fetch-browse-results";
import type { BrowseSection } from "./fetch-browse-sections";

export const RECOMMENDED_SECTION_ID = "for_you";
export const RECOMMENDED_SECTION_TITLE = "Recommended for You";
export const RECOMMENDED_SECTION_SUBTITLE =
  "Apartments selected based on your rental preferences.";

function toRecommendedApartment(row: RecommendationListing): BrowseApartment {
  const images = row.apartment_images ?? [];
  const cover = images.find((image) => image.is_cover) ?? images[0];
  return {
    id: row.id,
    name: row.name,
    city: row.city ?? undefined,
    location: [row.barangay, row.city].filter(Boolean).join(", "),
    price: row.monthly_rent ?? 0,
    rating: row.average_rating ?? 0,
    isVerified: row.is_verified === true,
    image: cover?.url_thumb ?? cover?.url ?? "/images/house-check.png",
    bedrooms: row.no_bedrooms ?? undefined,
    bathrooms: row.no_bathrooms ?? undefined,
    areaSqm: row.area_sqm ?? undefined,
    maxOccupants: row.max_occupants ?? undefined,
    amenities: row.amenities ?? undefined,
  };
}

/**
 * Pure assembly from already-eligible candidates. Generic sections are never
 * mutated. `null` means the tenant has no saved personalization, not an empty
 * or failed request.
 */
export function buildRecommendedSection(
  candidates: BrowseApartment[],
  savedPreferences: unknown,
  limit: number = RECOMMENDATION_LIMIT,
): BrowseSection | null {
  const prefs = parseRecommendationPreferences(savedPreferences);
  if (!prefs || !hasMeaningfulPreferences(prefs)) return null;

  const seen = new Set<string>();
  const pool = candidates.filter((apartment) => {
    if (seen.has(apartment.id)) return false;
    seen.add(apartment.id);
    return true;
  });

  const ranked = rankCandidates(
    pool.map((apartment) => ({
      id: apartment.id,
      city: apartment.city ?? null,
      monthly_rent: apartment.price ?? 0,
      no_bedrooms: apartment.bedrooms ?? null,
      max_occupants: apartment.maxOccupants ?? null,
      amenities: apartment.amenities ?? [],
      is_verified: apartment.isVerified ?? false,
      average_rating: apartment.rating ?? 0,
    })),
    prefs,
    limit,
  );

  const byId = new Map(pool.map((apartment) => [apartment.id, apartment]));
  const apartments = ranked
    .map(({ candidate }) => byId.get(candidate.id))
    .filter((apartment): apartment is BrowseApartment => apartment !== undefined);

  return {
    id: RECOMMENDED_SECTION_ID,
    title: RECOMMENDED_SECTION_TITLE,
    subtitle: RECOMMENDED_SECTION_SUBTITLE,
    apartments,
    recommendationStatus: recommendationPreferenceIssue(prefs)
      ? "invalid"
      : apartments.length > 0
        ? "ready"
        : "empty",
    recommendationReasons: Object.fromEntries(
      ranked.map(({ candidate }) => [
        candidate.id,
        recommendationReasons(candidate, prefs),
      ]),
    ),
    seeAllHref: null,
  };
}

/**
 * Caller-bound, independently filtered candidates. A failed or empty read
 * never falls back to the generic expensive/out-of-city pool.
 */
export async function loadRecommendedSection(
  client: RecommendationClient,
  savedPreferences: unknown,
): Promise<BrowseSection | null> {
  const prefs = parseRecommendationPreferences(savedPreferences);
  if (!prefs || !hasMeaningfulPreferences(prefs)) return null;

  const fallback = buildRecommendedSection([], savedPreferences);
  if (recommendationPreferenceIssue(prefs)) return fallback;

  try {
    const rows = await fetchRecommendationCandidates(client, prefs);
    return buildRecommendedSection(rows.map(toRecommendedApartment), savedPreferences);
  } catch (error) {
    console.error("Recommendation read failed", error);
    return fallback ? { ...fallback, recommendationStatus: "error" } : null;
  }
}
