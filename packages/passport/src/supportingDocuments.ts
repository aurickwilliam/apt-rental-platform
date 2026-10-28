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
