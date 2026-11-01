import { supabase } from "@repo/supabase";

import {
  toRecentApartmentSearch,
  type RecentApartmentSearch,
} from "@/service/search/recentApartmentSearches";
import {
  APARTMENT_CARD_SELECT,
  toApartmentCards,
  type ApartmentCardRow,
} from "@/service/search/apartmentCards";

// Recent entries are snapshots, so renames, new photos, deletions and admin
// hiding would otherwise go unnoticed. Re-reads the listings under the same
// visibility rules as the search list (RLS stays the authority): fresh details
// for those still visible, the rest dropped, saved order kept.
export async function reconcileRecentApartmentSearches(
  recent: RecentApartmentSearch[],
): Promise<RecentApartmentSearch[]> {
  if (recent.length === 0) return recent;

  const { data, error } = await supabase
    .from("apartments")
    .select(APARTMENT_CARD_SELECT)
    .in(
      "id",
      recent.map((item) => item.id),
    )
    .is("deleted_at", null)
    .eq("is_hidden_by_admin", false);
  if (error) throw error;

  const fresh = new Map(
    toApartmentCards((data ?? []) as ApartmentCardRow[]).map((card) => {
      const entry = toRecentApartmentSearch(card);
      return [entry.id, entry] as const;
    }),
  );
  return recent.flatMap((item) => fresh.get(item.id) ?? []);
}
