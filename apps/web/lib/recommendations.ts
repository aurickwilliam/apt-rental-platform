// Web recommendation scoring, ported from the mobile app's soft-ranking rules
// (apps/mobile/app/(tabs)/components/search/useSearchSections.ts
// `scorePreferences`). Preferences are ranking signals only — never filters.
//
// Two deliberate deltas from mobile, both documented:
// - `hasDisability` adds no points: the website perk catalogue
//   (app/components/inputs/perks.ts) has no `wheelchair` identifier, and
//   matches must not be invented. If a wheelchair identifier is ever added,
//   mirror the mobile `+1` here.
// - Final tie-break is apartment id ascending (mobile stops at rating).
//   Keeps ordering deterministic across renders.
//
// This module stays free of workspace imports so node:test can load it
// directly, matching lib/tenant-preferences.ts.

// This module is intentionally self-contained (no runtime imports) so
// node:test can load it directly, matching lib/tenant-preferences.ts.
// Callers pass the shared TenantPreferences object; only the fields below
// are read (structural typing accepts the full object).

/** Subset of TenantPreferences read by the scorer. */
export interface RecommendationPreferences {
  selectedCities: string[];
  budgetMin: number;
  budgetMax: number;
  bedroomCount: string | null;
  householdSize: string | null;
  hasPets: boolean;
  hasParking: boolean;
  hasSmoker: boolean;
  hasDisability: boolean;
}

// Mirrors PREFERENCE_BUDGET_MIN/MAX in ./tenant-preferences.ts. A test
// asserts equality so the two cannot drift silently.
export const RECOMMENDATION_DEFAULT_BUDGET_MIN = 5_000;
export const RECOMMENDATION_DEFAULT_BUDGET_MAX = 100_000;

export const RECOMMENDATION_LIMIT = 8;

/** Minimum listing fields needed for scoring. All optional except id. */
export interface RecommendationCandidate {
  id: string;
  city?: string | null;
  monthly_rent?: number | null;
  no_bedrooms?: number | null;
  amenities?: string[] | null;
  is_verified?: boolean | null;
  average_rating?: number | null;
}

function isDefaultBudget(prefs: RecommendationPreferences): boolean {
  return (
    prefs.budgetMin === RECOMMENDATION_DEFAULT_BUDGET_MIN &&
    prefs.budgetMax === RECOMMENDATION_DEFAULT_BUDGET_MAX
  );
}

/**
 * Mirrors mobile `hasPersonalization`: default budget alone, with no cities,
 * bedroom/household choice, or lifestyle flags, is not meaningful. Callers
 * show the default Browse experience when this returns false.
 */
export function hasMeaningfulPreferences(
  prefs: RecommendationPreferences | null | undefined,
): boolean {
  if (!prefs) return false;
  if (prefs.selectedCities.length > 0) return true;
  if (!isDefaultBudget(prefs)) return true;
  if (prefs.bedroomCount !== null) return true;
  if (prefs.householdSize !== null) return true;
  if (prefs.hasPets) return true;
  if (prefs.hasParking) return true;
  if (prefs.hasSmoker) return true;
  if (prefs.hasDisability) return true;
  return false;
}

/**
 * Score one listing against saved preferences. Raw `budgetMin`/`budgetMax`
 * are used as-is (never clamped to Browse bounds). Higher is better;
 * 0 or below means "not recommended".
 */
export function scoreListing(
  raw: RecommendationCandidate,
  prefs: RecommendationPreferences,
): number {
  let score = 0;

  if (prefs.selectedCities.length > 0) {
    if (raw.city != null && prefs.selectedCities.includes(raw.city)) score += 3;
    else return 0; // city is a hard gate when cities are set (mobile parity)
  } else {
    score += 1; // no city preference, mild baseline
  }

  const rent = raw.monthly_rent ?? 0;
  if (rent >= prefs.budgetMin && rent <= prefs.budgetMax) score += 2;
  else {
    const dist = Math.min(
      Math.abs(rent - prefs.budgetMin),
      Math.abs(rent - prefs.budgetMax),
    );
    if (dist < 5000) score += 1;
  }

  if (prefs.bedroomCount === "1-2 Bedrooms") {
    if ((raw.no_bedrooms ?? 0) >= 1 && (raw.no_bedrooms ?? 0) <= 2) score += 2;
    else if (raw.no_bedrooms === 3) score += 1;
  } else if (prefs.bedroomCount === "2-4 Bedrooms") {
    if ((raw.no_bedrooms ?? 0) >= 2 && (raw.no_bedrooms ?? 0) <= 4) score += 2;
    else if (raw.no_bedrooms === 1) score += 1;
  } else if (prefs.bedroomCount === "4+ Bedrooms") {
    if ((raw.no_bedrooms ?? 0) >= 4) score += 3;
    else if (raw.no_bedrooms === 3) score += 1;
  } else {
    score += 1;
  }

  // Amenity identifiers verified against app/components/inputs/perks.ts:
  // petfriendly, parking, nonsmoking exist; wheelchair does not.
  const amenities: string[] = raw.amenities ?? [];
  if (prefs.hasPets && amenities.includes("petfriendly")) score += 2;
  else if (prefs.hasPets) score -= 1;
  if (prefs.hasParking && amenities.includes("parking")) score += 1;
  if (prefs.hasSmoker && amenities.includes("nonsmoking")) score += 1;
  // hasDisability intentionally unscored (no web identifier).

  if (raw.is_verified) score += 1;

  return score;
}

export interface ScoredCandidate<T extends RecommendationCandidate> {
  candidate: T;
  score: number;
}

/**
 * Rank candidates: score desc, rating desc, id asc. Filters out
 * non-positive scores and caps at `limit`. Deterministic for equal inputs.
 */
export function rankCandidates<T extends RecommendationCandidate>(
  candidates: T[],
  prefs: RecommendationPreferences,
  limit: number = RECOMMENDATION_LIMIT,
): ScoredCandidate<T>[] {
  const seen = new Set<string>();
  const deduped: T[] = [];
  for (const c of candidates) {
    if (seen.has(c.id)) continue;
    seen.add(c.id);
    deduped.push(c);
  }
  return deduped
    .map((candidate) => ({ candidate, score: scoreListing(candidate, prefs) }))
    .filter((s) => s.score > 0)
    .sort(
      (a, b) =>
        b.score - a.score ||
        (b.candidate.average_rating ?? 0) - (a.candidate.average_rating ?? 0) ||
        (a.candidate.id < b.candidate.id ? -1 : a.candidate.id > b.candidate.id ? 1 : 0),
    )
    .slice(0, limit);
}
