import { supabase } from "@repo/supabase";

/**
 * Whether an admin approved one of this landlord's ownership documents in APT
 * Passport. The database answers with a yes/no only (documents stay private);
 * a failed lookup shows no badge instead of throwing into the screen.
 */
export async function fetchIsVerifiedLandlord(landlordId: string): Promise<boolean> {
  const { data, error } = await supabase.rpc("get_verified_landlord_ids", {
    p_landlord_ids: [landlordId],
  });

  if (error) {
    console.error("Error checking verified landlord:", error);
    return false;
  }
  return (data ?? []).includes(landlordId);
}
