// Deterministic recommendation policy shared by web and native.
//
// Stage 1 decides eligibility (city, saved budget, known household capacity,
// explicit smoking ban, discovery visibility). Stage 2 ranks the eligible
// candidates with the optional preference weights that predate this module.
//
// Deliberately free of runtime workspace/SDK imports so node:test can load it
// directly (same precedent as web `lib/tenant-preferences.ts`). The CAMANAVA
// list below mirrors `@repo/constants` `CAMANAVA_CITIES`.
//
// Documented unknown-data policy:
// - A missing/invalid `max_occupants` is unconfirmed, never proof that the
//   household fits. Unknown capacities stay eligible and earn no chip.
// - APT has no explicit pet-ban, species or pet-count field on a listing, so
//   missing pet information cannot exclude a listing. Only the affirmative
//   `petfriendly` amenity is scored/explained.
// - Missing smoking policy is unconfirmed. Only an explicit `nonsmoking`
//   amenity excludes a household with a smoker.

/** Mirrors the web/mobile preferences contract (`PREFERENCE_BUDGET_*`). */
export const RECOMMENDATION_DEFAULT_BUDGET_MIN = 5_000;
export const RECOMMENDATION_DEFAULT_BUDGET_MAX = 100_000;
/** Maximum cards in the personalized section. */
export const RECOMMENDATION_LIMIT = 8;
/**
 * Bounded candidate read. Strict filters run in the query before this limit,
 * so the carousel is never filled by widening the tenant's requirements.
 */
export const RECOMMENDATION_CANDIDATE_LIMIT = 200;
export const RECOMMENDATION_REASON_LIMIT = 2;

/** Mirrors `CAMANAVA_CITIES`; keep in sync with `@repo/constants`. */
const CAMANAVA_CITIES = ["Caloocan", "Malabon", "Navotas", "Valenzuela"] as const;
const CAMANAVA_CITY_KEYS = new Set(CAMANAVA_CITIES.map((city) => city.toLowerCase()));

export interface RecommendationPreferences {
  selectedCities: string[];
  budgetMin?: number;
  budgetMax?: number;
  bedroomCount?: string | null;
  householdSize?: string | null;
  hasPets?: boolean;
  hasParking?: boolean;
  hasSmoker?: boolean;
  hasDisability?: boolean;
}

export interface RecommendationCandidate {
  id: string;
  city?: string | null;
  monthly_rent?: number | null;
  no_bedrooms?: number | null;
  max_occupants?: number | null;
  amenities?: string[] | null;
  is_verified?: boolean | null;
  average_rating?: number | null;
  deleted_at?: string | null;
  is_hidden_by_admin?: boolean | null;
  status?: string | null;
}

export type RecommendationReason =
  | "Within budget"
  | "Preferred city"
  | "Bedroom match"
  | "Parking available"
  | "Pet-friendly";

export interface RecommendationRankingOptions {
  /**
   * Mobile's amenity catalogue has `wheelchair`, so it can honour the
   * accessibility preference. Web does not, and must not invent the match.
   */
  accessibilitySignal?: boolean;
}

export function normalizedRecommendationCity(city: string | null | undefined): string {
  return typeof city === "string" ? city.trim().replace(/\s+/g, " ").toLowerCase() : "";
}

/** Whole-name city comparison; barangays and partial names never match. */
export function matchesPreferredCity(
  city: string | null | undefined,
  cities: readonly string[],
): boolean {
  const normalized = normalizedRecommendationCity(city);
  return (
    normalized !== "" &&
    cities.some((saved) => normalizedRecommendationCity(saved) === normalized)
  );
}

/**
 * Preserve absence instead of turning parser defaults into requirements.
 * Returns null for a blob without the stored preferences shape.
 */
