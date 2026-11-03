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

// One Browse row holds this many apartments; fetch-browse-sections.ts uses the
// same number for the fixed rows (a test keeps the two equal).
export const RECOMMENDATION_LIMIT = 15;

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

/** Inclusive bedroom bounds of a saved bedroom choice; `max` null is open-ended. */
const BEDROOM_RANGES: Record<string, { min: number; max: number | null }> = {
  "1-2 Bedrooms": { min: 1, max: 2 },
  "2-4 Bedrooms": { min: 2, max: 4 },
  "4+ Bedrooms": { min: 4, max: null },
};

/** Order of a row's apartments; every order breaks ties by id. */
export type BrowseRowSort = "rating" | "newest" | "price_asc" | "size_desc";

/**
 * One Browse row, described as data so the server can run it and tests can
 * read it. `params` use the Browse filter-drawer vocabulary
 * (`applyBrowseFilters`), so a row and its See All grid filter the same way.
 */
export interface BrowseRowSpec {
  id: string;
  title: string;
  subtitle: string;
  params: Record<string, string>;
  /** Drawer filters only take an exact bedroom count, so ranges ride beside `params`. */
  bedroomRange?: { min: number; max: number | null };
  /** Lowest average rating, for rows the drawer has no rating filter for. */
  minRating?: number;
  /** Defaults to best rated first. */
  sort?: BrowseRowSort;
  /** Query string for See All, or null when the drawer cannot express the row. */
  seeAllQuery: string | null;
}

function toQuery(params: Record<string, string>): string {
  return new URLSearchParams(params).toString();
}

/**
 * The rows that replace the fixed Browse rows for a tenant with saved
 * preferences, in display order: one per chosen city, budget, bedrooms, pets,
 * parking. A row exists only for an answer the tenant actually gave. When
 * cities are chosen they gate every row, matching `scoreListing`. The scored
 * "Recommended for You" row is built separately from a candidate pool.
 */
export function buildPersonalizedRowSpecs(
  prefs: RecommendationPreferences | null | undefined,
): BrowseRowSpec[] {
  if (!hasMeaningfulPreferences(prefs)) return [];
  const saved = prefs as RecommendationPreferences;

  const gate: Record<string, string> =
    saved.selectedCities.length > 0 ? { locations: saved.selectedCities.join(",") } : {};
  const rows: BrowseRowSpec[] = [];

  for (const city of saved.selectedCities) {
    const params = { locations: city };
    rows.push({
      id: `city:${city}`,
      title: `Apartments in ${city}`,
      subtitle: "A city you picked.",
      params,
      seeAllQuery: toQuery(params),
    });
  }

  if (!isDefaultBudget(saved)) {
    const params = {
      ...gate,
      price_min: String(saved.budgetMin),
      price_max: String(saved.budgetMax),
    };
    rows.push({
      id: "budget",
      title: "Within Your Budget",
      subtitle: `₱${saved.budgetMin.toLocaleString("en-US")} – ₱${saved.budgetMax.toLocaleString("en-US")} a month.`,
      params,
      seeAllQuery: toQuery(params),
    });
  }

  const bedroomRange = saved.bedroomCount ? BEDROOM_RANGES[saved.bedroomCount] : undefined;
  if (saved.bedroomCount && bedroomRange) {
    rows.push({
      id: "bedrooms",
      title: saved.bedroomCount,
      subtitle: "Matches your bedroom choice.",
      params: gate,
      bedroomRange,
      // Only "4+" has an exact twin in the filter drawer.
      seeAllQuery: bedroomRange.max === null ? toQuery({ ...gate, bedrooms: "4+" }) : null,
    });
  }

  if (saved.hasPets) {
    const params = { ...gate, amenities: "petfriendly" };
    rows.push({
      id: "pets",
      title: "Pet-Friendly Homes",
      subtitle: "Because you have pets.",
      params,
      seeAllQuery: toQuery(params),
    });
  }

  if (saved.hasParking) {
    const params = { ...gate, amenities: "parking" };
    rows.push({
      id: "parking",
      title: "Homes with Parking",
      subtitle: "Because you need parking.",
      params,
      seeAllQuery: toQuery(params),
    });
  }

  return rows;
}

/** Every default Browse page shows at least this many rows (listings permitting). */
export const MIN_BROWSE_ROWS = 9;

