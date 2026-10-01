import { SECONDARY_IDS, VALID_IDS } from '../user/valid-ids'

export const DOCUMENT_TYPES = [
  'Proof of Income',
  'Proof of Residency',
  'Birth Certificate',
  'National ID',
  'NBI Clearance',
  'Certificate of Employment',
  'Business Permit',
  'Payslip',
  'Income Tax Return (ITR)',
]

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