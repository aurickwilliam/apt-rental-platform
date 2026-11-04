import type { createClient } from "@repo/supabase/browser";

type Supabase = ReturnType<typeof createClient>;
type ListingStatus = "available" | "under_maintenance";

/** Compare-and-set: a stale page must never overwrite a newly occupied unit. */
export async function changePropertyVisibility(
  supabase: Supabase,
  apartmentId: string,
  currentStatus: ListingStatus,
): Promise<{ success: true; status: ListingStatus } | { success: false; error: string }> {
  const status = currentStatus === "available" ? "under_maintenance" : "available";
  const { data, error } = await supabase.from("apartments")
    .update({ status })
    .eq("id", apartmentId)
    .eq("status", currentStatus)
    .is("deleted_at", null)
    .select("status")
    .maybeSingle();

  if (error) return { success: false, error: error.message };
  if (!data) return { success: false, error: "This property has changed or is no longer available. Refresh the page and try again." };
  return { success: true, status };
}