/**
 * Rows that pad the page up to MIN_BROWSE_ROWS when saved preferences (or the
 * fixed rows) supply fewer. Chosen cities gate them like every other row.
 * `includeCore` adds the cohorts the fixed rows already cover (Top Rated,
 * Verified, New, Under ₱10k, Studio, Spacious); leave it off when those fixed
 * rows are on the page. Order is display order.
 */
export function buildFillerRowSpecs(
  prefs: RecommendationPreferences | null | undefined,
  { includeCore }: { includeCore: boolean },
): BrowseRowSpec[] {
  const cities = prefs?.selectedCities ?? [];
  const gate: Record<string, string> = cities.length > 0 ? { locations: cities.join(",") } : {};
  const seeAll = (params: Record<string, string>) =>
    Object.keys(params).length > 0 ? toQuery(params) : null;

  const core: BrowseRowSpec[] = [
    {
      id: "top_rated",
      title: "Top Rated",
      subtitle: "Rated 4.5 stars and up.",
      params: gate,
      minRating: 4.5,
      seeAllQuery: toQuery({ ...gate, sort: "most_popular" }),
    },
    {
      id: "verified",
      title: "Verified Listings",
      subtitle: "Checked by APT.",
      params: { ...gate, verified: "1" },
      seeAllQuery: toQuery({ ...gate, verified: "1" }),
    },
    {
      id: "newest",
      title: "New Listings",
      subtitle: "Just added.",
      params: gate,
      sort: "newest",
      seeAllQuery: seeAll(gate),
    },
    {
      id: "under_10k",
      title: "Under ₱10k",
      subtitle: "Easy on the budget.",
      params: { ...gate, price_max: "10000" },
      sort: "price_asc",
      seeAllQuery: toQuery({ ...gate, price_max: "10000" }),
    },
    {
      id: "studio",
      title: "Studio Units",
      subtitle: "Compact and simple.",
      params: { ...gate, apt_types: "Studio" },
      sort: "newest",
      seeAllQuery: toQuery({ ...gate, apt_types: "Studio" }),
    },
    {
      id: "spacious",
      title: "Spacious Homes",
      subtitle: "60 sqm and up.",
      params: { ...gate, size_min: "60" },
      sort: "size_desc",
      seeAllQuery: toQuery({ ...gate, size_min: "60" }),
    },
  ];

  const extras: BrowseRowSpec[] = [
    {
      id: "family",
      title: "Family-Sized Homes",
      subtitle: "3 or more bedrooms.",
      params: gate,
      bedroomRange: { min: 3, max: null },
      seeAllQuery: null,
    },
    {
      id: "furnished",
      title: "Fully Furnished",
      subtitle: "Move in with nothing to buy.",
      params: { ...gate, furnishing: "Fully Furnished" },
      seeAllQuery: toQuery({ ...gate, furnishing: "Fully Furnished" }),
    },
    {
      id: "pets",
      title: "Pet-Friendly Homes",
      subtitle: "Pets are welcome.",
      params: { ...gate, amenities: "petfriendly" },
      seeAllQuery: toQuery({ ...gate, amenities: "petfriendly" }),
    },
    {
      id: "parking",
      title: "Homes with Parking",
      subtitle: "Room for your vehicle.",
      params: { ...gate, amenities: "parking" },
      seeAllQuery: toQuery({ ...gate, amenities: "parking" }),
    },
    {
      id: "mid_range",
      title: "₱10k to ₱20k",
      subtitle: "A comfortable middle.",
      params: { ...gate, price_min: "10000", price_max: "20000" },
      sort: "price_asc",
      seeAllQuery: toQuery({ ...gate, price_min: "10000", price_max: "20000" }),
    },
  ];

  return includeCore ? [...core, ...extras] : extras;
}

/**
 * The page's rows: everything in `base` (never trimmed), then `filler` rows
 * whose id is not already shown, until there are `min` rows. Callers pass only
 * rows that have apartments, so an empty row never counts toward the minimum.
 */
export function selectBrowseRows<T extends { id: string }>(
  base: T[],
  filler: T[],
  min: number = MIN_BROWSE_ROWS,
): T[] {
  const rows = [...base];
  const shown = new Set(base.map((row) => row.id));
  for (const row of filler) {
    if (rows.length >= min) break;
    if (shown.has(row.id)) continue;
    shown.add(row.id);
    rows.push(row);
  }
  return rows;
}
