"use client";

import { createClient } from "@repo/supabase/browser";

import { signedLeaseContentType, signedLeaseUploadPath, validateSignedLeaseFile } from "@/lib/signed-lease";

export const SIGNED_LEASES_BUCKET = "signed-leases";

// Signed contracts are personal data: the URL is short-lived and re-created
// on every view instead of being stored.
export const SIGNED_LEASE_SIGNED_URL_TTL_SECONDS = 60 * 60;

type SupabaseBrowserClient = ReturnType<typeof createClient>;

/** Reads the tenancy's stored path; used to confirm an uncertain write. */
async function storedSignedLeasePath(
  supabase: SupabaseBrowserClient,
  tenancyId: string,
): Promise<string | null> {
  const { data, error } = await supabase
    .from("tenancies")
    .select("signed_lease_path")
    .eq("id", tenancyId)
    .maybeSingle();
  if (error) return null;
  return data?.signed_lease_path ?? null;
}

async function removeUploadedFile(
  supabase: SupabaseBrowserClient,
  path: string,
): Promise<void> {
  const { error } = await supabase.storage.from(SIGNED_LEASES_BUCKET).remove([path]);
  if (error) console.warn("Signed lease cleanup failed for", path, error.message);
}

/**
 * Uploads the executed contract, records it through set_tenancy_signed_lease()
 * and then deletes the file it replaced. The RPC is the only write path (a
 * trigger blocks direct column writes) and validates that the caller is the
 * landlord, the tenancy is active and the object exists, so a failure leaves
 * the previous contract untouched.
 */
export async function uploadSignedLease(input: {
  tenancyId: string;
  file: File;
  previousPath: string | null;
}): Promise<string> {
  const fileError = validateSignedLeaseFile(input.file);
  const contentType = signedLeaseContentType(input.file);
  if (fileError || !contentType) {
    throw new Error(fileError ?? "Upload a PDF, JPG, PNG, or WebP file.");
  }

  const supabase = createClient();
  const path = signedLeaseUploadPath(input.tenancyId, input.file.name, Date.now());

  const { error: uploadError } = await supabase.storage
    .from(SIGNED_LEASES_BUCKET)
    .upload(path, input.file, { contentType });
  if (uploadError) throw new Error("Could not upload the signed lease. Please try again.");

  const { error: saveError } = await supabase.rpc("set_tenancy_signed_lease", {
    p_tenancy_id: input.tenancyId,
    p_path: path,
  });

  if (saveError) {
    // A dropped connection can hide a write that landed. Re-read the row
    // before discarding the upload: the new file must stay when the tenancy
    // already points at it.
    const storedPath = await storedSignedLeasePath(supabase, input.tenancyId);
    if (storedPath !== path) {
      await removeUploadedFile(supabase, path);
      throw new Error(saveError.message);
    }
  }

  if (input.previousPath) {
    // Best effort: a leftover file is harmless, a broken reference is not.
    await removeUploadedFile(supabase, input.previousPath);
  }

  return path;
}

/** Tenant confirmation that the executed contract matches the agreement. */
export async function acknowledgeSignedLease(tenancyId: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.rpc("acknowledge_signed_lease", { p_tenancy_id: tenancyId });
  if (error) throw new Error(error.message);
}

/** Short-lived URL for viewing the private contract. */
export async function createSignedLeaseUrl(path: string): Promise<string> {
  const supabase = createClient();
  const { data, error } = await supabase.storage
    .from(SIGNED_LEASES_BUCKET)
    .createSignedUrl(path, SIGNED_LEASE_SIGNED_URL_TTL_SECONDS);
  if (error || !data?.signedUrl) {
    throw new Error("Could not open the signed lease. Please try again.");
  }
  return data.signedUrl;
}
