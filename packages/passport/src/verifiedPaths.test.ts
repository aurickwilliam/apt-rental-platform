import { verifiedPassportPaths } from './verifiedPaths'

const today = new Date(2026, 9, 3)

it('badges both sides of a verified ID and ignores unrequested paths', () => {
  const rows = [{ storage_path: 'front', storage_path_back: 'back', expires_at: null }]
  expect([...verifiedPassportPaths(rows, ['front', 'back', 'other'], today)].sort()).toEqual(['back', 'front'])
  expect(verifiedPassportPaths(rows, ['other'], today).size).toBe(0)
})

it('never counts an expired verified document', () => {
  const rows = [
    { storage_path: 'payslip-old', storage_path_back: null, expires_at: '2026-10-02' },
    { storage_path: 'payslip-today', storage_path_back: null, expires_at: '2026-10-03' },
  ]
  expect([...verifiedPassportPaths(rows, ['payslip-old', 'payslip-today'], today)]).toEqual(['payslip-today'])
})
