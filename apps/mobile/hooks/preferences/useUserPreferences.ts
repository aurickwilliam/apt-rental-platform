import { useMemo } from "react";
import { useCurrentUser } from "@/hooks/auth/useCurrentUser";
import type { PersonalizationState } from "@/stores/usePersonalizationStore";

export type TenantPreferences = PersonalizationState;

const DEFAULT_BUDGET_MIN = 5_000;
const DEFAULT_BUDGET_MAX = 100_000;

function isDefaultBudget(prefs: TenantPreferences): boolean {
  return prefs.budgetMin === DEFAULT_BUDGET_MIN && prefs.budgetMax === DEFAULT_BUDGET_MAX;
}

export function hasPersonalization(prefs: TenantPreferences | null | undefined): boolean {
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

export function parsePreferences(raw: unknown): TenantPreferences | null {
  if (!raw || typeof raw !== "object") return null;
  const obj = raw as Record<string, unknown>;
  // Basic shape validation — fallback to null if critical fields missing
  if (!Array.isArray(obj.selectedCities)) return null;
  return {
    selectedCities: obj.selectedCities as string[],
    budgetMin: typeof obj.budgetMin === "number" ? obj.budgetMin : DEFAULT_BUDGET_MIN,
    budgetMax: typeof obj.budgetMax === "number" ? obj.budgetMax : DEFAULT_BUDGET_MAX,
    bedroomCount: (obj.bedroomCount as string | null) ?? null,
    householdSize: (obj.householdSize as string | null) ?? null,
    hasPets: Boolean(obj.hasPets),
    kindOfPets: (obj.kindOfPets as string) ?? "",
    nameOfPets: (obj.nameOfPets as string | null) ?? null,
    hasParking: Boolean(obj.hasParking),
    noOfParkingSpots: typeof obj.noOfParkingSpots === "number" ? obj.noOfParkingSpots : 1,
    listOfVehicles: Array.isArray(obj.listOfVehicles) ? (obj.listOfVehicles as string[]) : [],
    hasSmoker: Boolean(obj.hasSmoker),
    hasDisability: Boolean(obj.hasDisability),
  };
}

export function toFilterState(prefs: TenantPreferences) {
  // Maps preferences to FilterState-compatible values (partial)
  // Budget clamped to search range 1k-50k
  const MIN_BUDGET = 1000;
  const MAX_BUDGET = 50000;
  const budgetMin = Math.max(MIN_BUDGET, Math.min(prefs.budgetMin, MAX_BUDGET));
  const budgetMax = Math.max(MIN_BUDGET, Math.min(prefs.budgetMax, MAX_BUDGET));
  const budget: [number, number] = [Math.min(budgetMin, budgetMax), Math.max(budgetMin, budgetMax)];

  let bedrooms: string = "Any";
  if (prefs.bedroomCount === "1-2 Bedrooms") bedrooms = "Any"; // will use range 1-2, handled specially
  else if (prefs.bedroomCount === "2-4 Bedrooms") bedrooms = "Any";
  else if (prefs.bedroomCount === "4+ Bedrooms") bedrooms = "4+";

  const amenities: string[] = [];
  if (prefs.hasPets) amenities.push("petfriendly");
  if (prefs.hasParking) amenities.push("parking");
  if (prefs.hasDisability) amenities.push("wheelchair");
  if (prefs.hasSmoker) {
    // Prefer non-smoking listings
    amenities.push("nonsmoking");
  }

  return { budget, bedrooms, amenities, bedroomCount: prefs.bedroomCount };
}

export function toRpcFilters(prefs: TenantPreferences) {
  const { budget, amenities, bedrooms, bedroomCount } = toFilterState(prefs);
  return {
    budgetMin: budget[0],
    budgetMax: budget[1],
    bedrooms,
    bedroomCount,
    amenities,
    cities: prefs.selectedCities,
  };
}

export function useUserPreferences() {
  const { data: profile, isLoading, error } = useCurrentUser();

  const preferences = useMemo<TenantPreferences | null>(() => {
    if (!profile?.preferences) return null;
    const parsed = parsePreferences(profile.preferences);
    return parsed;
  }, [profile?.preferences]);

  const isTenant = profile?.role === "tenant";
  const hasPrefs = isTenant && hasPersonalization(preferences);
  const personalizedCity = preferences?.selectedCities[0] ?? "CAMANAVA";
  const extraCitiesCount = Math.max(0, (preferences?.selectedCities.length ?? 0) - 1);
  const prefsHash = preferences ? JSON.stringify(preferences) : null;

  return {
    profile,
    preferences,
    isTenant,
    hasPrefs,
    personalizedCity,
    extraCitiesCount,
    prefsHash,
    isLoading,
    error,
  };
}
