import { sortLandlordOwnershipDocuments, type LandlordOwnershipDocument } from "@repo/constants";
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

/**
 * The ownership documents this landlord has added, verified first, each flagged
 * verified or not. Names and a flag only; the files stay private. A failed
 * lookup lists none.
 */
export async function fetchLandlordOwnershipDocuments(landlordId: string): Promise<LandlordOwnershipDocument[]> {
  const { data, error } = await supabase.rpc("get_landlord_ownership_documents", {
    p_landlord_id: landlordId,
  });

  if (error) {
    console.error("Error fetching landlord ownership documents:", error);
    return [];
  }
  return sortLandlordOwnershipDocuments(
    (data ?? []).map((row) => ({ docType: row.doc_type, isVerified: Boolean(row.is_verified) })),
  );
}
