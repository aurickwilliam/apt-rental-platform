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
