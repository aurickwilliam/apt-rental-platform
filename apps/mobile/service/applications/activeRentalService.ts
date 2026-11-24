import { supabase } from "@repo/supabase";

/**
 * Whether the tenant already rents a place (an active tenancy). Applications
 * are blocked while one is running; the database repeats the rule
 * (`guard_application_active_tenancy`), so this only gives early feedback.
 * A failed read means "no": the database still refuses the insert.
 */
export async function fetchHasActiveRentalAsTenant(tenantId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from("tenancies")
    .select("id")
    .eq("tenant_id", tenantId)
    .eq("status", "active")
    .limit(1);

  if (error) return false;
  return (data?.length ?? 0) > 0;
}
