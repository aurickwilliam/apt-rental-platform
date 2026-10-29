// Tenant rental preferences shared by the web onboarding wizard and the
// mobile app contract (users.preferences jsonb). This module stays free of
// workspace imports on purpose so node:test can load it directly; option
// membership against @repo/constants is enforced by the save action and the
// wizard, which resolve the barrel normally.

export const PREFERENCE_BUDGET_MIN = 5_000;
export const PREFERENCE_BUDGET_MAX = 100_000;
export const PREFERENCE_BUDGET_STEP = 1_000;

export const BEDROOM_OPTIONS = ["1-2 Bedrooms", "2-4 Bedrooms", "4+ Bedrooms"] as const;

export const HOUSEHOLD_OPTIONS = [
  "Single",
  "Family of 2",
  "3 - 4 Persons",
  "5 - 6 Persons",
  "7+ Persons",
] as const;

export const PARKING_SPOT_OPTIONS = ["1", "2", "3", "4", "5"] as const;

// Mirrors MAX_PET_COUNT / OTHER_PET in @repo/constants (this module cannot
// import workspace packages, see the header).
export const PREFERENCE_MAX_PET_COUNT = 10;
export const PREFERENCE_OTHER_PET = "Other";

export interface BudgetPreset {
  id: string;
  label: string;
  min: number;
  max: number;
}

// UX presets for the budget cards. Labels describe the exact stored
// range; only numeric min/max ever reach Supabase, so mobile compatibility
// is unaffected. Ranges are contiguous by construction: each max is one
// peso below the next min, so every valid budget falls in exactly one
// preset (e.g. ₱14,500 → under-15k, ₱29,500 → 15k-29k).
export const BUDGET_PRESETS: BudgetPreset[] = [
  { id: "under-15k", label: "₱5,000 – ₱14,999", min: 5000, max: 14999 },
  { id: "15k-29k", label: "₱15,000 – ₱29,999", min: 15000, max: 29999 },
  { id: "30k-59k", label: "₱30,000 – ₱59,999", min: 30000, max: 59999 },
  { id: "over-60k", label: "₱60,000 – ₱100,000", min: 60000, max: 100000 },
];

export const BUDGET_CUSTOM_ID = "custom";

/**
 * Parse a typed peso amount for the Custom Range inputs: digits only,
 * snapped to the budget step, clamped to the preference bounds.
 * Returns NaN when nothing parseable was typed (callers fall back to the
 * current value and show an inline error instead of saving NaN).
 */
export function parseBudgetDraftAmount(raw: string): number {
  const digits = raw.replace(/[^0-9]/g, "");
  if (digits === "") return NaN;
  const snapped = Math.round(Number(digits) / PREFERENCE_BUDGET_STEP) * PREFERENCE_BUDGET_STEP;
  return Math.min(PREFERENCE_BUDGET_MAX, Math.max(PREFERENCE_BUDGET_MIN, snapped));
}

/** Order a min/max pair so the minimum never exceeds the maximum. */
export function orderBudgetRange(min: number, max: number): [number, number] {
  return [Math.min(min, max), Math.max(min, max)];
}

/** Exact-match preset id for a range, or null for arbitrary (custom) ranges. */
export function matchBudgetPreset(min: number, max: number): string | null {
  return BUDGET_PRESETS.find((preset) => preset.min === min && preset.max === max)?.id ?? null;
}

export interface TenantPreferences {
  selectedCities: string[];
  budgetMin: number;
  budgetMax: number;
  bedroomCount: string | null;
  householdSize: string | null;
  hasPets: boolean;
  kindOfPets: string[];
  noOfPets: number;
  nameOfPets: string | null;
  hasParking: boolean;
  noOfParkingSpots: number;
  listOfVehicles: string[];
  hasSmoker: boolean;
  hasDisability: boolean;
}

export const DEFAULT_TENANT_PREFERENCES: TenantPreferences = {
  selectedCities: [],
  budgetMin: PREFERENCE_BUDGET_MIN,
  budgetMax: PREFERENCE_BUDGET_MAX,
  bedroomCount: null,
  householdSize: null,
  hasPets: false,
  kindOfPets: [],
  noOfPets: 1,
  nameOfPets: null,
  hasParking: false,
  noOfParkingSpots: 1,
  listOfVehicles: [],
  hasSmoker: false,
  hasDisability: false,
};

function asStringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((v): v is string => typeof v === "string") : [];
}

// Older saved preferences hold a single kind as a string.
function asKindOfPets(value: unknown): string[] {
  if (Array.isArray(value)) return asStringArray(value).filter((kind) => kind !== "");
  return typeof value === "string" && value !== "" ? [value] : [];
}

function asNumber(value: unknown, fallback: number): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

/** Parse a stored preferences blob; null when absent or unusable. */
export function parseTenantPreferences(raw: unknown): TenantPreferences | null {
  if (!raw || typeof raw !== "object") return null;
  const obj = raw as Record<string, unknown>;
  if (!Array.isArray(obj.selectedCities)) return null;
  return {
    selectedCities: asStringArray(obj.selectedCities),
    budgetMin: asNumber(obj.budgetMin, PREFERENCE_BUDGET_MIN),
    budgetMax: asNumber(obj.budgetMax, PREFERENCE_BUDGET_MAX),
    bedroomCount: typeof obj.bedroomCount === "string" ? obj.bedroomCount : null,
    householdSize: typeof obj.householdSize === "string" ? obj.householdSize : null,
    hasPets: Boolean(obj.hasPets),
    kindOfPets: asKindOfPets(obj.kindOfPets),
    noOfPets: asNumber(obj.noOfPets, 1),
    nameOfPets: typeof obj.nameOfPets === "string" ? obj.nameOfPets : null,
    hasParking: Boolean(obj.hasParking),
    noOfParkingSpots: asNumber(obj.noOfParkingSpots, 1),
    listOfVehicles: asStringArray(obj.listOfVehicles),
    hasSmoker: Boolean(obj.hasSmoker),
    hasDisability: Boolean(obj.hasDisability),
  };
}

/** Pet answers: needs at least one kind and a count that fits them. */
export function validatePets(
  prefs: Pick<TenantPreferences, "hasPets" | "kindOfPets" | "noOfPets">,
): string | null {
  if (!prefs.hasPets) return null;
  if (!Array.isArray(prefs.kindOfPets) || prefs.kindOfPets.length === 0) {
    return "Please choose the kind of pets you have.";
  }
  if (
    !Number.isInteger(prefs.noOfPets) ||
    prefs.noOfPets < 1 ||
    prefs.noOfPets > PREFERENCE_MAX_PET_COUNT
  ) {
    return `Please enter how many pets you have (1 to ${PREFERENCE_MAX_PET_COUNT}).`;
  }
  if (prefs.noOfPets < prefs.kindOfPets.length) {
    return "The number of pets cannot be fewer than the kinds you selected.";
  }
  return null;
}

/**
 * Validate a preferences payload before saving. Checks shapes, ranges, and
 * the locally-defined option sets; membership against the canonical
 * CAMANAVA/PETS/VEHICLES lists is enforced by the save action. Returns a
 * user-facing error, or null when valid.
 */
export function validateTenantPreferences(prefs: TenantPreferences): string | null {
  if (!Array.isArray(prefs.selectedCities) || prefs.selectedCities.some((city) => typeof city !== "string")) {
    return "Please choose valid cities.";
  }
  if (
    !Number.isFinite(prefs.budgetMin) ||
    !Number.isFinite(prefs.budgetMax) ||
    prefs.budgetMin < PREFERENCE_BUDGET_MIN ||
    prefs.budgetMax > PREFERENCE_BUDGET_MAX ||
    prefs.budgetMin > prefs.budgetMax
  ) {
    return "Please choose a valid budget range.";
  }
  if (
    prefs.bedroomCount !== null &&
    !(BEDROOM_OPTIONS as readonly string[]).includes(prefs.bedroomCount)
  ) {
    return "Please choose a valid bedroom option.";
  }
  if (
    prefs.householdSize !== null &&
    !(HOUSEHOLD_OPTIONS as readonly string[]).includes(prefs.householdSize)
  ) {
    return "Please choose a valid household option.";
  }
  if (!Number.isInteger(prefs.noOfParkingSpots) || prefs.noOfParkingSpots < 1 || prefs.noOfParkingSpots > 5) {
    return "Please choose a valid number of parking spots.";
  }
  if (!Array.isArray(prefs.listOfVehicles) || prefs.listOfVehicles.some((v) => typeof v !== "string")) {
    return "Please choose valid vehicle types.";
  }
  return validatePets(prefs);
}
