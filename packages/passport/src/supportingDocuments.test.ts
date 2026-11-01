import {
  findSupportingDocumentOfType,
  getAddedSupportingDocTypes,
  selectSupportingDocuments,
} from './supportingDocuments'

const doc = (id: string, doc_type: string, is_primary = false, verification_id: string | null = null, created_at = '2026-09-01') => ({
  id,
  doc_type,
  is_primary,
  verification_id,
  created_at,
})

describe('selectSupportingDocuments', () => {
  const rows = [
    doc('id1', "Driver's License", true, 'v1'),
    doc('id2', "Driver's License", true, 'v1'),
    doc('pay', 'Payslip'),
    doc('tax', 'Tax Declaration'),
    doc('nbi', 'NBI Clearance'),
    doc('legacy', 'Proof of Billing'),
  ]

  it('never lists the account ID or its duplicate, in either portal', () => {
    expect(selectSupportingDocuments(rows, 'tenant').map((r) => r.id)).not.toContain('id1')
    expect(selectSupportingDocuments(rows, 'tenant').map((r) => r.id)).not.toContain('id2')
    expect(selectSupportingDocuments(rows, 'landlord').map((r) => r.id)).not.toContain('id1')
  })

  it('shows tenant documents, NBI and legacy types in the tenant wallet', () => {
    expect(selectSupportingDocuments(rows, 'tenant').map((r) => r.id)).toEqual(['pay', 'nbi', 'legacy'])
  })

  it('shows only ownership documents and NBI in the landlord wallet', () => {
    expect(selectSupportingDocuments(rows, 'landlord').map((r) => r.id)).toEqual(['tax', 'nbi'])
  })

  it('defaults to the tenant wallet', () => {
    expect(selectSupportingDocuments(rows).map((r) => r.id)).toEqual(['pay', 'nbi', 'legacy'])
  })
})

describe('one supporting document per type', () => {
  const rows = [
    doc('id1', "Driver's License", true, 'v1'),
    doc('old', 'Payslip', false, null, '2026-08-01'),
    doc('new', 'Payslip', false, null, '2026-09-15'),
  ]

  it('finds the newest document of a type and ignores identity rows', () => {
    expect(findSupportingDocumentOfType(rows, 'Payslip')?.id).toBe('new')
    expect(findSupportingDocumentOfType(rows, "Driver's License")).toBeNull()
    expect(findSupportingDocumentOfType(rows, 'Business Permit')).toBeNull()
  })

  it('lists the added types once, without the identity document', () => {
    expect(getAddedSupportingDocTypes(rows)).toEqual(['Payslip'])
  })
})
