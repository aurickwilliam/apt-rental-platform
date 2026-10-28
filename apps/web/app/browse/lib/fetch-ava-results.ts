import type { createClient } from "@repo/supabase/browser";
import { AVA_RESULT_LIMIT } from "@repo/utils";

import { toBrowseApartment, type BrowseApartment } from "./browse-apartment";
import { applyBrowseFilters, applyBrowseSort } from "./browse-query";

type BrowserSupabaseClient = ReturnType<typeof createClient>;

// The few listings Ava shows under a reply. Same filters, sort and visibility
// rules as the Browse list (live, not hidden, available or unverified), so
// "See all results" opens exactly the same search; RLS stays the authority.
export async function fetchAvaResults(
  supabase: BrowserSupabaseClient,
  params: Record<string, string>,
  limit = AVA_RESULT_LIMIT,
): Promise<BrowseApartment[]> {
  let query = supabase
    .from("apartments")
    .select(
      `id, name, barangay, city, monthly_rent, average_rating,
        no_bedrooms, no_bathrooms, area_sqm, is_verified,
        apartment_images(url, url_thumb, is_cover, created_at)`,
    )
    .is("deleted_at", null)
    .eq("is_hidden_by_admin", false)
    .in("status", ["available", "unverified"]);

  // Cards only read the cover image: covers first, one image row per listing.
  query = query
    .order("is_cover", { foreignTable: "apartment_images", ascending: false })
    .order("created_at", { foreignTable: "apartment_images", ascending: true })
    .limit(1, { foreignTable: "apartment_images" });

  query = applyBrowseFilters(query, params);
  query = applyBrowseSort(query, params);

  const { data, error } = await query.limit(limit);
  if (error) throw new Error(error.message);

  return (data ?? []).map(toBrowseApartment);
}
