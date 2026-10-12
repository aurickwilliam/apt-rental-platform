import {
  PASSPORT_SLOT_DOC_TYPES,
  requiresProofOfIncome,
  type ApplicationDocumentSlot,
} from '@repo/constants'

import { isExpiredDate } from './expiry'

/**
 * The `passport_documents` fields the pure helpers read. Structural so the
 * package stays free of either app's Supabase client and generated types;
 * callers pass their full row type and get it back.
 */
export interface PassportSlotDocument {
  doc_type: string
  id_type: string | null
  is_primary: boolean
  is_verified: boolean
  review_status: string
  expires_at: string | null
  created_at: string
}

/**
 * Returns passport docs that can satisfy an application slot — primary ID,
 * then verified, then newest. Gov IDs also match rows carrying an id_type
 * (verification-linked IDs whose doc_type is the raw ID name).
 */
export function passportDocsForSlot<T extends PassportSlotDocument>(
  docs: readonly T[],
  slot: ApplicationDocumentSlot
): T[] {
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

export const APPLICATION_DOCUMENT_SLOTS: readonly ApplicationDocumentSlot[] = [
  'govId',
  'proofOfIncome',
  'proofOfBilling',
  'nbiClearance',
]

export interface PassportSlotState<T extends PassportSlotDocument = PassportSlotDocument> {
  /** Best usable document for the slot, or null. */
  doc: T | null
  /** `expired` when every non-rejected match is past its expiry date. */
  state: 'ready' | 'expired' | 'missing'
}

/**
 * Per-slot availability, independent of which slots an application needs.
 * Rejected documents never count; expired ones only mark the slot expired.
 */
export function getPassportSlotStates<T extends PassportSlotDocument>(
  docs: readonly T[]
): Record<ApplicationDocumentSlot, PassportSlotState<T>> {
  const states = {} as Record<ApplicationDocumentSlot, PassportSlotState<T>>
  for (const slot of APPLICATION_DOCUMENT_SLOTS) {
    const candidates = passportDocsForSlot(docs, slot).filter(
      (doc) => doc.review_status !== 'rejected'
    )
    const usable = candidates.find((doc) => !isExpiredDate(doc.expires_at)) ?? null
    states[slot] = {
      doc: usable,
      state: usable ? 'ready' : candidates.length > 0 ? 'expired' : 'missing',
    }
  }
  return states
}

export interface PassportApplicationSelection<T extends PassportSlotDocument = PassportSlotDocument> {
  /** Best usable passport document per application slot (null when none). */
  docs: Record<ApplicationDocumentSlot, T | null>
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
export function selectPassportDocsForApplication<T extends PassportSlotDocument>(
  docs: readonly T[],
  employmentType: string | null = null
): PassportApplicationSelection<T> {
  const required: ApplicationDocumentSlot[] = ['govId', 'proofOfBilling']
  if (employmentType && requiresProofOfIncome(employmentType)) {
    required.push('proofOfIncome')
  }

  const selection: PassportApplicationSelection<T> = {
    docs: { govId: null, proofOfIncome: null, proofOfBilling: null, nbiClearance: null },
    missing: [],
    expired: [],
  }

  const states = getPassportSlotStates(docs)
  for (const slot of APPLICATION_DOCUMENT_SLOTS) {
    const { doc, state } = states[slot]
    selection.docs[slot] = doc

    if (state === 'ready' || !required.includes(slot)) continue
    if (state === 'expired') selection.expired.push(slot)
    else selection.missing.push(slot)
  }

  return selection
}
