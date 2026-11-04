import { PET_COUNT_CAP, VEHICLE_OPTIONS } from '@repo/constants';

/**
 * Rules that tie a count to its selections in the pet and parking
 * preference forms (settings, personalization, rental application), shared by
 * web and mobile so the two cannot drift.
 */

/** Keeps the kinds that fit a lowered pet count; "4+" (the cap) keeps them all. */
export function trimPetKinds(kinds: string[], count: number): string[] {
  return count >= PET_COUNT_CAP ? kinds : kinds.slice(0, count);
}

/** Vehicle kinds in catalog order, so every platform trims and saves the same list. */
export function sortVehicles(vehicles: string[]): string[] {
  return VEHICLE_OPTIONS.filter((vehicle) => vehicles.includes(vehicle));
}

/** Keeps the vehicle kinds that fit a lowered number of parking spots. */
export function trimVehicles(vehicles: string[], spots: number): string[] {
  return sortVehicles(vehicles).slice(0, spots);
}

/** Never fewer parking spots than vehicle kinds. */
export function spotsForVehicles(spots: number, vehicles: string[]): number {
  return Math.max(spots || 0, vehicles.length);
}
