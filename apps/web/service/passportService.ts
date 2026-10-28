"use client";

import { createClient } from "@repo/supabase/browser";
import type { Database } from "@repo/supabase";
import { PASSPORT_UPLOADABLE_DOC_TYPES, isReviewEligibleDocType } from "@repo/constants";
import { findSupportingDocumentOfType, isExpiredDate } from "@repo/passport";

import { passportUploadContentType, validatePassportUploadFile } from "@/lib/passport-upload";

export const PASSPORT_DOCUMENTS_BUCKET = "application-documents";
const PASSPORT_PREFIX = "passport";
const ACTIVE_APPLICATION_STATUSES = ["pending", "approved"];

export type PassportDocumentRow = Database["public"]["Tables"]["passport_documents"]["Row"];
type ApprovedVerificationRow = Database["public"]["Tables"]["user_verifications"]["Row"];
type BrowserSupabaseClient = ReturnType<typeof createClient>;

function slugify(docType: string): string {
  const slug = docType
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return slug || "document";
}

function passportPath(userId: string, docType: string, fileName: string): string {
  const ext = fileName.split(".").pop()?.toLowerCase() ?? "jpg";
  return `${userId}/${PASSPORT_PREFIX}/${slugify(docType)}-${Date.now()}.${ext}`;
}

async function fetchPassportDocumentsWithClient(
  supabase: BrowserSupabaseClient,
  userId: string,
): Promise<PassportDocumentRow[]> {
  const { data, error } = await supabase
    .from("passport_documents")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data ?? []) as PassportDocumentRow[];
}

export async function fetchPassportDocuments(userId: string): Promise<PassportDocumentRow[]> {
  return fetchPassportDocumentsWithClient(createClient(), userId);
}

