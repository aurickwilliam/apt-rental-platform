import type { BBox } from "@repo/utils";

// Map search view state. The camera lives in the URL (lat/lng/z) so a shared
// link or Back from a detail page reopens the same area; every other param is
// a Browse filter and goes through the shared query builder untouched.

export interface MapView {
  lat: number;
  lng: number;
  zoom: number;
}

export const MAP_VIEW_KEYS = ["lat", "lng", "z"] as const;

/** CAMANAVA at city level, matching the mobile map's starting area. */
export const DEFAULT_MAP_VIEW: MapView = { lat: 14.67, lng: 120.96, zoom: 12 };

/** Loose CAMANAVA span for listing the area when no map can be shown (no key / load failure). */
export const DEFAULT_MAP_BBOX: BBox = { minLat: 14.62, maxLat: 14.78, minLng: 120.9, maxLng: 121.06 };

const MIN_ZOOM = 3;
const MAX_ZOOM = 21;

type ParamReader = Pick<URLSearchParams, "get">;

function readNumber(params: ParamReader, key: string): number | null {
  const raw = params.get(key);
  if (raw == null || raw.trim() === "") return null;
  const value = Number(raw);
  return Number.isFinite(value) ? value : null;
}

/** Reads the camera from the URL; any missing or invalid part falls back to the default view. */
export function parseMapView(params: ParamReader): MapView {
  const lat = readNumber(params, "lat");
  const lng = readNumber(params, "lng");
  const zoom = readNumber(params, "z");
  const validCenter = lat != null && lng != null && Math.abs(lat) <= 90 && Math.abs(lng) <= 180;
  if (!validCenter) return DEFAULT_MAP_VIEW;
  return {
    lat,
    lng,
    zoom: zoom == null ? DEFAULT_MAP_VIEW.zoom : Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, Math.round(zoom))),
  };
}

/** The camera as URL params (about 1 m precision, whole zoom levels). */
export function mapViewParams(view: MapView): Record<string, string> {
  return { lat: view.lat.toFixed(5), lng: view.lng.toFixed(5), z: String(Math.round(view.zoom)) };
}

/**
 * Browse filter/search params only: drops the camera and paging, which have
 * no meaning for a viewport query.
 */
export function browseFilterParams(params: URLSearchParams): Record<string, string> {
  const filters: Record<string, string> = {};
  for (const [key, value] of params.entries()) {
    if ((MAP_VIEW_KEYS as readonly string[]).includes(key) || key === "page") continue;
    filters[key] = value;
  }
  return filters;
}

/** Stable, URL-encoded key for a filter set, so a new object with the same filters never refetches. */
export function filterParamsKey(filters: Record<string, string>): string {
  return new URLSearchParams(Object.keys(filters).sort().map((key) => [key, filters[key]])).toString();
}

/** Inverse of `filterParamsKey`. */
export function filtersFromKey(key: string): Record<string, string> {
  return Object.fromEntries(new URLSearchParams(key));
}
