import type { createClient } from "@repo/supabase/browser";

import { toRecentApartmentSearch, type RecentApartmentSearch } from "@/lib/recent-apartment-searches";
import { toBrowseApartment, type BrowseApartmentRow } from "./browse-apartment";

type BrowserSupabaseClient = ReturnType<typeof createClient>;

// Recent entries are snapshots, so renames, new photos, deletions and admin
// hiding would otherwise go unnoticed. Re-reads the listings under the same
// visibility rules as the Browse list (RLS stays the authority): fresh details
// for those still visible, and the rest are dropped, keeping the saved order.
export async function reconcileRecentApartments(
  supabase: BrowserSupabaseClient,
  recent: RecentApartmentSearch[],
): Promise<RecentApartmentSearch[]> {
  if (recent.length === 0) return recent;

  const { data, error } = await supabase
    .from("apartments")
    .select(
      `id, name, barangay, city, monthly_rent, average_rating, no_bedrooms, no_bathrooms,
        area_sqm, is_verified, apartment_images(url, url_thumb, is_cover, created_at)`,
    )
    .in("id", recent.map((item) => item.id))
    .is("deleted_at", null)
    .eq("is_hidden_by_admin", false)
    .order("is_cover", { foreignTable: "apartment_images", ascending: false })
    .order("created_at", { foreignTable: "apartment_images", ascending: true })
    .limit(1, { foreignTable: "apartment_images" });
  if (error) throw new Error(error.message);

  const fresh = new Map(
    ((data ?? []) as BrowseApartmentRow[]).map((row) => {
      const entry = toRecentApartmentSearch(toBrowseApartment(row));
      return [entry.id, entry] as const;
    }),
  );
  return recent.flatMap((item) => fresh.get(item.id) ?? []);
}
