/** Structural slice of a Supabase client, so the lookup stays testable. */
interface RpcClient {
  rpc: (
    fn: "get_verified_landlord_ids",
    args: { p_landlord_ids: string[] },
  ) => PromiseLike<{ data: unknown; error: { message: string } | null }>;
}

interface DocumentsRpcClient {
  rpc: (
    fn: "get_landlord_ownership_documents",
    args: { p_landlord_id: string },
  ) => PromiseLike<{ data: unknown; error: { message: string } | null }>;
}

export interface OwnershipDocumentRow {
  docType: string;
  isVerified: boolean;
}

/**
 * The ownership document types this landlord has added, each flagged verified
 * or not (unsorted). Names and a flag only; the files stay private. A failed
 * lookup lists none.
 */
export async function fetchLandlordOwnershipDocuments(
  client: DocumentsRpcClient,
  landlordId: string,
): Promise<OwnershipDocumentRow[]> {
  const { data, error } = await client.rpc("get_landlord_ownership_documents", { p_landlord_id: landlordId });
  if (error) {
    console.error("Landlord ownership documents lookup failed:", error.message);
    return [];
  }
  const rows = Array.isArray(data) ? (data as { doc_type: string; is_verified: boolean }[]) : [];
  return rows.map((row) => ({ docType: row.doc_type, isVerified: Boolean(row.is_verified) }));
}

/**
 * Which of these landlords has an admin-approved ownership document in APT
 * Passport. The database returns only ids (the documents stay private), and
 * a failed lookup shows no badge rather than an unverified claim either way.
 */
export async function fetchVerifiedLandlordIds(client: RpcClient, landlordIds: string[]): Promise<Set<string>> {
  const ids = [...new Set(landlordIds)].filter(Boolean);
  if (ids.length === 0) return new Set();

  const { data, error } = await client.rpc("get_verified_landlord_ids", { p_landlord_ids: ids });
  if (error) {
    console.error("Verified landlord lookup failed:", error.message);
    return new Set();
  }
  return new Set(Array.isArray(data) ? (data as string[]) : []);
}
