import { File } from 'expo-file-system'
import { isExpiredDate } from './expiry'

import { supabase, type Database } from '@repo/supabase'
import {
  DOCUMENT_TYPES,
  PASSPORT_SLOT_DOC_TYPES,
  isReviewEligibleDocType,
  requiresProofOfIncome,
  type ApplicationDocumentSlot,
} from '@repo/constants'

export const PASSPORT_DOCUMENTS_BUCKET = 'application-documents'
const PASSPORT_PREFIX = 'passport'

export type PassportDocumentRow =
  Database['public']['Tables']['passport_documents']['Row']

export interface PassportUploadAsset {
  uri: string
  fileName: string
  mimeType: string
}

const MIME_MAP: Record<string, string> = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
  heic: 'image/heic',
  pdf: 'application/pdf',
  doc: 'application/msword',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
}

function getContentType(fileName: string, fallback: string): string {
  if (fallback) return fallback
  const ext = fileName.split('.').pop()?.toLowerCase() ?? ''
  return MIME_MAP[ext] ?? 'application/octet-stream'
}

function slugify(docType: string): string {
  const slug = docType
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
  return slug || 'document'
}

function passportPath(userId: string, docType: string, fileName: string): string {
  const ext = fileName.split('.').pop()?.toLowerCase() ?? 'jpg'
  return `${userId}/${PASSPORT_PREFIX}/${slugify(docType)}-${Date.now()}.${ext}`
}

export async function fetchPassportDocuments(
  userId: string
): Promise<PassportDocumentRow[]> {
  const { data, error } = await supabase
    .from('passport_documents')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return (data ?? []) as PassportDocumentRow[]
}

export interface UploadPassportDocumentInput {
  userId: string
  docType: string
  asset: PassportUploadAsset
  expiresAt?: string | null
}

export async function uploadPassportDocument({
  userId,
  docType,
  asset,
  expiresAt = null,
}: UploadPassportDocumentInput): Promise<PassportDocumentRow> {
  if (!DOCUMENT_TYPES.includes(docType)) {
    throw new Error('This document type is not available for Passport uploads. Choose a supported document or verify your ID through live capture and a selfie.')
  }

  const path = passportPath(userId, docType, asset.fileName)
  const bytes = await new File(asset.uri).bytes()

  const { error: uploadError } = await supabase.storage
    .from(PASSPORT_DOCUMENTS_BUCKET)
    .upload(path, bytes, { contentType: getContentType(asset.fileName, asset.mimeType) })

  if (uploadError) {
    throw new Error(`Failed to upload ${docType}: ${uploadError.message}`)
  }

  const { data, error: insertError } = await supabase
    .from('passport_documents')
    .insert({
      user_id: userId,
      doc_type: docType,
      storage_path: path,
      mime_type: getContentType(asset.fileName, asset.mimeType),
      expires_at: expiresAt,
    })
    .select()
    .single()

  if (insertError || !data) {
    await supabase.storage.from(PASSPORT_DOCUMENTS_BUCKET).remove([path])
    throw new Error(insertError?.message ?? 'Could not save your document. Please try again.')
  }

  return data as PassportDocumentRow
}

/**
 * Wallet read for the passport screen. The approved verification ID is linked
 * as the primary row first (idempotent server-side), then the wallet is read,
 * so the caller gets authoritative data in a single await — no intermediate
 * "empty" result that would flash the empty state before the linked ID lands.
 */
export async function fetchPassportDocumentsWithVerification(
  userId: string
): Promise<PassportDocumentRow[]> {
  await linkApprovedVerification(userId)
  return fetchPassportDocuments(userId)
}

/**
 * Links the user's latest approved ID verification into the passport as the
 * primary (main) ID row, holding both the front and back captures.
 * Idempotent: upgrades the existing link when one already points at the
 * verification row.
 */
