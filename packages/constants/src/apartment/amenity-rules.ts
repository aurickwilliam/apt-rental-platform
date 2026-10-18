// Amenity picking rules shared by the web and mobile listing forms.

const COOKING_AMENITIES = [
  "kitchen",
  "stove",
  "oven",
  "microwave",
  "rice_cooker",
  "kettle",
  "toaster",
  "cooking_utensils",
];

/** Pairs that cannot both be on a listing. Picking one turns the other off. */
export const AMENITY_CONFLICTS: ReadonlyArray<readonly [string, string]> = [
  ["smoking", "nonsmoking"],
  ...COOKING_AMENITIES.map((id) => ["no_cooking", id] as const),
];

/**
 * Amenities that are no longer offered in pickers. Still shown on listings
 * that already have them. "furniture" is covered by the Furnished Type field.
 */
export const RETIRED_AMENITIES: readonly string[] = ["furniture"];

export function isRetiredAmenity(id: string): boolean {
  return RETIRED_AMENITIES.includes(id);
}

/** Amenities that conflict with `id`. */
export function getConflictingAmenities(id: string): string[] {
  return AMENITY_CONFLICTS.flatMap(([a, b]) => (a === id ? [b] : b === id ? [a] : []));
}

/**
 * The selection after tapping `id`: removes it if selected, otherwise adds it
 * and turns off anything it conflicts with.
 */
export function toggleAmenitySelection(selected: readonly string[], id: string): string[] {
  if (selected.includes(id)) return selected.filter((item) => item !== id);
  const conflicts = getConflictingAmenities(id);
  return [...selected.filter((item) => !conflicts.includes(item)), id];
}
