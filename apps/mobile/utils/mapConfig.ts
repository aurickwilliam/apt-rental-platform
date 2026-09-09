import Constants from 'expo-constants';

/**
 * Central map feature flags. Keep MapLibre fallback for one release.
 * - EXPO_PUBLIC_USE_GOOGLE_MAPS=0 forces OSM fallback (rollback)
 * - EXPO_PUBLIC_GOOGLE_MAPS_API_KEY is the Google Maps key (also via app.json ${} substitution)
 * - EXPO_PUBLIC_ENABLE_PLACES=1 enables Places Autocomplete on create-apartment pin screen only
 *
 * Default: Google ON, Places ON (when key present). During EAS dev build without key, fallback still renders OSM.
 */

function readExtraString(key: string): string | undefined {
  const extra = (Constants.expoConfig?.extra ?? {}) as Record<string, unknown>;
  if (typeof extra[key] === 'string') return extra[key] as string;
  return undefined;
}

function readEnv(key: string): string | undefined {
  // Expo inlines EXPO_PUBLIC_* at build time via process.env, but EAS secrets may also be in Constants.extra
  const fromProcess = (process.env as Record<string, string | undefined>)[key];
  if (fromProcess) return fromProcess;
  return readExtraString(key);
}

export const MAP_DEFAULT_COORDS = {
  latitude: 14.67,
  longitude: 120.96,
} as const;

export const MAP_DEFAULTS = {
  zoom: 15,
  maxZoom: 19,
  latitudeDelta: 0.015,
  longitudeDelta: 0.015,
} as const;

export function getGoogleMapsApiKey(): string | undefined {
  return readEnv('EXPO_PUBLIC_GOOGLE_MAPS_API_KEY');
}

export function isGoogleMapsEnabled(): boolean {
  const flag = readEnv('EXPO_PUBLIC_USE_GOOGLE_MAPS');
  if (flag === '0' || flag === 'false') return false;
  // If no key, fall back to MapLibre so dev without EAS secret still renders
  const key = getGoogleMapsApiKey();
  if (!key || key.trim().length < 10) return false;
  return true;
}

export function isPlacesEnabled(): boolean {
  const flag = readEnv('EXPO_PUBLIC_ENABLE_PLACES');
  // Default ON when Google is on; explicit 0/false disables
  if (flag === '0' || flag === 'false') return false;
  if (flag === '1' || flag === 'true') return isGoogleMapsEnabled();
  // default: enabled when Google is enabled
  return isGoogleMapsEnabled();
}