export function parseRecommendationPreferences(
  raw: unknown,
): RecommendationPreferences | null {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  const saved = raw as Record<string, unknown>;
  if (!Array.isArray(saved.selectedCities)) return null;

  const optionalNumber = (value: unknown): number | undefined => {
    if (value === undefined || value === null) return undefined;
    return typeof value === "number" ? value : Number.NaN;
  };

  return {
    selectedCities: saved.selectedCities.filter(
      (city): city is string => typeof city === "string",
    ),
    budgetMin: optionalNumber(saved.budgetMin),
    budgetMax: optionalNumber(saved.budgetMax),
    bedroomCount: typeof saved.bedroomCount === "string" ? saved.bedroomCount : null,
    householdSize: typeof saved.householdSize === "string" ? saved.householdSize : null,
    hasPets: saved.hasPets === true,
    hasParking: saved.hasParking === true,
    hasSmoker: saved.hasSmoker === true,
    hasDisability: saved.hasDisability === true,
  };
}

export type RecommendationBudget =
  | { status: "unset" }
  | { status: "invalid" }
  | { status: "configured"; min: number; max: number };

/**
 * The full ₱5,000–₱100,000 range doubles as the cross-platform cleared/default
 * sentinel, so it cannot prove the tenant chose a limit. Older blobs have no
 * explicit-selection flag; a partial or malformed pair is handled as invalid
 * rather than as an artificial default range.
 */
export function recommendationBudget(
  prefs: Partial<RecommendationPreferences>,
): RecommendationBudget {
  const { budgetMin: min, budgetMax: max } = prefs;
  if (min === undefined && max === undefined) return { status: "unset" };
  if (
    typeof min !== "number" ||
    typeof max !== "number" ||
    !Number.isFinite(min) ||
    !Number.isFinite(max) ||
    min < 0 ||
    min > max
  ) {
    return { status: "invalid" };
  }
  if (min === RECOMMENDATION_DEFAULT_BUDGET_MIN && max === RECOMMENDATION_DEFAULT_BUDGET_MAX) {
    return { status: "unset" };
  }
  return { status: "configured", min, max };
}

export type RecommendationPreferenceIssue = "budget" | "city";

/** Unusable saved data blocks recommendations instead of guessing. */
export function recommendationPreferenceIssue(
  prefs: RecommendationPreferences,
): RecommendationPreferenceIssue | null {
  if (recommendationBudget(prefs).status === "invalid") return "budget";
  if (
    prefs.selectedCities.some(
      (city) => !CAMANAVA_CITY_KEYS.has(normalizedRecommendationCity(city)),
    )
  ) {
    return "city";
  }
  return null;
}

/**
 * Fewest people a saved household option can represent. The household options
 * are ranges, so only a capacity provably below this bound excludes a listing;
 * a retained range is never a claim that its upper bound fits.
 */
export function minimumHouseholdSize(value: string | null | undefined): number | null {
  switch (value) {
    case "Single":
      return 1;
    case "Family of 2":
      return 2;
    case "3 - 4 Persons":
      return 3;
    case "5 - 6 Persons":
      return 5;
    case "7+ Persons":
      return 7;
    default:
      return value && /^[1-9]\d*$/.test(value) ? Number(value) : null;
  }
}

const BEDROOM_PREFERENCES = new Set([
  "1-2 Bedrooms",
  "2-4 Bedrooms",
  "4+ Bedrooms",
]);

function isKnownBedroomPreference(value: string | null | undefined): boolean {
  return typeof value === "string" && BEDROOM_PREFERENCES.has(value);
}

export function hasMeaningfulPreferences(
  prefs: RecommendationPreferences | null | undefined,
): boolean {
  if (!prefs) return false;
  return (
    prefs.selectedCities.length > 0 ||
    recommendationBudget(prefs).status !== "unset" ||
    isKnownBedroomPreference(prefs.bedroomCount) ||
    minimumHouseholdSize(prefs.householdSize) !== null ||
    prefs.hasPets === true ||
    prefs.hasParking === true ||
    prefs.hasSmoker === true ||
    prefs.hasDisability === true
  );
}

