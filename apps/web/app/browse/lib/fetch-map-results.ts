import type { createClient } from "@repo/supabase/browser";
import type { BBox } from "@repo/utils";

import { toBrowseApartment, type BrowseApartment } from "./browse-apartment";
import { applyBrowseFilters, applyBrowseSort } from "./browse-query";

type BrowserSupabaseClient = ReturnType<typeof createClient>;

/** Same cap as mobile's map search; past it the list asks the user to zoom in. */
export const MAP_RESULT_LIMIT = 100;

export interface MapApartment extends BrowseApartment {
  latitude: number;
  longitude: number;
}

export interface MapResults {
  apartments: MapApartment[];
  /** True when the query hit the cap, so more listings exist inside the bounds. */
  capped: boolean;
}

// Browse's filters and search, limited to listings inside a map viewport.
// Same visibility rules as the paged list (live, not hidden, available or
// unverified); RLS stays the authority. Runs in the browser because the
// viewport changes on the client.
export async function fetchApartmentsInBounds(
  supabase: BrowserSupabaseClient,
  params: Record<string, string>,
  bbox: BBox,
  limit = MAP_RESULT_LIMIT,
): Promise<MapResults> {
  let query = supabase
    .from("apartments")
    .select(
      `id, name, barangay, city, monthly_rent, average_rating, latitude, longitude,
        no_bedrooms, no_bathrooms, area_sqm, is_verified,
        apartment_images(url, url_thumb, is_cover, created_at)`,
    )
    .is("deleted_at", null)
    .eq("is_hidden_by_admin", false)
    .in("status", ["available", "unverified"])
    .not("latitude", "is", null)
    .not("longitude", "is", null)
    .gte("latitude", bbox.minLat)
    .lte("latitude", bbox.maxLat)
    .gte("longitude", bbox.minLng)
    .lte("longitude", bbox.maxLng);

  // Cards only read the cover image: covers first, one image row per listing.
  query = query
    .order("is_cover", { foreignTable: "apartment_images", ascending: false })
    .order("created_at", { foreignTable: "apartment_images", ascending: true })
    .limit(1, { foreignTable: "apartment_images" });

  query = applyBrowseFilters(query, params);
  query = applyBrowseSort(query, params);

  const { data, error } = await query.limit(limit);
  if (error) throw new Error(error.message);

  const apartments = (data ?? []).flatMap((row) =>
    row.latitude == null || row.longitude == null
      ? []
      : [{ ...toBrowseApartment(row), latitude: row.latitude, longitude: row.longitude }],
  );

  return { apartments, capped: (data ?? []).length >= limit };
}