async function fetchLatestApprovedVerification(
  supabase: BrowserSupabaseClient,
  userId: string,
): Promise<ApprovedVerificationRow | null> {
  const { data, error } = await supabase
    .from("user_verifications")
    .select("*")
    .eq("user_id", userId)
    .eq("status", "approved")
    .order("reviewed_at", { ascending: false })
    .order("submitted_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  return (data ?? null) as ApprovedVerificationRow | null;
}

async function fetchLinkedPassportDocument(
  supabase: BrowserSupabaseClient,
  userId: string,
  verificationId: string,
): Promise<PassportDocumentRow | null> {
  const { data, error } = await supabase
    .from("passport_documents")
    .select("*")
    .eq("user_id", userId)
    .eq("verification_id", verificationId)
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  return (data ?? null) as PassportDocumentRow | null;
}

function needsVerificationLinkUpdate(
  existing: PassportDocumentRow,
  verification: ApprovedVerificationRow,
): boolean {
  return (
    !existing.is_verified ||
    !existing.is_primary ||
    (existing.storage_path_back ?? null) !== (verification.id_back_path ?? null) ||
    existing.storage_path !== verification.id_front_path
  );
}

async function applyVerificationLink(
  supabase: BrowserSupabaseClient,
  userId: string,
  verification: ApprovedVerificationRow,
  existing: PassportDocumentRow | null,
): Promise<PassportDocumentRow | null> {
  if (existing) {
    if (!needsVerificationLinkUpdate(existing, verification)) return existing;

    const { data: updated, error: updateError } = await supabase
      .from("passport_documents")
      .update({
        storage_path: verification.id_front_path,
        storage_path_back: verification.id_back_path,
        is_verified: true,
        is_primary: true,
        updated_at: new Date().toISOString(),
      })
      .eq("id", existing.id)
      .select()
      .single();
    if (updateError) throw updateError;
    return (updated ?? existing) as PassportDocumentRow;
  }

  const { data, error: insertError } = await supabase
    .from("passport_documents")
    .insert({
      user_id: userId,
      doc_type: verification.id_type,
      storage_path: verification.id_front_path,
      storage_path_back: verification.id_back_path,
      mime_type: "image/jpeg",
      id_type: verification.id_type,
      verification_id: verification.id,
      is_verified: true,
      is_primary: true,
      review_status: "verified",
    })
    .select()
    .single();

  if (insertError || !data) {
    throw new Error(insertError?.message ?? "Could not link your verified ID. Please try again.");
  }
  return data as PassportDocumentRow;
}

/**
 * Links the user's latest approved ID verification into the passport as the
 * primary row holding its front and back captures. Sequential calls reuse or
 * upgrade an existing link; concurrent calls still require database-level
 * uniqueness or transactional linking to prevent duplicate inserts.
 */
export async function linkApprovedVerification(userId: string): Promise<PassportDocumentRow | null> {
  const supabase = createClient();
  const verification = await fetchLatestApprovedVerification(supabase, userId);
  if (!verification) return null;

  const existing = await fetchLinkedPassportDocument(supabase, userId, verification.id);
  return applyVerificationLink(supabase, userId, verification, existing);
}

/**
 * Verification resolves before the wallet snapshot is read. The common
 * already-linked path uses two sequential reads (verification -> wallet),
 * without a separate linked-row query. Any required link write settles
 * before a fresh wallet snapshot is returned.
 */
export async function fetchPassportDocumentsWithVerification(
  userId: string,
): Promise<PassportDocumentRow[]> {
  const supabase = createClient();
  const verification = await fetchLatestApprovedVerification(supabase, userId);
  const documents = await fetchPassportDocumentsWithClient(supabase, userId);

  if (!verification) return documents;

  const snapshot =
    documents.find((document) => document.verification_id === verification.id) ?? null;
  if (snapshot && !needsVerificationLinkUpdate(snapshot, verification)) return documents;

  // Best-effort only: this can find a link committed after the wallet snapshot,
  // but concurrent requests can both pass the separate SELECT before INSERT.
  // Preventing duplicates requires database uniqueness or transactional linking.
  const existing = snapshot ?? (await fetchLinkedPassportDocument(supabase, userId, verification.id));
  if (existing && !needsVerificationLinkUpdate(existing, verification)) {
    return fetchPassportDocumentsWithClient(supabase, userId);
  }

  await applyVerificationLink(supabase, userId, verification, existing);
  return fetchPassportDocumentsWithClient(supabase, userId);
}

export interface UploadPassportDocumentInput {
  userId: string;
  docType: string;
  file: File;
  expiresAt?: string | null;
}

export async function uploadPassportDocument({
  userId,
  docType,
  file,
  expiresAt = null,
}: UploadPassportDocumentInput): Promise<PassportDocumentRow> {
  if (!PASSPORT_UPLOADABLE_DOC_TYPES.includes(docType)) {
    throw new Error(
      "This document type is not available for Passport uploads. Choose a supported document or verify your ID through live capture and a selfie.",
    );
  }

  // Enforced here as well as on the input: `accept` is only a hint.
  const fileError = validatePassportUploadFile(file);
  const contentType = passportUploadContentType(file);
  if (fileError || !contentType) {
    throw new Error(fileError ?? "Upload a JPG, PNG, WebP, or PDF file.");
  }

  const supabase = createClient();

  // One document per type: a second upload is a replacement of the first.
  const existing = findSupportingDocumentOfType(await fetchPassportDocumentsWithClient(supabase, userId), docType);
  if (existing) {
    throw new Error(`You already added a ${docType}. Open it to replace the file.`);
  }

  const path = passportPath(userId, docType, file.name);

  const { error: uploadError } = await supabase.storage
    .from(PASSPORT_DOCUMENTS_BUCKET)
    .upload(path, file, { contentType });

  if (uploadError) {
    throw new Error(`Failed to upload ${docType}: ${uploadError.message}`);
  }

  const { data, error: insertError } = await supabase
    .from("passport_documents")
    .insert({
      user_id: userId,
      doc_type: docType,
      storage_path: path,
      mime_type: contentType,
      expires_at: expiresAt,
    })
    .select()
    .single();

  if (insertError || !data) {
    const { error: cleanupError } = await supabase.storage.from(PASSPORT_DOCUMENTS_BUCKET).remove([path]);
    if (cleanupError) console.warn("Cleanup failed for", path, cleanupError.message);
    throw new Error(insertError?.message ?? "Could not save your document. Please try again.");
  }

  return data as PassportDocumentRow;
}

export interface ReplacePassportDocumentInput {
  userId: string;
  id: string;
  file: File;
  expiresAt?: string | null;
}

/** True when an active rental application still points at this file. */
async function isReferencedByActiveApplication(
  supabase: BrowserSupabaseClient,
  tenantId: string,
  storagePath: string,
): Promise<boolean> {
  const { data, error } = await supabase
    .from("rental_application")
    .select("gov_id_url, gov_id_back_url, proof_of_income_url, proof_of_billing_url, nbi_clearance_url")
    .eq("tenant_id", tenantId)
    .in("status", ACTIVE_APPLICATION_STATUSES);
  if (error) throw error;

  return (data ?? []).some((application) =>
    [
      application.gov_id_url,
      application.gov_id_back_url,
      application.proof_of_income_url,
      application.proof_of_billing_url,
      application.nbi_clearance_url,
    ].includes(storagePath),
  );
}

/**
 * Swaps the file of a supporting document. The database resets it to
 * unverified (any earlier verification or review is cleared), so a verified
 * badge never moves onto a different file. The replaced file is deleted unless
 * an active application still references it, so landlords keep their evidence.
 */
export async function replacePassportDocument({
  userId,
  id,
  file,
  expiresAt = null,
}: ReplacePassportDocumentInput): Promise<PassportDocumentRow> {
  const fileError = validatePassportUploadFile(file);
  const contentType = passportUploadContentType(file);
  if (fileError || !contentType) {
    throw new Error(fileError ?? "Upload a JPG, PNG, WebP, or PDF file.");
  }

  const supabase = createClient();
  const { data: current, error: currentError } = await supabase
    .from("passport_documents")
    .select("doc_type, storage_path, is_primary, verification_id")
    .eq("id", id)
    .eq("user_id", userId)
    .limit(1)
    .maybeSingle();

  if (currentError) throw currentError;
  if (!current) throw new Error("Document not found.");
  if (current.is_primary || current.verification_id) {
    throw new Error("Your ID is managed through account verification and cannot be replaced here.");
  }

  const path = passportPath(userId, current.doc_type, file.name);
  const { error: uploadError } = await supabase.storage
    .from(PASSPORT_DOCUMENTS_BUCKET)
    .upload(path, file, { contentType });
  if (uploadError) {
    throw new Error(`Failed to upload ${current.doc_type}: ${uploadError.message}`);
  }

  const { data, error: replaceError } = await supabase.rpc("replace_passport_document", {
    p_document_id: id,
    p_storage_path: path,
    p_mime_type: contentType,
    p_expires_at: expiresAt,
  });

  if (replaceError || !data) {
    const { error: cleanupError } = await supabase.storage.from(PASSPORT_DOCUMENTS_BUCKET).remove([path]);
    if (cleanupError) console.warn("Cleanup failed for", path, cleanupError.message);
    throw new Error(replaceError?.message ?? "Could not replace your document. Please try again.");
  }

  try {
    if (!(await isReferencedByActiveApplication(supabase, userId, current.storage_path))) {
      const { error: removeError } = await supabase.storage
        .from(PASSPORT_DOCUMENTS_BUCKET)
        .remove([current.storage_path]);
      if (removeError) console.warn("Cleanup failed for", current.storage_path, removeError.message);
    }
  } catch (err) {
    // The swap already succeeded; a leftover file is harmless.
    console.warn("Could not check the replaced file for cleanup", err);
  }

  return data as PassportDocumentRow;
}

/**
 * Tenant-requested admin review for an eligible supporting document. Moves
 * unverified|rejected -> pending; the database stamps the request and
 * notifies admins. Identity documents are verified through account
 * verification instead.
 */
export async function requestPassportDocumentReview(input: {
  id: string;
  userId: string;
}): Promise<PassportDocumentRow> {
  const supabase = createClient();
  const { data: row, error: rowError } = await supabase
    .from("passport_documents")
    .select("id, user_id, doc_type, review_status, is_primary, verification_id, expires_at")
    .eq("id", input.id)
    .eq("user_id", input.userId)
    .limit(1)
    .maybeSingle();

  if (rowError) throw rowError;
  if (!row) throw new Error("Document not found.");
  if (row.is_primary || row.verification_id) {
    throw new Error("Identity documents are verified through account verification instead.");
  }
  if (!isReviewEligibleDocType(row.doc_type)) {
    throw new Error("This document type is not eligible for admin review yet.");
  }
  if (row.review_status === "pending") throw new Error("This document is already under review.");
  if (row.review_status === "verified") throw new Error("This document is already verified.");
  if (isExpiredDate(row.expires_at)) {
    throw new Error("This document is expired. Upload a current copy first.");
  }

  const { data, error: updateError } = await supabase
    .from("passport_documents")
    .update({ review_status: "pending" })
    .eq("id", input.id)
    .eq("user_id", input.userId)
    .select()
    .single();

  if (updateError || !data) {
    throw new Error(updateError?.message ?? "Could not request review. Please try again.");
  }
  return data as PassportDocumentRow;
}

/**
 * Deletes a passport document. The primary verification ID and documents
 * under admin review cannot be deleted, nor can a document an active rental
 * application references (landlords must keep the evidence they were sent).
 */
export async function deletePassportDocument(input: {
  id: string;
  userId: string;
  storagePath: string;
}): Promise<void> {
  const supabase = createClient();
  const { data: row, error: rowError } = await supabase
    .from("passport_documents")
    .select("is_primary, verification_id, review_status")
    .eq("id", input.id)
    .eq("user_id", input.userId)
    .limit(1)
    .maybeSingle();

  if (rowError) throw rowError;
  if (row && (row.is_primary || row.verification_id)) {
    throw new Error("Your primary verification ID is managed automatically and cannot be deleted.");
  }
  if (row && row.review_status === "pending") {
    throw new Error("This document is under admin review and cannot be deleted yet.");
  }

  const { data: applications, error: applicationsError } = await supabase
    .from("rental_application")
    .select("gov_id_url, gov_id_back_url, proof_of_income_url, proof_of_billing_url, nbi_clearance_url")
    .eq("tenant_id", input.userId)
    .in("status", ACTIVE_APPLICATION_STATUSES);

  if (applicationsError) throw applicationsError;

  const referenced = (applications ?? []).some((application) =>
    [
      application.gov_id_url,
      application.gov_id_back_url,
      application.proof_of_income_url,
      application.proof_of_billing_url,
      application.nbi_clearance_url,
    ].includes(input.storagePath),
  );
  if (referenced) {
    throw new Error("This document is attached to an active application and cannot be deleted yet.");
  }

  // Row first: if the database refuses the delete, the file is still intact.
  const { error: deleteError } = await supabase
    .from("passport_documents")
    .delete()
    .eq("id", input.id)
    .eq("user_id", input.userId);

  if (deleteError) throw deleteError;

  const { error: removeError } = await supabase.storage
    .from(PASSPORT_DOCUMENTS_BUCKET)
    .remove([input.storagePath]);
  if (removeError) console.warn("Cleanup failed for", input.storagePath, removeError.message);
}
