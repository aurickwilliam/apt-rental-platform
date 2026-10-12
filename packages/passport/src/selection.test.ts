import { getPassportSlotStates, passportDocsForSlot, type PassportSlotDocument } from './selection'

interface TestDoc extends PassportSlotDocument {
  id: string
}

const baseDoc: TestDoc = {
  id: 'doc-pay',
  doc_type: 'Payslip',
  id_type: null,
  is_verified: false,
  is_primary: false,
  review_status: 'unverified',
  expires_at: null,
  created_at: '2026-09-01T00:00:00.000Z',
}

describe('passportDocsForSlot', () => {
  const verifiedId: TestDoc = {
    ...baseDoc,
    id: 'doc-id',
    doc_type: 'Passport',
    id_type: 'Passport',
    is_verified: true,
    is_primary: true,
  }
  const otherVerifiedId: TestDoc = {
    ...baseDoc,
    id: 'doc-id-2',
    doc_type: 'National ID',
    id_type: 'National ID (PhilSys/PhilID)',
    is_verified: true,
    created_at: '2026-09-02T00:00:00.000Z',
  }
  const payslip: TestDoc = baseDoc
  const birth: TestDoc = { ...baseDoc, id: 'doc-birth', doc_type: 'Birth Certificate' }

  it('matches any ID doc to the govId slot with the primary ID first', () => {
    const matches = passportDocsForSlot([otherVerifiedId, payslip, birth, verifiedId], 'govId')
    expect(matches.map((d) => d.id)).toEqual(['doc-id', 'doc-id-2'])
  })

  it('matches income-adjacent types to the proofOfIncome slot', () => {
    const matches = passportDocsForSlot([birth, payslip, verifiedId], 'proofOfIncome')
    expect(matches.map((d) => d.id)).toEqual(['doc-pay'])
  })

  it('matches nothing outside the slot taxonomy', () => {
    expect(passportDocsForSlot([birth], 'nbiClearance')).toEqual([])
  })
})

describe('getPassportSlotStates', () => {
  const billing: TestDoc = { ...baseDoc, id: 'bill', doc_type: 'Proof of Residency' }

  it('reports ready, expired and missing slots regardless of requirements', () => {
    const states = getPassportSlotStates([
      baseDoc,
      { ...billing, expires_at: '2020-01-01' },
    ])
    expect(states.proofOfIncome).toEqual({ doc: baseDoc, state: 'ready' })
    expect(states.proofOfBilling.state).toBe('expired')
    expect(states.proofOfBilling.doc).toBeNull()
    expect(states.nbiClearance).toEqual({ doc: null, state: 'missing' })
  })

  it('never counts rejected documents', () => {
    const states = getPassportSlotStates([{ ...billing, review_status: 'rejected' }])
    expect(states.proofOfBilling.state).toBe('missing')
  })
})
