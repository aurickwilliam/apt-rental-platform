import { selectSupportingDocuments } from './supportingDocuments'

const doc = (id: string, is_primary: boolean, verification_id: string | null) => ({ id, is_primary, verification_id })

describe('selectSupportingDocuments', () => {
  it('drops the primary ID and a duplicate row linked to the same verification', () => {
    const rows = [doc('a', true, 'v1'), doc('b', true, 'v1'), doc('c', false, null)]
    expect(selectSupportingDocuments(rows).map((row) => row.id)).toEqual(['c'])
  })

  it('keeps ordinary uploads', () => {
    const rows = [doc('a', false, null), doc('b', false, null)]
    expect(selectSupportingDocuments(rows)).toHaveLength(2)
  })
})
