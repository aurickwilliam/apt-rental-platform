import { getPassportDocumentStatus } from './status'

const today = new Date(2026, 9, 3)
const base = { is_verified: false, review_status: 'unverified', expires_at: null }

it('reads Verified for a current verified document', () => {
  expect(getPassportDocumentStatus({ ...base, is_verified: true, review_status: 'verified' }, today)).toBe('verified')
  expect(getPassportDocumentStatus({ ...base, is_verified: true, expires_at: '2026-10-03' }, today)).toBe('verified')
})

it('reads Expired, never Verified, once a verified document is past its expiry', () => {
  expect(getPassportDocumentStatus({ ...base, is_verified: true, expires_at: '2026-10-02' }, today)).toBe('expired')
})

it('maps review states for documents that are not verified', () => {
  expect(getPassportDocumentStatus({ ...base, review_status: 'pending' }, today)).toBe('pending')
  expect(getPassportDocumentStatus({ ...base, review_status: 'rejected' }, today)).toBe('rejected')
  expect(getPassportDocumentStatus(base, today)).toBe('unverified')
  expect(getPassportDocumentStatus({ ...base, expires_at: '2020-01-01' }, today)).toBe('unverified')
})
