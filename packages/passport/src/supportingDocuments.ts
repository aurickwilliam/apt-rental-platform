interface IdentityDocumentFields {
  id: string
  is_primary: boolean | null
  verification_id: string | null
}

/**
 * Documents for the "Supporting documents" list: everything except identity
 * records. The Government ID card owns the primary ID, and any other row
 * linked to an account verification (a duplicate link) is that same ID, so it
 * never belongs in the supporting list.
 */
export function selectSupportingDocuments<T extends IdentityDocumentFields>(documents: readonly T[]): T[] {
  return documents.filter((doc) => !doc.is_primary && !doc.verification_id)
}
