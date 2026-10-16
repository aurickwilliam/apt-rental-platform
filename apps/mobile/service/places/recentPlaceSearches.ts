import AsyncStorage from "@react-native-async-storage/async-storage";

// Places the landlord picked from the map-pin search, newest first. Kept on
// the device per auth account so a shared phone never shows another account's
// addresses. Best-effort: failures just mean no recent list.
export interface RecentPlaceSearch {
  placeId: string;
  mainText: string;
  secondaryText: string;
}

export const MAX_RECENT_PLACE_SEARCHES = 5;

const RECENT_PLACES_KEY_PREFIX = "apt-recent-place-searches:";

export function recentPlaceSearchesKey(authUserId: string): string {
  return `${RECENT_PLACES_KEY_PREFIX}${authUserId}`;
}

function isRecentPlaceSearch(value: unknown): value is RecentPlaceSearch {
  if (!value || typeof value !== "object") return false;
  const item = value as Record<string, unknown>;
  return (
    typeof item.placeId === "string" &&
    typeof item.mainText === "string" &&
    typeof item.secondaryText === "string"
  );
}

/** Adds `place` to the front, dropping an older copy and keeping the newest few. */
export function addRecentPlaceSearch(
  current: RecentPlaceSearch[],
  place: RecentPlaceSearch,
): RecentPlaceSearch[] {
  return [place, ...current.filter((item) => item.placeId !== place.placeId)].slice(
    0,
    MAX_RECENT_PLACE_SEARCHES,
  );
}

export async function loadRecentPlaceSearches(authUserId: string): Promise<RecentPlaceSearch[]> {
  try {
    const raw = await AsyncStorage.getItem(recentPlaceSearchesKey(authUserId));
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed)
      ? parsed.filter(isRecentPlaceSearch).slice(0, MAX_RECENT_PLACE_SEARCHES)
      : [];
  } catch {
    return [];
  }
}

export async function saveRecentPlaceSearches(
  authUserId: string,
  places: RecentPlaceSearch[],
): Promise<void> {
  try {
    await AsyncStorage.setItem(recentPlaceSearchesKey(authUserId), JSON.stringify(places));
  } catch {
    // Best-effort only.
  }
}
