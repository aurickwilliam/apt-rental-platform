import { filterPaymentHistory } from './paymentHistory'

const rows = [
  { id: 'paid', status: 'paid' },
  { id: 'pending', status: 'pending' },
  { id: 'failed', status: 'failed' },
  { id: 'rejected', status: 'rejected' },
  { id: 'unpaid', status: 'unpaid' },
]

describe('filterPaymentHistory', () => {
  it('hides pending and failed attempts by default', () => {
    expect(filterPaymentHistory(rows, false).map((row) => row.id)).toEqual(['paid', 'rejected', 'unpaid'])
  })

  it('shows failed attempts when asked, but never pending ones', () => {
    expect(filterPaymentHistory(rows, true).map((row) => row.id)).toEqual(['paid', 'failed', 'rejected', 'unpaid'])
  })

  it('ignores the case of the stored status', () => {
    expect(filterPaymentHistory([{ status: 'FAILED' }, { status: 'Paid' }], false)).toEqual([{ status: 'Paid' }])
  })
})
