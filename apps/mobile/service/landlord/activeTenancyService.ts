import { supabase } from "@repo/supabase";

/**
 * Whether the landlord has a running tenancy. A landlord who is not verified
 * keeps that tenancy's payments and maintenance screens; the database repeats
 * the rule (`20261028190000_active_tenancy_exemptions.sql`), so this only
 * decides what to show. A failed read means "no": the wall stays up.
 */
export async function fetchHasActiveTenancyAsLandlord(landlordId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from("tenancies")
    .select("id")
    .eq("landlord_id", landlordId)
    .eq("status", "active")
    .limit(1);

  if (error) return false;
  return (data?.length ?? 0) > 0;
}
