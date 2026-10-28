import { SECONDARY_IDS, VALID_IDS } from '../user/valid-ids'

export const DOCUMENT_TYPES = [
  'Proof of Income',
  'Proof of Residency',
  'Birth Certificate',
  'NBI Clearance',
  'Certificate of Employment',
  'Payslip',
  'Income Tax Return (ITR)',
]

/**
 * Passport types a landlord adds to prove they are a legitimate owner or
 * authorised lessor. Tenant types above stay tenant-only in the pickers.
 */
export const LANDLORD_DOCUMENT_TYPES = [
  'Tax Declaration',
  'Transfer Certificate of Title',
  'Real Property Tax Receipt',
  'Business Permit',
  'DTI / SEC Registration',
  'Authorization Letter (SPA)',
  'NBI Clearance',
]

/** An ownership document on a landlord's public profile: its type and whether an admin verified it. */
export interface LandlordOwnershipDocument {
  docType: string
  isVerified: boolean
}

/** Verified documents first, then the canonical landlord type order. */
export function sortLandlordOwnershipDocuments(
  documents: readonly LandlordOwnershipDocument[],
): LandlordOwnershipDocument[] {
  const rank = (docType: string) => {
    const index = LANDLORD_DOCUMENT_TYPES.indexOf(docType)
    return index === -1 ? LANDLORD_DOCUMENT_TYPES.length : index
  }
  return [...documents].sort(
    (a, b) => Number(b.isVerified) - Number(a.isVerified) || rank(a.docType) - rank(b.docType),
  )
}

/**
 * Whether a supporting document belongs in a portal's wallet. Ownership types
 * are landlord-only and everything else (including legacy types) stays in the
 * tenant wallet; types in both lists, like NBI Clearance, appear in both.
 */
export function isDocumentTypeForPortal(docType: string, portal: PassportPortalRole): boolean {
  if (portal === 'landlord') return LANDLORD_DOCUMENT_TYPES.includes(docType)
  return DOCUMENT_TYPES.includes(docType) || !LANDLORD_DOCUMENT_TYPES.includes(docType)
}

/** Every type a Passport upload accepts, whichever portal it comes from. */
export const PASSPORT_UPLOADABLE_DOC_TYPES: string[] = [
  ...new Set([...DOCUMENT_TYPES, ...LANDLORD_DOCUMENT_TYPES]),
]

export type PassportPortalRole = 'tenant' | 'landlord'

/** Document types a portal's picker offers. */
export function getDocumentTypesForPortal(portal: PassportPortalRole): string[] {
  return portal === 'landlord' ? LANDLORD_DOCUMENT_TYPES : DOCUMENT_TYPES
}

export type ApplicationDocumentSlot =
  | 'govId'
  | 'proofOfIncome'
  | 'proofOfBilling'
  | 'nbiClearance'

/**
 * Passport doc_types that can satisfy each rental-application document slot.
 * ID slots accept any government/secondary ID (see VALID_IDS / SECONDARY_IDS);
 * supporting slots match by explicit doc_type. Used by the apply flow to
 * pre-fill uploads from the user's passport.
 */

/** Doc types that are identity documents (any ID satisfies the govId slot). */
export const PASSPORT_GOV_ID_DOC_TYPES: string[] = [
  ...VALID_IDS,
  ...SECONDARY_IDS,
  'National ID',
]

export const PASSPORT_SLOT_DOC_TYPES: Record<ApplicationDocumentSlot, string[]> = {
  govId: PASSPORT_GOV_ID_DOC_TYPES,
  proofOfIncome: [
    'Proof of Income',
    'Payslip',
    'Income Tax Return (ITR)',
    'Certificate of Employment',
  ],
  proofOfBilling: ['Proof of Residency', 'Proof of Billing'],
  nbiClearance: ['NBI Clearance'],
}

/**
 * Passport doc_types eligible for tenant-requested admin review (v1).
 * Identity docs are verified via the account-verification flow instead;
 * billing/residency proof stays tenant-attested.
 */
export const PASSPORT_REVIEWABLE_DOC_TYPES: string[] = [
  ...PASSPORT_SLOT_DOC_TYPES.proofOfIncome,
  ...PASSPORT_SLOT_DOC_TYPES.nbiClearance,
  ...LANDLORD_DOCUMENT_TYPES,
]

export function isReviewEligibleDocType(docType: string): boolean {
  return PASSPORT_REVIEWABLE_DOC_TYPES.includes(docType)
}

export type PassportReviewStatus =
  | 'unverified'
  | 'pending'
  | 'verified'
  | 'rejected'