function hasAmenity(
  raw: RecommendationCandidate,
  amenity: string,
): boolean {
  return Array.isArray(raw.amenities) && raw.amenities.includes(amenity);
}

/** Stage 1: strict eligibility. */
export function isRecommendationEligible(
  raw: RecommendationCandidate,
  prefs: RecommendationPreferences,
): boolean {
  if (recommendationPreferenceIssue(prefs)) return false;

  // Discovery visibility, mirrored by the candidate query and RLS.
  if (raw.deleted_at != null) return false;
  if (raw.is_hidden_by_admin === true) return false;
  if (
    raw.status != null &&
    raw.status !== "available" &&
    raw.status !== "unverified"
  ) {
    return false;
  }

  // Monthly rent only: deposits, advance and fees never affect eligibility.
  const rent = raw.monthly_rent;
  if (typeof rent !== "number" || !Number.isFinite(rent) || rent <= 0) return false;

  if (
    prefs.selectedCities.length > 0 &&
    !matchesPreferredCity(raw.city, prefs.selectedCities)
  ) {
    return false;
  }

  const budget = recommendationBudget(prefs);
  if (budget.status === "configured" && (rent < budget.min || rent > budget.max)) {
    return false;
  }

  const household = minimumHouseholdSize(prefs.householdSize);
  const capacity = raw.max_occupants;
  if (
    household !== null &&
    typeof capacity === "number" &&
    Number.isFinite(capacity) &&
    capacity > 0 &&
    capacity < household
  ) {
    return false;
  }

  // A smoker must not be placed in an explicitly non-smoking listing.
  if (prefs.hasSmoker === true && hasAmenity(raw, "nonsmoking")) return false;

  // No explicit pet-ban/species field exists; unknown pet policy stays
  // unconfirmed rather than being treated as "allowed" or as a ban.
  return true;
}

/** Up to two verified matches, in deterministic priority. */
export function recommendationReasons(
  raw: RecommendationCandidate,
  prefs: Partial<RecommendationPreferences> | null | undefined,
): RecommendationReason[] {
  if (!prefs) return [];

  const reasons: RecommendationReason[] = [];
  const cities = prefs.selectedCities ?? [];
  if (matchesPreferredCity(raw.city, cities)) reasons.push("Preferred city");

  const budget = recommendationBudget(prefs);
  const rent = raw.monthly_rent;
  if (
    budget.status === "configured" &&
    typeof rent === "number" &&
    Number.isFinite(rent) &&
    rent > 0 &&
    rent >= budget.min &&
    rent <= budget.max
  ) {
    reasons.push("Within budget");
  }

  const bedrooms = raw.no_bedrooms;
  if (
    typeof bedrooms === "number" &&
    Number.isInteger(bedrooms) &&
    ((prefs.bedroomCount === "1-2 Bedrooms" && bedrooms >= 1 && bedrooms <= 2) ||
      (prefs.bedroomCount === "2-4 Bedrooms" && bedrooms >= 2 && bedrooms <= 4) ||
      (prefs.bedroomCount === "4+ Bedrooms" && bedrooms >= 4))
  ) {
    reasons.push("Bedroom match");
  }

  if (prefs.hasPets === true && hasAmenity(raw, "petfriendly")) {
    reasons.push("Pet-friendly");
  }
  if (prefs.hasParking === true && hasAmenity(raw, "parking")) {
    reasons.push("Parking available");
  }

  return reasons.slice(0, RECOMMENDATION_REASON_LIMIT);
}

/**
 * Stage 2: the existing optional preference weights, applied only to eligible
 * candidates. A listing may stay eligible without matching an optional
 * preference; it simply ranks lower and never earns that reason chip.
 */
