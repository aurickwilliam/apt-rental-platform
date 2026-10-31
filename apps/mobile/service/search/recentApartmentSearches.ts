import AsyncStorage from "@react-native-async-storage/async-storage";

// Apartments the tenant opened from the Search tab, newest first. Kept on the
// device per auth account so a shared phone never shows another account's
// history. Best-effort: failures just mean no recent list.
export interface RecentApartmentSearch {
  id: string;
  name: string;
  location: string;
  thumbnailUri?: string;
}

export const MAX_RECENT_APARTMENT_SEARCHES = 5;

const RECENT_APARTMENTS_KEY_PREFIX = "apt-recent-apartment-searches:";

export function recentApartmentSearchesKey(authUserId: string): string {
  return `${RECENT_APARTMENTS_KEY_PREFIX}${authUserId}`;
}

function isRecentApartmentSearch(value: unknown): value is RecentApartmentSearch {
  if (!value || typeof value !== "object") return false;
  const item = value as Record<string, unknown>;
  return (
    typeof item.id === "string" &&
    typeof item.name === "string" &&
    typeof item.location === "string" &&
    (item.thumbnailUri === undefined || typeof item.thumbnailUri === "string")
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

export async function loadRecentApartmentSearches(
  authUserId: string,
): Promise<RecentApartmentSearch[]> {
  try {
    const raw = await AsyncStorage.getItem(recentApartmentSearchesKey(authUserId));
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed)
      ? parsed.filter(isRecentApartmentSearch).slice(0, MAX_RECENT_APARTMENT_SEARCHES)
      : [];
  } catch {
    return [];
  }
}

export async function saveRecentApartmentSearches(
  authUserId: string,
  apartments: RecentApartmentSearch[],
): Promise<void> {
  try {
    await AsyncStorage.setItem(
      recentApartmentSearchesKey(authUserId),
      JSON.stringify(apartments),
    );
  } catch {
    // Best-effort only.
  }
}
