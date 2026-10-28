import { isDocumentTypeForPortal, type PassportPortalRole } from '@repo/constants'

interface PassportListDocument {
  id: string
  doc_type: string
  is_primary: boolean | null
  verification_id: string | null
}

/**
 * Documents for a portal's "Supporting documents" list. The account's ID
 * (the primary row, plus any duplicate linked to the same verification) is
 * shared by both portals and shown in the Government ID card, so it never
 * appears here. Everything else follows the portal: ownership documents in
 * the landlord wallet, tenant documents in the tenant wallet.
 */
export function selectSupportingDocuments<T extends PassportListDocument>(
  documents: readonly T[],
  portal: PassportPortalRole = 'tenant',
): T[] {
  return documents.filter(
    (doc) => !doc.is_primary && !doc.verification_id && isDocumentTypeForPortal(doc.doc_type, portal),
  )
}

interface PassportTypedDocument extends PassportListDocument {
  created_at: string
}

/**
 * The supporting document of this type the user already holds (newest first if
 * legacy duplicates exist), or null. Identity rows are never matched: each
 * supporting type is limited to one document, replaced in place.
 */
export function findSupportingDocumentOfType<T extends PassportTypedDocument>(
  documents: readonly T[],
  docType: string,
): T | null {
  return (
    [...documents]
      .filter((doc) => !doc.is_primary && !doc.verification_id && doc.doc_type === docType)
      .sort((a, b) => b.created_at.localeCompare(a.created_at))[0] ?? null
  )
}

/** Types the user has already added (supporting documents only). */
export function getAddedSupportingDocTypes(documents: readonly PassportListDocument[]): string[] {
  return [
    ...new Set(
      documents.filter((doc) => !doc.is_primary && !doc.verification_id).map((doc) => doc.doc_type),
    ),
  ]
}
