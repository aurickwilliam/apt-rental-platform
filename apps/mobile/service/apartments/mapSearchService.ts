import { supabase } from '@repo/supabase';
import { type BBox, bboxContains, filterPinsToVisible, formatPricePill } from '@repo/utils';

// Pure helpers live in @repo/utils (shared with web); re-exported so mobile imports are unchanged.
export { type BBox, bboxContains, filterPinsToVisible, formatPricePill };

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

/**
 * Fetch apartments whose lat/lng falls inside bbox.
 * Uses direct column filters — no PostGIS required for MVP.
 * For production with PostGIS, swap to `rpc('apartments_in_bbox', bbox)`.
 */
export async function fetchApartmentsInBbox(
  bbox: BBox,
  limit = 100,
  search = '',
): Promise<MapApartment[]> {
  const { minLng, minLat, maxLng, maxLat } = bbox;

  // Normalize: handle antimeridian not needed for PH (120-121E)
  let query = supabase
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
    .eq('is_hidden_by_admin', false)
    .in('status', ['available', 'unverified'])
    .not('latitude', 'is', null)
    .not('longitude', 'is', null)
    .gte('latitude', minLat)
    .lte('latitude', maxLat)
    .gte('longitude', minLng)
    .lte('longitude', maxLng)
    .limit(limit);

  // Same name / barangay / city match as the Search tab. Commas and brackets
  // are separators in a PostgREST `or` filter, so they cannot be part of a term.
  const term = search.replace(/[,()]/g, ' ').trim();
  if (term) {
    query = query.or(`name.ilike.%${term}%,barangay.ilike.%${term}%,city.ilike.%${term}%`);
  }

  const { data, error } = await query;
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

/**
 * Shift a region's center south so a pin at the old center lands visibly above a bottom sheet.
 * Zoom is preserved (deltas unchanged). `fraction` is the viewport-height share occupied by the sheet's top edge.
 * 0.10 ≈ pin ~40% from top, safely inside a 25% sheet without triggering the buffered-bbox refetch.
 */
export function offsetRegionForSheet(
  region: { latitude: number; longitude: number; latitudeDelta: number; longitudeDelta: number },
  pin: { latitude: number; longitude: number },
  fraction = 0.1,
): { latitude: number; longitude: number; latitudeDelta: number; longitudeDelta: number } {
  const clamped = Math.max(0, Math.min(0.35, fraction));
  return {
    latitude: pin.latitude - region.latitudeDelta * clamped,
    longitude: pin.longitude,
    latitudeDelta: region.latitudeDelta,
    longitudeDelta: region.longitudeDelta,
  };
}
