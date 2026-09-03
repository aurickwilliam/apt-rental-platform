import { getGoogleMapsApiKey } from '@/utils/mapConfig';

export interface PlaceAutocompletePrediction {
  placeId: string;
  description: string;
  mainText: string;
  secondaryText: string;
}

export interface PlaceDetails {
  placeId: string;
  formattedAddress: string;
  latitude: number;
  longitude: number;
  streetName: string;
  barangay: string;
  city: string;
  province: string;
  postalCode: string;
}

// Session token for billing: one billing event per session, not per keystroke.
// Simple UUID v4 without dependency.
export function createPlacesSessionToken(): string {
  // RFC4122 v4
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

function parseAddressComponents(components: { long_name: string; short_name: string; types: string[] }[]) {
  const get = (type: string) =>
    components.find((c) => c.types.includes(type))?.long_name ?? '';
  const getShort = (type: string) =>
    components.find((c) => c.types.includes(type))?.short_name ?? '';

  // For PH, barangay often appears as sublocality_level_1 or neighborhood
  const barangay =
    get('sublocality_level_1') || get('sublocality') || get('neighborhood') || '';
  const streetName = [get('street_number'), get('route')].filter(Boolean).join(' ').trim();
  const city = get('locality') || get('administrative_area_level_2') || '';
  const province = get('administrative_area_level_1') || '';
  const postalCode = get('postal_code') || getShort('postal_code') || '';

  return { streetName, barangay, city, province, postalCode };
}

/**
 * Legacy Places Autocomplete (stable, billed per session if sessionToken provided).
 * Uses https://maps.googleapis.com/maps/api/place/autocomplete/json
 * Alternative New API is https://places.googleapis.com/v1/places:autocomplete — similar cost, requires field mask.
 * We keep legacy for Expo compat and simpler JSON parsing.
 */
export async function fetchPlaceAutocomplete(
  input: string,
  sessionToken: string,
  opts?: { lat?: number; lng?: number },
): Promise<PlaceAutocompletePrediction[]> {
  const key = getGoogleMapsApiKey();
  if (!key) throw new Error('Missing EXPO_PUBLIC_GOOGLE_MAPS_API_KEY');
  if (!input.trim()) return [];

  const params = new URLSearchParams({
    input: input.trim(),
    key,
    sessiontoken: sessionToken,
    components: 'country:ph',
    language: 'en',
  });
  // Bias to CAMANAVA area when coords known (does not hard-filter)
  if (opts?.lat != null && opts?.lng != null) {
    params.set('location', `${opts.lat},${opts.lng}`);
    params.set('radius', '20000');
  }

  const url = `https://maps.googleapis.com/maps/api/place/autocomplete/json?${params.toString()}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Autocomplete HTTP ${res.status}`);
  const json = (await res.json()) as {
    status: string;
    predictions?: {
      place_id: string;
      description: string;
      structured_formatting?: { main_text: string; secondary_text: string };
    }[];
    error_message?: string;
  };
  if (json.status !== 'OK' && json.status !== 'ZERO_RESULTS') {
    throw new Error(json.error_message || `Places status ${json.status}`);
  }
  return (json.predictions ?? []).map((p) => ({
    placeId: p.place_id,
    description: p.description,
    mainText: p.structured_formatting?.main_text ?? p.description,
    secondaryText: p.structured_formatting?.secondary_text ?? '',
  }));
}

export async function fetchPlaceDetails(
  placeId: string,
  sessionToken: string,
): Promise<PlaceDetails> {
  const key = getGoogleMapsApiKey();
  if (!key) throw new Error('Missing EXPO_PUBLIC_GOOGLE_MAPS_API_KEY');

  const params = new URLSearchParams({
    place_id: placeId,
    key,
    sessiontoken: sessionToken,
    fields: 'formatted_address,geometry,address_component,place_id',
    language: 'en',
  });
  const url = `https://maps.googleapis.com/maps/api/place/details/json?${params.toString()}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Details HTTP ${res.status}`);
  const json = (await res.json()) as {
    status: string;
    result?: {
      place_id: string;
      formatted_address: string;
      geometry?: { location?: { lat: number; lng: number } };
      address_components?: { long_name: string; short_name: string; types: string[] }[];
    };
    error_message?: string;
  };
  if (json.status !== 'OK' || !json.result) {
    throw new Error(json.error_message || `Details status ${json.status}`);
  }
  const loc = json.result.geometry?.location;
  if (loc == null) throw new Error('Missing geometry');
  const { streetName, barangay, city, province, postalCode } = parseAddressComponents(
    json.result.address_components ?? [],
  );

  return {
    placeId: json.result.place_id,
    formattedAddress: json.result.formatted_address,
    latitude: loc.lat,
    longitude: loc.lng,
    streetName: streetName || json.result.formatted_address.split(',')[0]?.trim() || '',
    barangay,
    city,
    province,
    postalCode,
  };
}
