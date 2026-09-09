import { supabase } from '@repo/supabase';

export interface MapApartment {
  id: string;
  name: string;
  barangay: string;
  city: string;
  monthly_rent: number;
  latitude: number;
  longitude: number;
  average_rating: number | null;
  no_bedrooms: number;
  no_bathrooms: number;
  area_sqm: number;
  is_verified: boolean;
  coverUrl?: string;
  coverThumbUrl?: string;
}

export interface BBox {
  minLng: number;
  minLat: number;
  maxLng: number;
  maxLat: number;
}

/**
 * Fetch apartments whose lat/lng falls inside bbox.
 * Uses direct column filters — no PostGIS required for MVP.
 * For production with PostGIS, swap to `rpc('apartments_in_bbox', bbox)`.
 */
export async function fetchApartmentsInBbox(bbox: BBox, limit = 100): Promise<MapApartment[]> {
  const { minLng, minLat, maxLng, maxLat } = bbox;

  // Normalize: handle antimeridian not needed for PH (120-121E)
  const { data, error } = await supabase
    .from('apartments')
    .select(
      `
      id,
      name,
      barangay,
      city,
      monthly_rent,
      latitude,
      longitude,
      average_rating,
      no_bedrooms,
      no_bathrooms,
      area_sqm,
      is_verified,
      apartment_images (
        url,
        url_thumb,
        is_cover,
        created_at
      )
    `,
    )
    .is('deleted_at', null)
    .in('status', ['available', 'unverified'])
    .not('latitude', 'is', null)
    .not('longitude', 'is', null)
    .gte('latitude', minLat)
    .lte('latitude', maxLat)
    .gte('longitude', minLng)
    .lte('longitude', maxLng)
    .limit(limit);

  if (error) throw new Error(error.message);

  return (data ?? []).map((apt: any) => {
    const images: any[] = apt.apartment_images ?? [];
    const cover = images.find((i) => i.is_cover);
    const earliest = [...images].sort(
      (a, b) => new Date(a.created_at ?? 0).getTime() - new Date(b.created_at ?? 0).getTime(),
    )[0];
    const url = cover?.url ?? earliest?.url ?? null;
    const thumb = cover?.url_thumb ?? earliest?.url_thumb ?? null;
    return {
      id: apt.id,
      name: apt.name,
      barangay: apt.barangay,
      city: apt.city,
      monthly_rent: apt.monthly_rent,
      latitude: apt.latitude,
      longitude: apt.longitude,
      average_rating: apt.average_rating,
      no_bedrooms: apt.no_bedrooms,
      no_bathrooms: apt.no_bathrooms,
      area_sqm: apt.area_sqm,
      is_verified: apt.is_verified,
      coverUrl: url ?? undefined,
      coverThumbUrl: thumb ?? undefined,
    };
  });
}

export function bboxFromRegion(region: {
  latitude: number;
  longitude: number;
  latitudeDelta: number;
  longitudeDelta: number;
}): BBox {
  return {
    minLat: region.latitude - region.latitudeDelta / 2,
    maxLat: region.latitude + region.latitudeDelta / 2,
    minLng: region.longitude - region.longitudeDelta / 2,
    maxLng: region.longitude + region.longitudeDelta / 2,
  };
}

/**
 * Expand a visible region into a larger query bbox so small pans don't refetch.
 * `margin` is the fraction added to EACH side (0.25 = 25% buffer per side,
 * queried area is ~(1 + 2*margin)^2 of the visible area).
 */
export function bboxFromRegionWithMargin(
  region: {
    latitude: number;
    longitude: number;
    latitudeDelta: number;
    longitudeDelta: number;
  },
  margin = 0.25,
): BBox {
  const latBuffer = (region.latitudeDelta / 2) * margin;
  const lngBuffer = (region.longitudeDelta / 2) * margin;
  return {
    minLat: region.latitude - region.latitudeDelta / 2 - latBuffer,
    maxLat: region.latitude + region.latitudeDelta / 2 + latBuffer,
    minLng: region.longitude - region.longitudeDelta / 2 - lngBuffer,
    maxLng: region.longitude + region.longitudeDelta / 2 + lngBuffer,
  };
}

/** True when `inner` is fully covered by `outer` (used to skip refetches on small pans). */
export function bboxContains(outer: BBox, inner: BBox): boolean {
  return (
    inner.minLat >= outer.minLat &&
    inner.maxLat <= outer.maxLat &&
    inner.minLng >= outer.minLng &&
    inner.maxLng <= outer.maxLng
  );
}

/**
 * Compact rent label for map price pills (Airbnb-style).
 * 950 -> "₱950", 8500 -> "₱8.5k", 12000 -> "₱12k", 15500 -> "₱15.5k".
 */
export function formatPricePill(rent: number): string {
  if (!Number.isFinite(rent) || rent < 0) return '₱0';
  if (rent < 1000) return `₱${Math.round(rent)}`;
  const k = rent / 1000;
  const rounded = Math.round(k * 10) / 10;
  const label = Number.isInteger(rounded) ? `${rounded}` : `${rounded}`;
  return `₱${label}k`;
}

/**
 * Filter map pins to the currently visible viewport.
 * Selected pin is always kept even if marginally outside (keeps card in sync).
 */
export function filterPinsToVisible<
  T extends { latitude: number; longitude: number; id?: string; selected?: boolean },
>(pins: T[], visible: BBox, opts?: { keepSelected?: boolean }): T[] {
  const keepSelected = opts?.keepSelected ?? true;
  return pins.filter(
    (p) =>
      (keepSelected && p.selected) ||
      (p.latitude >= visible.minLat &&
        p.latitude <= visible.maxLat &&
        p.longitude >= visible.minLng &&
        p.longitude <= visible.maxLng),
  );
}
