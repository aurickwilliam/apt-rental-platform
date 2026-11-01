import type { ApplicationDocumentSlot } from '@repo/constants'

import { APPLICATION_SLOT_LABELS } from './readiness'
import { APPLICATION_DOCUMENT_SLOTS, passportDocsForSlot, type PassportSlotDocument } from './selection'
import { getPassportDocumentStatus } from './status'

export interface VerifiedPassportSlot {
  slot: ApplicationDocumentSlot
  label: string
}

/**
 * The application slots a person has at least one verified, unexpired passport
 * document for, in the standard slot order. Only positive evidence counts: a
 * viewer who cannot read someone's documents gets an empty list, which means
 * "nothing to show", never "not verified".
 */
export function getVerifiedPassportSlots(
  docs: readonly PassportSlotDocument[],
  today = new Date()
): VerifiedPassportSlot[] {
  return APPLICATION_DOCUMENT_SLOTS.filter((slot) =>
    passportDocsForSlot(docs, slot).some((doc) => getPassportDocumentStatus(doc, today) === 'verified')
  ).map((slot) => ({ slot, label: APPLICATION_SLOT_LABELS[slot] }))
}