function scoreEligibleListing(
  raw: RecommendationCandidate,
  prefs: RecommendationPreferences,
  options: RecommendationRankingOptions,
): number {
  let score = prefs.selectedCities.length > 0 ? 3 : 1;
  if (recommendationBudget(prefs).status === "configured") score += 2;

  const bedrooms = raw.no_bedrooms;
  if (prefs.bedroomCount === "1-2 Bedrooms") {
    if (typeof bedrooms === "number" && Number.isInteger(bedrooms) && bedrooms >= 1 && bedrooms <= 2) {
      score += 2;
    } else if (bedrooms === 3) {
      score += 1;
    }
  } else if (prefs.bedroomCount === "2-4 Bedrooms") {
    if (typeof bedrooms === "number" && Number.isInteger(bedrooms) && bedrooms >= 2 && bedrooms <= 4) {
      score += 2;
    } else if (bedrooms === 1) {
      score += 1;
    }
  } else if (prefs.bedroomCount === "4+ Bedrooms") {
    if (typeof bedrooms === "number" && Number.isInteger(bedrooms) && bedrooms >= 4) {
      score += 3;
    } else if (bedrooms === 3) {
      score += 1;
    }
  } else {
    score += 1;
  }

  if (prefs.hasPets === true) {
    score += hasAmenity(raw, "petfriendly") ? 2 : -1;
  }
  if (prefs.hasParking === true && hasAmenity(raw, "parking")) score += 1;
  if (
    prefs.hasSmoker === true &&
    hasAmenity(raw, "smoking") &&
    !hasAmenity(raw, "nonsmoking")
  ) {
    score += 1;
  }
  if (
    options.accessibilitySignal &&
    prefs.hasDisability === true &&
    hasAmenity(raw, "wheelchair")
  ) {
    score += 1;
  }
  if (raw.is_verified === true) score += 1;

  return score;
}

/** Score an eligible listing; ineligible candidates always score 0. */
export function scoreListing(
  raw: RecommendationCandidate,
  prefs: RecommendationPreferences,
  options: RecommendationRankingOptions = {},
): number {
  return isRecommendationEligible(raw, prefs)
    ? scoreEligibleListing(raw, prefs, options)
    : 0;
}

export interface ScoredCandidate<T extends RecommendationCandidate> {
  candidate: T;
  score: number;
}

/**
 * Deduplicate by id, drop ineligible candidates, then order deterministically:
 * score desc, rating desc, id ascending. The result is always bounded.
 */
export function rankCandidates<T extends RecommendationCandidate>(
  candidates: T[],
  prefs: RecommendationPreferences,
  limit: number = RECOMMENDATION_LIMIT,
  options: RecommendationRankingOptions = {},
): ScoredCandidate<T>[] {
  const seen = new Set<string>();
  return candidates
    .filter((raw) => {
      if (seen.has(raw.id)) return false;
      seen.add(raw.id);
      return isRecommendationEligible(raw, prefs);
    })
    .map((candidate) => ({
      candidate,
      score: scoreEligibleListing(candidate, prefs, options),
    }))
    .sort(
      (a, b) =>
        b.score - a.score ||
        (b.candidate.average_rating ?? 0) - (a.candidate.average_rating ?? 0) ||
        a.candidate.id.localeCompare(b.candidate.id, "en"),
    )
    .slice(0, Math.max(0, limit));
}

export type RecommendationStatus = "ready" | "empty" | "invalid" | "error";

export const RECOMMENDATION_MESSAGES = {
  empty: {
    title: "No apartments match your preferences yet.",
    description:
      "Try adjusting your budget or preferred location to discover more available apartments.",
  },
  invalid: {
    title: "Review your rental preferences",
    description:
      "Check your saved budget and preferred cities to get recommendations.",
  },
  error: {
    title: "Recommendations couldn't load",
    description: "Please try again. Your preferences have not changed.",
  },
} as const;

export interface RecommendationListing extends RecommendationCandidate {
  name: string;
  barangay?: string | null;
  no_bathrooms?: number | null;
  area_sqm?: number | null;
  apartment_images?:
    | {
        url?: string | null;
        url_thumb?: string | null;
        is_cover?: boolean | null;
        created_at?: string | null;
      }[]
    | null;
}

