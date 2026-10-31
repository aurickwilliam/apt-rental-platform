// Apartments a visitor opened from Browse search, newest first. Kept in this
// browser per account (signed-out visitors share one "guest" list) so a shared
// computer never shows another account's history. Best-effort: failures just
// mean no recent list. Mirrors the mobile Search tab.
export interface RecentApartmentSearch {
  id: string;
  name: string;
  location: string;
  thumbnailUrl?: string;
}

/** The card fields a recent entry needs (a Browse card satisfies it). */
export interface RecentApartmentSource {
  id: string;
  name: string;
  location: string;
  image?: string;
}

export function toRecentApartmentSearch(apartment: RecentApartmentSource): RecentApartmentSearch {
  return {
    id: apartment.id,
    name: apartment.name,
    location: apartment.location,
    thumbnailUrl: apartment.image,
  };
}

/**
 * Apartment page for a recent entry. The map search passes its own path
 * (`/browse/map`) as its base path, but listings live beside it, not under it.
 */
export function recentApartmentHref(basePath: string, apartmentId: string): string {
  return `${basePath.replace(/\/map$/, "")}/${apartmentId}`;
}

export const MAX_RECENT_APARTMENT_SEARCHES = 5;

const KEY_PREFIX = "apt-recent-apartment-searches:";
const GUEST_ID = "guest";

export function recentApartmentSearchesKey(authUserId: string | null | undefined): string {
  return `${KEY_PREFIX}${authUserId ?? GUEST_ID}`;
}

function isRecentApartmentSearch(value: unknown): value is RecentApartmentSearch {
  if (!value || typeof value !== "object") return false;
  const item = value as Record<string, unknown>;
  return (
    typeof item.id === "string" &&
    typeof item.name === "string" &&
    typeof item.location === "string" &&
    (item.thumbnailUrl === undefined || typeof item.thumbnailUrl === "string")
  );
}

/** Adds `apartment` to the front, dropping an older copy and keeping the newest few. */
export function addRecentApartmentSearch(
  current: RecentApartmentSearch[],
  apartment: RecentApartmentSearch,
): RecentApartmentSearch[] {
  return [apartment, ...current.filter((item) => item.id !== apartment.id)].slice(
    0,
    MAX_RECENT_APARTMENT_SEARCHES,
  );
}

export function parseRecentApartmentSearches(raw: string | null): RecentApartmentSearch[] {
  try {
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed)
      ? parsed.filter(isRecentApartmentSearch).slice(0, MAX_RECENT_APARTMENT_SEARCHES)
      : [];
  } catch {
    return [];
  }
}

export function loadRecentApartmentSearches(
  authUserId: string | null | undefined,
): RecentApartmentSearch[] {
  try {
    return parseRecentApartmentSearches(
      window.localStorage.getItem(recentApartmentSearchesKey(authUserId)),
    );
  } catch {
    return [];
  }
}

export function saveRecentApartmentSearches(
  authUserId: string | null | undefined,
  apartments: RecentApartmentSearch[],
): void {
  try {
    window.localStorage.setItem(
      recentApartmentSearchesKey(authUserId),
      JSON.stringify(apartments),
    );
  } catch {
    // Best-effort only.
  }
}

export function rememberRecentApartmentSearch(
  authUserId: string | null | undefined,
  apartment: RecentApartmentSearch,
): void {
  saveRecentApartmentSearches(
    authUserId,
    addRecentApartmentSearch(loadRecentApartmentSearches(authUserId), apartment),
  );
}
