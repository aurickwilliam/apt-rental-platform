import AsyncStorage from "@react-native-async-storage/async-storage";

import {
  APARTMENT_TYPES,
  CAMANAVA_FILTER_OPTIONS,
  FLOOR_LEVELS,
  FURNISHED_TYPES,
  LEASE_DURATIONS,
} from "@repo/constants";
import { supabase } from "@repo/supabase";

import type { FilterState } from "@/app/(tabs)/components/search/FilterBottomSheet";

const SEARCH_PREF_KEY_PREFIX = "apt-search:";

const DEFAULT_CITY = CAMANAVA_FILTER_OPTIONS[0];
const MAX_SAVED_SEARCH_LENGTH = 100;
const MAX_SAVED_AMENITIES = 50;
const MAX_AMENITY_LENGTH = 80;

const SORT_OPTIONS = ["newest", "price_asc", "price_desc", "most_popular"] as const;
const ROOM_OPTIONS = ["Any", "1", "2", "3", "4+"] as const;

const MIN_BUDGET = 1000;
const MAX_BUDGET = 50000;
const MIN_SIZE = 10;
const MAX_SIZE = 300;

export interface SavedSearchPreference {
  city: string;
  committedSearch: string;
  filters: FilterState | null;
  isGridView: boolean;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function sanitizePair(
  value: unknown,
  min: number,
  max: number,
): [number, number] | null {
  if (!Array.isArray(value) || value.length !== 2) return null;
  const [lo, hi] = value;
  if (typeof lo !== "number" || typeof hi !== "number") return null;
  if (!Number.isFinite(lo) || !Number.isFinite(hi) || lo > hi) return null;
  return [Math.min(Math.max(lo, min), max), Math.min(Math.max(hi, min), max)];
}

function sanitizeStringArray(value: unknown, allowlist: readonly string[]): string[] {
  if (!Array.isArray(value)) return [...allowlist];
  const kept = value.filter(
    (item): item is string => typeof item === "string" && allowlist.includes(item),
  );
  return kept.length > 0 ? kept : [...allowlist];
}

function sanitizeFilters(value: unknown): FilterState | null {
  if (value === null) return null;
  if (!isRecord(value)) return null;

  const budget = sanitizePair(value.budget, MIN_BUDGET, MAX_BUDGET) ?? [MIN_BUDGET, MAX_BUDGET];
  const sizeRange = sanitizePair(value.sizeRange, MIN_SIZE, MAX_SIZE) ?? [MIN_SIZE, MAX_SIZE];

  const bedrooms = typeof value.bedrooms === "string" && (ROOM_OPTIONS as readonly string[]).includes(value.bedrooms)
    ? value.bedrooms
    : "Any";
  const bathrooms = typeof value.bathrooms === "string" && (ROOM_OPTIONS as readonly string[]).includes(value.bathrooms)
    ? value.bathrooms
    : "Any";
  const sortBy = typeof value.sortBy === "string" && (SORT_OPTIONS as readonly string[]).includes(value.sortBy)
    ? value.sortBy as FilterState["sortBy"]
    : "newest";

  const amenities = Array.isArray(value.amenities)
    ? value.amenities
        .filter((item): item is string => typeof item === "string")
        .map((item) => item.slice(0, MAX_AMENITY_LENGTH))
        .slice(0, MAX_SAVED_AMENITIES)
    : [];

  return {
    budget,
    unitTypes: sanitizeStringArray(value.unitTypes, APARTMENT_TYPES),
    sortBy,
    bedrooms,
    bathrooms,
    sizeRange,
    furnishing: sanitizeStringArray(value.furnishing, FURNISHED_TYPES),
    floorLevel: sanitizeStringArray(value.floorLevel, FLOOR_LEVELS),
    leaseDuration: sanitizeStringArray(value.leaseDuration, LEASE_DURATIONS),
    amenities,
    verifiedOnly: value.verifiedOnly === true,
  };
}

export function sanitizeSearchPreference(raw: unknown): SavedSearchPreference | null {
  if (!isRecord(raw)) return null;

  const city = typeof raw.city === "string" &&
    (CAMANAVA_FILTER_OPTIONS as readonly string[]).includes(raw.city)
    ? raw.city
    : DEFAULT_CITY;
  const committedSearch = typeof raw.committedSearch === "string"
    ? raw.committedSearch.trim().slice(0, MAX_SAVED_SEARCH_LENGTH)
    : "";

  return {
    city,
    committedSearch,
    filters: sanitizeFilters(raw.filters ?? null),
    isGridView: raw.isGridView !== false,
  };
}

async function resolveSearchUserId(): Promise<string | null> {
  try {
    const { data } = await supabase.auth.getUser();
    return data?.user?.id ?? null;
  } catch {
    return null;
  }
}

export function searchPreferenceKey(authUserId: string): string {
  return `${SEARCH_PREF_KEY_PREFIX}${authUserId}`;
}

/** Loads the saved browse inputs for the current account. Null when signed out or nothing valid was stored. */
export async function loadSearchPreference(): Promise<SavedSearchPreference | null> {
  try {
    const userId = await resolveSearchUserId();
    if (!userId) return null;
    const raw = await AsyncStorage.getItem(searchPreferenceKey(userId));
    if (!raw) return null;
    return sanitizeSearchPreference(JSON.parse(raw));
  } catch {
    return null;
  }
}

/** Persists only browse inputs (never results or URLs), scoped to the current account. No-op when signed out. */
export async function saveSearchPreference(pref: SavedSearchPreference): Promise<void> {
  try {
    const userId = await resolveSearchUserId();
    if (!userId) return;
    await AsyncStorage.setItem(searchPreferenceKey(userId), JSON.stringify(pref));
  } catch {
    // Persistence is best-effort; browse still works for the session.
  }
}

/** Removes the saved browse inputs for the current account. */
export async function clearSearchPreference(): Promise<void> {
  try {
    const userId = await resolveSearchUserId();
    if (!userId) return;
    await AsyncStorage.removeItem(searchPreferenceKey(userId));
  } catch {
    // Best-effort only.
  }
}
