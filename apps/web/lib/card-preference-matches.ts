import { buildPersonalizedRowSpecs, type BrowseRowSpec } from "@repo/utils";
import { parseTenantPreferences } from "./tenant-preferences";
import type { BrowseApartment } from "../app/browse/lib/browse-apartment";

/** Presentation only: use the same exact bounds/amenities as personalized rows, not soft scores. */
export function cardPreferenceRules(raw: unknown): BrowseRowSpec[] {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return [];
  // Older/partial rows may omit an unanswered city list; that must not erase
  // their other saved answers. Keep the existing parser for every value.
  const stored = raw as Record<string, unknown>;
  const prefs = parseTenantPreferences({ ...stored, selectedCities: stored.selectedCities ?? [] });
  if (!prefs || !Number.isFinite(prefs.budgetMin) || !Number.isFinite(prefs.budgetMax) ||
    prefs.budgetMin < 0 || prefs.budgetMin > prefs.budgetMax) return [];
  return buildPersonalizedRowSpecs(prefs);
}

export function cardPreferenceMatches(apt: BrowseApartment, rules: BrowseRowSpec[]): string[] {
  const labels: string[] = [];
  if (rules.some(({ id, criteria }) => id.startsWith("city:") && apt.city && criteria.cities?.includes(apt.city))) {
    labels.push("Preferred city");
  }
  const budget = rules.find(({ id }) => id === "budget")?.criteria;
  if (budget && Number.isFinite(apt.price) && apt.price >= budget.priceMin! && apt.price <= budget.priceMax!) {
    labels.push("Within budget");
  }
  const bedrooms = rules.find(({ id }) => id === "bedrooms")?.criteria;
  if (bedrooms && apt.bedrooms !== undefined && apt.bedrooms >= bedrooms.bedroomMin! &&
    (bedrooms.bedroomMax === undefined || apt.bedrooms <= bedrooms.bedroomMax)) {
    labels.push("Preferred bedrooms");
  }
  const amenityRules = rules.filter(({ criteria }) => criteria.amenities?.length);
  const matched = amenityRules.filter(({ criteria }) => criteria.amenities!.every((id) => apt.amenities?.includes(id)));
  if (matched.length && matched.length === amenityRules.length) labels.push("Matches amenities");
  else for (const { id } of matched) {
    // Partial matches never claim that all requested amenities are present.
    if (id === "pets") labels.push("Pet-friendly");
    if (id === "parking") labels.push("Parking available");
  }
  return labels;
}
