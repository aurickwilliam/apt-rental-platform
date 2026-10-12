import { isExpiredDate } from './expiry'
import type { PassportSlotDocument } from './selection'

export type PassportDocumentStatus =
  | 'verified'
  | 'expired'
  | 'pending'
  | 'rejected'
  | 'unverified'

export const PASSPORT_DOCUMENT_STATUS_LABELS: Record<PassportDocumentStatus, string> = {
  verified: 'Verified',
  expired: 'Expired',
  pending: 'Under review',
  rejected: 'Rejected',
  unverified: 'Unverified',
}

/**
 * The single status shown for a passport document. A verified document past
 * its expiry date reads Expired, never Verified.
 */
export function getPassportDocumentStatus(
  doc: Pick<PassportSlotDocument, 'is_verified' | 'review_status' | 'expires_at'>,
  today = new Date()
): PassportDocumentStatus {
  if (doc.is_verified) {
    return isExpiredDate(doc.expires_at, today) ? 'expired' : 'verified'
  }
  if (doc.review_status === 'pending') return 'pending'
  if (doc.review_status === 'rejected') return 'rejected'
  return 'unverified'
}
