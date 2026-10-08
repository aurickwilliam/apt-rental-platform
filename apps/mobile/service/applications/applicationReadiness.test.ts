import { evaluateApplicationReadiness } from './applicationReadiness'
import type { PassportDocumentRow } from '@/service/passport/passportService'

jest.mock('@repo/supabase', () => ({ supabase: {} }))
jest.mock('expo-file-system', () => ({ File: jest.fn() }))

const baseDoc = {
  user_id: 't',
  mime_type: null,
  id_type: null,
  verification_id: null,
  is_verified: false,
  is_primary: false,
  review_status: 'unverified',
  expires_at: null,
  created_at: '2026-10-01T00:00:00.000Z',
  storage_path_back: null,
} as unknown as PassportDocumentRow

const doc = (patch: Partial<PassportDocumentRow>): PassportDocumentRow => ({ ...baseDoc, ...patch })

const gov = doc({ id: 'g', doc_type: 'Passport', id_type: 'Passport', storage_path: 'g', is_primary: true, is_verified: true })
const billing = doc({ id: 'b', doc_type: 'Proof of Residency', storage_path: 'b' })
const income = doc({ id: 'i', doc_type: 'Payslip', storage_path: 'i' })

const ready = {
  accountStatus: 'verified',
  tenantId: 'tenant',
  landlordId: 'landlord',
  hasActiveApplication: false,
  passportDocs: [gov, billing],
}

const codes = (input: Parameters<typeof evaluateApplicationReadiness>[0]) =>
  evaluateApplicationReadiness(input).issues.map((issue) => issue.code)

it('is ready with a verified account and ID + billing in the passport', () => {
  const result = evaluateApplicationReadiness(ready)
  expect(result.isReady).toBe(true)
  expect(result.selection.docs.govId?.id).toBe('g')
})

it('flags unverified accounts, own listings and duplicate applications', () => {
  expect(codes({ ...ready, accountStatus: 'pending' })).toEqual(['unverified'])
  expect(codes({ ...ready, landlordId: 'tenant' })).toEqual(['own-listing'])
  expect(codes({ ...ready, hasActiveApplication: true })).toEqual(['already-applied'])
})

it('flags missing required documents', () => {
  expect(codes({ ...ready, passportDocs: [gov] })).toEqual(['passport-missing'])
})

it('only requires proof of income when the employment type needs it', () => {
  expect(codes({ ...ready, employmentType: 'Student' })).toEqual([])
  expect(codes({ ...ready, employmentType: 'Full-Time' })).toEqual(['passport-missing'])
  expect(codes({ ...ready, employmentType: 'Full-Time', passportDocs: [gov, billing, income] })).toEqual([])
})

it('never attaches expired or rejected documents', () => {
  const expired = doc({ ...billing, id: 'b2', expires_at: '2020-01-01' })
  const rejected = doc({ ...billing, id: 'b3', review_status: 'rejected' })

  const expiredResult = evaluateApplicationReadiness({ ...ready, passportDocs: [gov, expired] })
  expect(expiredResult.issues.map((i) => i.code)).toEqual(['passport-expired'])
  expect(expiredResult.selection.docs.proofOfBilling).toBeNull()

  expect(codes({ ...ready, passportDocs: [gov, rejected] })).toEqual(['passport-missing'])
})

it('prefers a current document over an expired one', () => {
  const expired = doc({ ...billing, id: 'old', expires_at: '2020-01-01', created_at: '2027-01-01T00:00:00.000Z' })
  const result = evaluateApplicationReadiness({ ...ready, passportDocs: [gov, expired, billing] })
  expect(result.selection.docs.proofOfBilling?.id).toBe('b')
  expect(result.isReady).toBe(true)
})

it('attaches optional NBI clearance when present', () => {
  const nbi = doc({ id: 'n', doc_type: 'NBI Clearance', storage_path: 'n' })
  expect(evaluateApplicationReadiness({ ...ready, passportDocs: [gov, billing, nbi] }).selection.docs.nbiClearance?.id).toBe('n')
})
