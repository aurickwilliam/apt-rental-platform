// Distance and ranking for Ava's location-aware search. Everything here is
// pure: straight-line distance between real coordinates, nothing estimated.
// Listings without coordinates never get a distance.

import type { LandmarkPoint, LandmarkTarget } from './avaLandmarks';

/** Closer than this counts as "near" the landmark (about a 15 to 20 minute walk). */
export const AVA_NEAR_KM = 1.5;
/** Within this is a "nearby area" alternative; beyond it Ava says the listing is far. */
export const AVA_NEARBY_KM = 5;

const EARTH_RADIUS_KM = 6371;

const toRadians = (degrees: number) => (degrees * Math.PI) / 180;

/** Great-circle (straight-line) distance in kilometres. */
export function haversineKm(a: LandmarkPoint, b: LandmarkPoint): number {
  const dLat = toRadians(b.latitude - a.latitude);
  const dLng = toRadians(b.longitude - a.longitude);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRadians(a.latitude)) * Math.cos(toRadians(b.latitude)) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.min(1, Math.sqrt(h)));
}

function isValidCoordinate(latitude: unknown, longitude: unknown): boolean {
  return (
    typeof latitude === 'number' &&
    typeof longitude === 'number' &&
    Number.isFinite(latitude) &&
    Number.isFinite(longitude) &&
    Math.abs(latitude) <= 90 &&
    Math.abs(longitude) <= 180 &&
    // (0, 0) is how an unset pin often arrives; it is never a CAMANAVA listing.
    !(latitude === 0 && longitude === 0)
  );
}

/** Distance from a listing to the nearest point of a target, or null without coordinates. */
export function distanceToTargetKm(
  listing: { latitude: number | null; longitude: number | null },
  target: LandmarkTarget,
): number | null {
  if (!isValidCoordinate(listing.latitude, listing.longitude)) return null;
  const point = { latitude: listing.latitude as number, longitude: listing.longitude as number };
  if (target.points.length === 0) return null;
  return Math.min(...target.points.map((landmark) => haversineKm(point, landmark)));
}

export type ProximityScenario =
  /** Listings within the near radius. */
  | 'near'
  /** Nothing near, but listings in nearby areas. */
  | 'nearby'
  /** Nothing nearby either; the closest are far away. */
  | 'farther'
  /** No listing has a map location, so no distance can be given. */
  | 'unlocated'
  /** No listing matched at all. */
  | 'none';

export interface RankedListing<T> {
  item: T;
  distanceKm: number;
}

export interface ProximityRanking<T> {
  scenario: ProximityScenario;
  items: RankedListing<T>[];
  /** Distance of the closest listing, null when there is none. */
  nearestKm: number | null;
}

/**
 * Ranks listings by straight-line distance to the target. The radius widens in
 * steps (near, then nearby, then everything), so the closest listings always
 * come first and a far one is never presented as near.
 */
export function rankByProximity<T extends { id: string; latitude: number | null; longitude: number | null }>(
  candidates: T[],
  target: LandmarkTarget,
  options: { limit: number; excludeIds?: ReadonlySet<string> | readonly string[] },
): ProximityRanking<T> {
  const excluded = new Set(options.excludeIds ?? []);
  const located: RankedListing<T>[] = [];
  let unlocated = 0;

  for (const item of candidates) {
    if (excluded.has(item.id)) continue;
    const distanceKm = distanceToTargetKm(item, target);
    if (distanceKm === null) unlocated += 1;
    else located.push({ item, distanceKm });
  }

  if (located.length === 0) {
    return { scenario: unlocated > 0 ? 'unlocated' : 'none', items: [], nearestKm: null };
  }

  located.sort((a, b) => a.distanceKm - b.distanceKm || a.item.id.localeCompare(b.item.id));
  const nearestKm = located[0].distanceKm;

  if (nearestKm <= AVA_NEAR_KM) {
    return {
      scenario: 'near',
      items: located.filter((entry) => entry.distanceKm <= AVA_NEARBY_KM).slice(0, options.limit),
      nearestKm,
    };
  }
  if (nearestKm <= AVA_NEARBY_KM) {
    return {
      scenario: 'nearby',
      items: located.filter((entry) => entry.distanceKm <= AVA_NEARBY_KM).slice(0, options.limit),
      nearestKm,
    };
  }
  return { scenario: 'farther', items: located.slice(0, options.limit), nearestKm };
}

/** "850 m" under a kilometre, otherwise "1.2 km". */
export function formatDistance(distanceKm: number): string {
  if (distanceKm < 1) return `${Math.max(50, Math.round((distanceKm * 1000) / 50) * 50)} m`;
  return `${distanceKm < 10 ? distanceKm.toFixed(1) : Math.round(distanceKm)} km`;
}
