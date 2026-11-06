// Browse rows shared by the web Browse page and the mobile Explore tab: how a
// tenant's saved preferences become rows of apartments, how listings are scored
// for "Recommended for You", and how a page is padded to its minimum row count.
// Pure and dependency-free: each platform turns a row's criteria into its own
// query and owns the UI.
//
// "Recommended for You" is two stages. Eligibility is strict: a listing outside
// the chosen cities or the saved budget, provably too small for the household,
// or explicitly non-smoking for a smoker is never shown. Ranking is soft: the
// remaining preferences only order the eligible listings. Unknown data never
// excludes: a missing capacity or smoking policy stays eligible.

/** Every Browse row, fixed or personalized, holds up to this many apartments. */
export const BROWSE_ROW_LIMIT = 15;

/** The default Browse page shows at least this many rows (listings permitting). */
export const MIN_BROWSE_ROWS = 9;

/** Saved-preference budget bounds; a budget equal to both counts as unanswered. */
export const BROWSE_DEFAULT_BUDGET_MIN = 5_000;
export const BROWSE_DEFAULT_BUDGET_MAX = 100_000;

/** Preference fields the rows read (structural: the stored preferences object fits). */
export interface BrowseRowPreferences {
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

function isDefaultBudget(prefs: BrowseRowPreferences): boolean {
  return prefs.budgetMin === BROWSE_DEFAULT_BUDGET_MIN && prefs.budgetMax === BROWSE_DEFAULT_BUDGET_MAX;
}

/**
 * A default budget alone, with no cities, bedroom/household choice or lifestyle
 * flags, is not meaningful: callers then show the fixed Browse rows.
 */
export function hasMeaningfulPreferences(prefs: BrowseRowPreferences | null | undefined): boolean {
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

/** Listing fields scoring reads; everything but `id` is optional. */
export interface BrowseRowCandidate {
  id: string;
  city?: string | null;
  monthly_rent?: number | null;
  no_bedrooms?: number | null;
  max_occupants?: number | null;
  amenities?: string[] | null;
  is_verified?: boolean | null;
  average_rating?: number | null;
}

/**
 * Fewest people a saved household option can represent. The options are
 * ranges, so only a capacity provably below this bound excludes a listing.
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

/** A budget the tenant actually chose: finite, ordered and not the default range. */
function configuredBudget(prefs: BrowseRowPreferences): { min: number; max: number } | null {
  const { budgetMin: min, budgetMax: max } = prefs;
  if (!Number.isFinite(min) || !Number.isFinite(max) || min < 0 || min > max) return null;
  if (isDefaultBudget(prefs)) return null;
  return { min, max };
}

/**
 * Stage 1 of "Recommended for You": whether a listing may be recommended at
 * all. City and a chosen budget gate it, as do a household provably larger
 * than the listing's capacity and an explicit non-smoking listing for a smoker.
 */
export function isListingEligible(raw: BrowseRowCandidate, prefs: BrowseRowPreferences): boolean {
  if (prefs.selectedCities.length > 0 && !(raw.city != null && prefs.selectedCities.includes(raw.city))) {
    return false;
  }

  const budget = configuredBudget(prefs);
  if (budget) {
    const rent = raw.monthly_rent;
    if (typeof rent !== "number" || !Number.isFinite(rent) || rent < budget.min || rent > budget.max) {
      return false;
    }
  }

  const household = minimumHouseholdSize(prefs.householdSize);
  const capacity = raw.max_occupants;
  if (household !== null && typeof capacity === "number" && capacity > 0 && capacity < household) {
    return false;
  }

  if (prefs.hasSmoker && (raw.amenities ?? []).includes("nonsmoking")) return false;

  return true;
}

export type BrowseRecommendationReason =
  | "Preferred city"
  | "Within budget"
  | "Bedroom match"
  | "Pet-friendly"
  | "Parking available";

/** At most this many reason chips show on a recommended card. */
export const BROWSE_REASON_LIMIT = 2;

/** Verified matches only (never a claim about unknown data), in fixed priority. */
export function recommendationReasons(
  raw: BrowseRowCandidate,
  prefs: BrowseRowPreferences,
): BrowseRecommendationReason[] {
  const reasons: BrowseRecommendationReason[] = [];
  if (raw.city != null && prefs.selectedCities.includes(raw.city)) reasons.push("Preferred city");

  const budget = configuredBudget(prefs);
  const rent = raw.monthly_rent;
  if (budget && typeof rent === "number" && rent >= budget.min && rent <= budget.max) {
    reasons.push("Within budget");
  }

  const range = prefs.bedroomCount ? BEDROOM_RANGES[prefs.bedroomCount] : undefined;
  const bedrooms = raw.no_bedrooms;
  if (
    range &&
    typeof bedrooms === "number" &&
    bedrooms >= range.min &&
    (range.max === undefined || bedrooms <= range.max)
  ) {
    reasons.push("Bedroom match");
  }

  const amenities = raw.amenities ?? [];
  if (prefs.hasPets && amenities.includes("petfriendly")) reasons.push("Pet-friendly");
  if (prefs.hasParking && amenities.includes("parking")) reasons.push("Parking available");

  return reasons.slice(0, BROWSE_REASON_LIMIT);
}

export interface BrowseScoreOptions {
  /**
   * Whether the platform's amenity catalogue has a `wheelchair` identifier.
   * Mobile does (+1 when the tenant needs accessibility); the website's perk
   * list does not, so it must not invent matches.
   */
  wheelchairAmenity?: boolean;
}

/**
 * Score one listing against saved preferences. Raw `budgetMin`/`budgetMax` are
 * used as-is. Higher is better; 0 or below means "not recommended", which is
 * what an ineligible listing (see `isListingEligible`) always scores.
 */
export function scoreListing(
  raw: BrowseRowCandidate,
  prefs: BrowseRowPreferences,
  { wheelchairAmenity = false }: BrowseScoreOptions = {},
): number {
  if (!isListingEligible(raw, prefs)) return 0;

  let score = 0;

  if (prefs.selectedCities.length > 0) score += 3;
  else score += 1; // no city preference, mild baseline

  const rent = raw.monthly_rent ?? 0;
  if (rent >= prefs.budgetMin && rent <= prefs.budgetMax) score += 2;
  else {
    const dist = Math.min(Math.abs(rent - prefs.budgetMin), Math.abs(rent - prefs.budgetMax));
    if (dist < 5000) score += 1;
  }

  const bedrooms = raw.no_bedrooms ?? 0;
  if (prefs.bedroomCount === "1-2 Bedrooms") {
    if (bedrooms >= 1 && bedrooms <= 2) score += 2;
    else if (raw.no_bedrooms === 3) score += 1;
  } else if (prefs.bedroomCount === "2-4 Bedrooms") {
    if (bedrooms >= 2 && bedrooms <= 4) score += 2;
    else if (raw.no_bedrooms === 1) score += 1;
  } else if (prefs.bedroomCount === "4+ Bedrooms") {
    if (bedrooms >= 4) score += 3;
    else if (raw.no_bedrooms === 3) score += 1;
  } else {
    score += 1;
  }

  const amenities: string[] = raw.amenities ?? [];
  if (prefs.hasPets && amenities.includes("petfriendly")) score += 2;
  else if (prefs.hasPets) score -= 1;
  if (prefs.hasParking && amenities.includes("parking")) score += 1;
  if (prefs.hasSmoker && amenities.includes("nonsmoking")) score += 1;
  if (wheelchairAmenity && prefs.hasDisability && amenities.includes("wheelchair")) score += 1;

  if (raw.is_verified) score += 1;

  return score;
}

export interface ScoredBrowseCandidate<T extends BrowseRowCandidate> {
  candidate: T;
  score: number;
}

/**
 * Rank candidates: score desc, rating desc, id asc. Drops non-positive scores
 * and duplicate ids, and caps at `limit`. Deterministic for equal inputs.
 */
export function rankCandidates<T extends BrowseRowCandidate>(
  candidates: T[],
  prefs: BrowseRowPreferences,
  limit: number = BROWSE_ROW_LIMIT,
  options: BrowseScoreOptions = {},
): ScoredBrowseCandidate<T>[] {
  const seen = new Set<string>();
  const deduped: T[] = [];
  for (const candidate of candidates) {
    if (seen.has(candidate.id)) continue;
    seen.add(candidate.id);
    deduped.push(candidate);
  }
  return deduped
    .map((candidate) => ({ candidate, score: scoreListing(candidate, prefs, options) }))
    .filter((scored) => scored.score > 0)
    .sort(
      (a, b) =>
        b.score - a.score ||
        (b.candidate.average_rating ?? 0) - (a.candidate.average_rating ?? 0) ||
        (a.candidate.id < b.candidate.id ? -1 : a.candidate.id > b.candidate.id ? 1 : 0),
    )
    .slice(0, limit);
}

/** Order of a row's apartments; every order breaks ties by id. */
export type BrowseRowSort = "rating" | "newest" | "price_asc" | "size_desc";

const BROWSE_ROW_SORTS: readonly BrowseRowSort[] = ["rating", "newest", "price_asc", "size_desc"];

/**
 * Which listings a row holds, in platform-neutral terms. Every bound is
 * inclusive and every field is optional; omitted fields do not filter. Each
 * platform maps this onto its own query (the web adds drawer params, mobile
 * queries Supabase directly).
 */
export interface BrowseRowCriteria {
  cities?: string[];
  priceMin?: number;
  priceMax?: number;
  bedroomMin?: number;
  bedroomMax?: number;
  verified?: boolean;
  types?: string[];
  sizeMin?: number;
  furnishing?: string;
  amenities?: string[];
  minRating?: number;
}

/** One Browse row as data, so a platform can run it and tests can read it. */
export interface BrowseRowSpec {
  id: string;
  title: string;
  subtitle: string;
  criteria: BrowseRowCriteria;
  sort: BrowseRowSort;
}

/** Inclusive bedroom bounds of a saved bedroom choice; `max` undefined is open-ended. */
const BEDROOM_RANGES: Record<string, { min: number; max?: number }> = {
  "1-2 Bedrooms": { min: 1, max: 2 },
  "2-4 Bedrooms": { min: 2, max: 4 },
  "4+ Bedrooms": { min: 4 },
};

function citiesGate(cities: string[]): BrowseRowCriteria {
  return cities.length > 0 ? { cities } : {};
}

/**
 * The rows that replace the fixed Browse rows for a tenant with saved
 * preferences, in display order: one per chosen city, budget, bedrooms, pets,
 * parking. A row exists only for an answer the tenant actually gave. When
 * cities are chosen they gate every row. The scored "Recommended for You" row
 * is built separately from a candidate pool.
 */
export function buildPersonalizedRowSpecs(prefs: BrowseRowPreferences | null | undefined): BrowseRowSpec[] {
  if (!prefs || !hasMeaningfulPreferences(prefs)) return [];

  // A repeated city would build two rows with one id.
  const cities = [...new Set(prefs.selectedCities)];
  const gate = citiesGate(cities);
  const rows: BrowseRowSpec[] = [];

  for (const city of cities) {
    rows.push({
      id: `city:${city}`,
      title: `Apartments in ${city}`,
      subtitle: "A city you picked.",
      criteria: { cities: [city] },
      sort: "rating",
    });
  }

  if (!isDefaultBudget(prefs)) {
    rows.push({
      id: "budget",
      title: "Within Your Budget",
      subtitle: `₱${prefs.budgetMin.toLocaleString("en-US")} – ₱${prefs.budgetMax.toLocaleString("en-US")} a month.`,
      criteria: { ...gate, priceMin: prefs.budgetMin, priceMax: prefs.budgetMax },
      sort: "rating",
    });
  }

  const bedroomRange = prefs.bedroomCount ? BEDROOM_RANGES[prefs.bedroomCount] : undefined;
  if (prefs.bedroomCount && bedroomRange) {
    rows.push({
      id: "bedrooms",
      title: prefs.bedroomCount,
      subtitle: "Matches your bedroom choice.",
      criteria: {
        ...gate,
        bedroomMin: bedroomRange.min,
        ...(bedroomRange.max !== undefined ? { bedroomMax: bedroomRange.max } : {}),
      },
      sort: "rating",
    });
  }

  if (prefs.hasPets) {
    rows.push({
      id: "pets",
      title: "Pet-Friendly Homes",
      subtitle: "Because you have pets.",
      criteria: { ...gate, amenities: ["petfriendly"] },
      sort: "rating",
    });
  }

  if (prefs.hasParking) {
    rows.push({
      id: "parking",
      title: "Homes with Parking",
      subtitle: "Because you need parking.",
      criteria: { ...gate, amenities: ["parking"] },
      sort: "rating",
    });
  }

  return rows;
}

/**
 * Rows that pad the page up to MIN_BROWSE_ROWS when saved preferences (or the
 * fixed rows) supply fewer. Chosen cities gate them like every other row.
 * `includeCore` adds the cohorts the fixed rows already cover (Top Rated,
 * Verified, New, Under ₱10k, Studio, Spacious); leave it off when those fixed
 * rows are on the page. Order is display order.
 */
export function buildFillerRowSpecs(
  prefs: Pick<BrowseRowPreferences, "selectedCities"> | null | undefined,
  { includeCore }: { includeCore: boolean },
): BrowseRowSpec[] {
  const gate = citiesGate([...new Set(prefs?.selectedCities ?? [])]);

  const core: BrowseRowSpec[] = [
    {
      id: "top_rated",
      title: "Top Rated",
      subtitle: "Rated 4.5 stars and up.",
      criteria: { ...gate, minRating: 4.5 },
      sort: "rating",
    },
    {
      id: "verified",
      title: "Verified Listings",
      subtitle: "Checked by APT.",
      criteria: { ...gate, verified: true },
      sort: "rating",
    },
    {
      id: "newest",
      title: "New Listings",
      subtitle: "Just added.",
      criteria: { ...gate },
      sort: "newest",
    },
    {
      id: "under_10k",
      title: "Under ₱10k",
      subtitle: "Easy on the budget.",
      criteria: { ...gate, priceMax: 10_000 },
      sort: "price_asc",
    },
    {
      id: "studio",
      title: "Studio Units",
      subtitle: "Compact and simple.",
      criteria: { ...gate, types: ["Studio"] },
      sort: "newest",
    },
    {
      id: "spacious",
      title: "Spacious Homes",
      subtitle: "60 sqm and up.",
      criteria: { ...gate, sizeMin: 60 },
      sort: "size_desc",
    },
  ];

  const extras: BrowseRowSpec[] = [
    {
      id: "family",
      title: "Family-Sized Homes",
      subtitle: "3 or more bedrooms.",
      criteria: { ...gate, bedroomMin: 3 },
      sort: "rating",
    },
    {
      id: "furnished",
      title: "Fully Furnished",
      subtitle: "Move in with nothing to buy.",
      criteria: { ...gate, furnishing: "Fully Furnished" },
      sort: "rating",
    },
    {
      id: "pets",
      title: "Pet-Friendly Homes",
      subtitle: "Pets are welcome.",
      criteria: { ...gate, amenities: ["petfriendly"] },
      sort: "rating",
    },
    {
      id: "parking",
      title: "Homes with Parking",
      subtitle: "Room for your vehicle.",
      criteria: { ...gate, amenities: ["parking"] },
      sort: "rating",
    },
    {
      id: "mid_range",
      title: "₱10k to ₱20k",
      subtitle: "A comfortable middle.",
      criteria: { ...gate, priceMin: 10_000, priceMax: 20_000 },
      sort: "price_asc",
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

function isStringList(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === "string");
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

/**
 * Rebuilds a row spec from untrusted input (a route param, say), keeping only
 * known fields of the right type. Null when it is not a usable spec.
 */
export function parseBrowseRowSpec(value: unknown): BrowseRowSpec | null {
  if (!value || typeof value !== "object") return null;
  const raw = value as Record<string, unknown>;
  if (typeof raw.id !== "string" || typeof raw.title !== "string") return null;
  if (!BROWSE_ROW_SORTS.includes(raw.sort as BrowseRowSort)) return null;
  const input = raw.criteria && typeof raw.criteria === "object" ? (raw.criteria as Record<string, unknown>) : {};

  const criteria: BrowseRowCriteria = {};
  if (isStringList(input.cities) && input.cities.length > 0) criteria.cities = input.cities;
  if (isFiniteNumber(input.priceMin)) criteria.priceMin = input.priceMin;
  if (isFiniteNumber(input.priceMax)) criteria.priceMax = input.priceMax;
  if (isFiniteNumber(input.bedroomMin)) criteria.bedroomMin = input.bedroomMin;
  if (isFiniteNumber(input.bedroomMax)) criteria.bedroomMax = input.bedroomMax;
  if (input.verified === true) criteria.verified = true;
  if (isStringList(input.types) && input.types.length > 0) criteria.types = input.types;
  if (isFiniteNumber(input.sizeMin)) criteria.sizeMin = input.sizeMin;
  if (typeof input.furnishing === "string") criteria.furnishing = input.furnishing;
  if (isStringList(input.amenities) && input.amenities.length > 0) criteria.amenities = input.amenities;
  if (isFiniteNumber(input.minRating)) criteria.minRating = input.minRating;

  return {
    id: raw.id,
    title: raw.title,
    subtitle: typeof raw.subtitle === "string" ? raw.subtitle : "",
    criteria,
    sort: raw.sort as BrowseRowSort,
  };
}
