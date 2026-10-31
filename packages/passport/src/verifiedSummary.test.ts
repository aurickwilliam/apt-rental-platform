import { getVerifiedPassportSlots } from './verifiedSummary'
import type { PassportSlotDocument } from './selection'

const baseDoc: PassportSlotDocument = {
  doc_type: '',
  id_type: null,
  is_primary: false,
  is_verified: false,
  review_status: 'unverified',
  expires_at: null,
  created_at: '2026-10-01T00:00:00.000Z',
}

const today = new Date('2026-10-27T00:00:00+08:00')

describe('getVerifiedPassportSlots', () => {
  it('lists only slots with a verified, unexpired document, in slot order', () => {
    const slots = getVerifiedPassportSlots(
      [
        { ...baseDoc, doc_type: 'Proof of Income', is_verified: true },
        { ...baseDoc, doc_type: 'Government ID', id_type: 'Passport', is_verified: true },
        { ...baseDoc, doc_type: 'NBI Clearance' },
      ],
      today
    )
    expect(slots.map((entry) => entry.slot)).toEqual(['govId', 'proofOfIncome'])
    expect(slots[0].label).toBe('Government ID')
  })

  it('never counts an expired verified document', () => {
    const slots = getVerifiedPassportSlots(
      [{ ...baseDoc, doc_type: 'Proof of Income', is_verified: true, expires_at: '2026-01-01' }],
      today
    )
    expect(slots).toEqual([])
  })

  it('returns nothing when no documents are visible', () => {
    expect(getVerifiedPassportSlots([], today)).toEqual([])
  })
})