export const RECOMMENDATION_SELECT =
  "id,name,barangay,city,monthly_rent,no_bedrooms,no_bathrooms,area_sqm,max_occupants,amenities,is_verified,average_rating,deleted_at,is_hidden_by_admin,status,apartment_images(id,url,url_thumb,is_cover,created_at)";

/**
 * Structural slice of the caller-bound Supabase query builder. Always pass the
 * cookie-bound client (web) or the mobile client, never a service-role client.
 */
export interface RecommendationQuery
  extends PromiseLike<{
    data: RecommendationListing[] | null;
    error: { message: string } | null;
  }> {
  is(column: string, value: null): RecommendationQuery;
  eq(column: string, value: boolean): RecommendationQuery;
  in(column: string, values: string[]): RecommendationQuery;
  gt(column: string, value: number): RecommendationQuery;
  gte(column: string, value: number): RecommendationQuery;
  lte(column: string, value: number): RecommendationQuery;
  or(filters: string): RecommendationQuery;
  order(
    column: string,
    options: { ascending: boolean; nullsFirst?: boolean; referencedTable?: string },
  ): RecommendationQuery;
  limit(count: number, options?: { referencedTable?: string }): RecommendationQuery;
  abortSignal(signal: AbortSignal): RecommendationQuery;
}

export interface RecommendationClient {
  from(table: "apartments"): { select(columns: string): RecommendationQuery };
}

/**
 * One bounded read with the strict filters applied server-side before the
 * limit. Text prefilters are a superset; normalized whole-name city equality
 * in `isRecommendationEligible` stays authoritative.
 */
export async function fetchRecommendationCandidates(
  client: RecommendationClient,
  prefs: RecommendationPreferences,
  signal?: AbortSignal,
): Promise<RecommendationListing[]> {
  if (!hasMeaningfulPreferences(prefs) || recommendationPreferenceIssue(prefs)) {
    return [];
  }

  let query = client
    .from("apartments")
    .select(RECOMMENDATION_SELECT)
    .is("deleted_at", null)
    .eq("is_hidden_by_admin", false)
    .in("status", ["available", "unverified"])
    .gt("monthly_rent", 0);

  const budget = recommendationBudget(prefs);
  if (budget.status === "configured") {
    query = query.gte("monthly_rent", budget.min).lte("monthly_rent", budget.max);
  }

  if (prefs.selectedCities.length > 0) {
    query = query.or(
      prefs.selectedCities
        .map((city) => `city.ilike."*${normalizedRecommendationCity(city)}*"`)
        .join(","),
    );
  }

  const household = minimumHouseholdSize(prefs.householdSize);
  if (household !== null) {
    query = query.or(
      `max_occupants.is.null,max_occupants.lte.0,max_occupants.gte.${household}`,
    );
  }

  if (prefs.hasSmoker === true) {
    query = query.or("amenities.is.null,amenities.not.cs.{nonsmoking}");
  }

  let ordered = query
    .order("is_verified", { ascending: false })
    .order("average_rating", { ascending: false, nullsFirst: false })
    .order("id", { ascending: true })
    // One photo is enough for a card: the cover first, otherwise the oldest.
    .order("is_cover", { referencedTable: "apartment_images", ascending: false })
    .order("created_at", { referencedTable: "apartment_images", ascending: true })
    .order("id", { referencedTable: "apartment_images", ascending: true })
    .limit(1, { referencedTable: "apartment_images" })
    .limit(RECOMMENDATION_CANDIDATE_LIMIT);
  if (signal) ordered = ordered.abortSignal(signal);

  const { data, error } = await ordered;

  if (error) {
    throw new Error("Couldn't load recommendations. Please try again.", {
      cause: error,
    });
  }

  return (data ?? []).filter((raw) => isRecommendationEligible(raw, prefs));
}