export async function linkApprovedVerification(
  userId: string
): Promise<PassportDocumentRow | null> {
  const { data: verification, error: verificationError } = await supabase
    .from('user_verifications')
    .select('*')
    .eq('user_id', userId)
    .eq('status', 'approved')
    .order('reviewed_at', { ascending: false })
    .order('submitted_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (verificationError) throw verificationError
  if (!verification) return null

  const { data: existing, error: existingError } = await supabase
    .from('passport_documents')
    .select('*')
    .eq('user_id', userId)
    .eq('verification_id', verification.id)
    .limit(1)
    .maybeSingle()

  if (existingError) throw existingError
  if (existing) {
    const needsUpgrade =
      !existing.is_verified ||
      !existing.is_primary ||
      (existing.storage_path_back ?? null) !== (verification.id_back_path ?? null) ||
      existing.storage_path !== verification.id_front_path
    if (needsUpgrade) {
      const { data: updated, error: updateError } = await supabase
        .from('passport_documents')
        .update({
          storage_path: verification.id_front_path,
          storage_path_back: verification.id_back_path,
          is_verified: true,
          is_primary: true,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existing.id)
        .select()
        .single()
      if (updateError) throw updateError
      return (updated ?? existing) as PassportDocumentRow
    }
    return existing as PassportDocumentRow
  }

  const { data, error: insertError } = await supabase
    .from('passport_documents')
    .insert({
      user_id: userId,
      doc_type: verification.id_type,
      storage_path: verification.id_front_path,
      storage_path_back: verification.id_back_path,
      mime_type: 'image/jpeg',
      id_type: verification.id_type,
      verification_id: verification.id,
      is_verified: true,
      is_primary: true,
      review_status: 'verified',
    })
    .select()
    .single()

  if (insertError || !data) {
    throw new Error(insertError?.message ?? 'Could not link your verified ID. Please try again.')
  }

  return data as PassportDocumentRow
}

/**
 * Tenant-requested admin review for an eligible supporting document
 * (proof of income, NBI clearance). Moves unverified|rejected -> pending;
 * the DB trigger stamps requested_at and notifies admins. Identity docs are
 * verified via the account-verification flow instead.
 */
export async function requestPassportDocumentReview(input: {
  id: string
  userId: string
}): Promise<PassportDocumentRow> {
  const { data: row, error: rowError } = await supabase
    .from('passport_documents')
    .select('id, user_id, doc_type, review_status, is_primary, verification_id, expires_at')
    .eq('id', input.id)
    .eq('user_id', input.userId)
    .limit(1)
    .maybeSingle()

  if (rowError) throw rowError
  if (!row) throw new Error('Document not found.')

  if (row.is_primary || row.verification_id) {
    throw new Error(
      'Identity documents are verified through account verification instead.'
    )
  }

  if (!isReviewEligibleDocType(row.doc_type)) {
    throw new Error('This document type is not eligible for admin review yet.')
  }

  if (row.review_status === 'pending') {
    throw new Error('This document is already under review.')
  }

  if (row.review_status === 'verified') {
    throw new Error('This document is already verified.')
  }

  if (isExpiredDate(row.expires_at)) {
    throw new Error('This document is expired. Upload a current copy first.')
  }

  const { data, error: updateError } = await supabase
    .from('passport_documents')
    .update({ review_status: 'pending' })
    .eq('id', input.id)
    .eq('user_id', input.userId)
    .select()
    .single()

  if (updateError || !data) {
    throw new Error(updateError?.message ?? 'Could not request review. Please try again.')
  }

  return data as PassportDocumentRow
}

const ACTIVE_APPLICATION_STATUSES = ['pending', 'approved']

/**
 * Deletes a passport document. The primary verification ID is managed
 * automatically and can never be deleted. Deletion is also blocked while an
 * active rental application references the same storage path, so landlords
 * never lose application evidence after auto-attach by reference.
 * Documents under admin review cannot be deleted until the review resolves.
 */
export async function deletePassportDocument(input: {
  id: string
  userId: string
  storagePath: string
}): Promise<void> {
  const { data: row, error: rowError } = await supabase
    .from('passport_documents')
    .select('is_primary, verification_id, review_status')
    .eq('id', input.id)
    .eq('user_id', input.userId)
    .limit(1)
    .maybeSingle()

  if (rowError) throw rowError
  if (row && (row.is_primary || row.verification_id)) {
    throw new Error(
      'Your primary verification ID is managed automatically and cannot be deleted.'
    )
  }
  if (row && row.review_status === 'pending') {
    throw new Error(
      'This document is under admin review and cannot be deleted yet.'
    )
  }

  const { data: applications, error: applicationsError } = await supabase
    .from('rental_application')
    .select('gov_id_url, proof_of_income_url, proof_of_billing_url, nbi_clearance_url')
    .eq('tenant_id', input.userId)
    .in('status', ACTIVE_APPLICATION_STATUSES)

  if (applicationsError) throw applicationsError

  const referenced = (applications ?? []).some((row) =>
    [
      row.gov_id_url,
      row.proof_of_income_url,
      row.proof_of_billing_url,
      row.nbi_clearance_url,
    ].includes(input.storagePath)
  )

  if (referenced) {
    throw new Error(
      'This document is attached to an active application and cannot be deleted yet.'
    )
  }

  const { error: removeError } = await supabase.storage
    .from(PASSPORT_DOCUMENTS_BUCKET)
    .remove([input.storagePath])

  if (removeError) {
    console.warn('Cleanup failed for', input.storagePath, removeError.message)
  }

  const { error: deleteError } = await supabase
    .from('passport_documents')
    .delete()
    .eq('id', input.id)
    .eq('user_id', input.userId)

  if (deleteError) throw deleteError
}

/**
 * Resolves which of the given storage paths are verified passport documents
 * for a tenant. Used by landlord application views to badge verified docs.
 * RLS scopes rows to the landlord's own applicants.
 */
export async function fetchPassportVerifiedPaths(
  userId: string,
  paths: readonly string[]
): Promise<Set<string>> {
  const unique = [...new Set(paths.filter(Boolean))]
  if (!userId || unique.length === 0) return new Set()

  const { data, error } = await supabase
    .from('passport_documents')
    .select('storage_path, expires_at')
    .eq('user_id', userId)
    .in('storage_path', unique)
    .eq('is_verified', true)

  if (error) throw error
  // An expired document no longer counts as verified for landlords.
  return new Set(
    ((data ?? []) as { storage_path: string; expires_at: string | null }[])
      .filter((row) => !isExpiredDate(row.expires_at))
      .map((row) => row.storage_path)
  )
}

/**
 * Returns passport docs that can satisfy an application slot — primary ID,
 * then verified, then newest. Gov IDs also match rows carrying an id_type
 * (verification-linked IDs whose doc_type is the raw ID name).
 */
export function passportDocsForSlot(
  docs: readonly PassportDocumentRow[],
  slot: ApplicationDocumentSlot
): PassportDocumentRow[] {
  const accepted = PASSPORT_SLOT_DOC_TYPES[slot]
  return docs
    .filter((doc) => {
      if (accepted.includes(doc.doc_type)) return true
      if (slot === 'govId' && doc.id_type) return true
      return false
    })
    .sort((a, b) => {
      if (a.is_primary !== b.is_primary) return a.is_primary ? -1 : 1
      if (a.is_verified !== b.is_verified) return a.is_verified ? -1 : 1
      return b.created_at.localeCompare(a.created_at)
    })
}

export interface PassportApplicationSelection {
  /** Best usable passport document per application slot (null when none). */
  docs: Record<ApplicationDocumentSlot, PassportDocumentRow | null>
  /** Required slots with no usable document at all. */
  missing: ApplicationDocumentSlot[]
  /** Required slots whose only matching documents are expired. */
  expired: ApplicationDocumentSlot[]
}

/**
 * Picks the passport documents submitted with a rental application. Rejected
 * and expired documents are never attached. Proof of income is only required
 * when the employment type needs it (unknown employment skips that check);
 * NBI clearance is optional and attached when available.
 */
export function selectPassportDocsForApplication(
  docs: readonly PassportDocumentRow[],
  employmentType: string | null = null
): PassportApplicationSelection {
  const slots: ApplicationDocumentSlot[] = [
    'govId',
    'proofOfIncome',
    'proofOfBilling',
    'nbiClearance',
  ]
  const required: ApplicationDocumentSlot[] = ['govId', 'proofOfBilling']
  if (employmentType && requiresProofOfIncome(employmentType)) {
    required.push('proofOfIncome')
  }

  const selection: PassportApplicationSelection = {
    docs: { govId: null, proofOfIncome: null, proofOfBilling: null, nbiClearance: null },
    missing: [],
    expired: [],
  }

  for (const slot of slots) {
    const candidates = passportDocsForSlot(docs, slot).filter(
      (doc) => doc.review_status !== 'rejected'
    )
    const usable = candidates.filter((doc) => !isExpiredDate(doc.expires_at))
    selection.docs[slot] = usable[0] ?? null

    if (usable.length > 0 || !required.includes(slot)) continue
    if (candidates.length > 0) selection.expired.push(slot)
    else selection.missing.push(slot)
  }

  return selection
}
