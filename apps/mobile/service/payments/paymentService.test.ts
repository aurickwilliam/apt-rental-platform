import {
  createCashPayment,
  fetchPaymentByReferenceId,
  fetchPayments,
  formatReferenceId,
  methodLabel,
  paidAmountForPeriod,
  paymentStatusLabel,
  periodMonthLabel,
  type PaymentRecord,
} from './paymentService'

const mockFrom = jest.fn()

jest.mock('@repo/supabase', () => ({
  supabase: {
    from: (...args: unknown[]) => mockFrom(...args),
  },
}))

type QueryResult = { data?: unknown; error?: unknown }

function chainWith(result: QueryResult) {
  const resultObject = { data: result.data ?? null, error: result.error ?? null }
  const chain = {
    select: jest.fn(() => chain),
    eq: jest.fn(() => chain),
    order: jest.fn(() => chain),
    limit: jest.fn(async () => resultObject),
    insert: jest.fn(() => chain),
    maybeSingle: jest.fn(async () => resultObject),
    single: jest.fn(async () => resultObject),
  }
  return chain
}

const ROW = {
  id: 'payment-1',
  created_at: '2026-08-19T07:00:00+00:00',
  date: '2026-08-19',
  amount: 25000,
  status: 'paid',
  method: 'gcash',
  reference_id: 'pay_abc123',
  period_start: '2026-08-01',
  period_end: '2026-08-31',
  due_date: '2026-08-05',
  apartment: {
    name: 'Sunny Apartments',
    landlord: { first_name: 'John', last_name: 'Doe' },
  },
}

describe('formatReferenceId', () => {
  it('formats a pay_ reference into APT style', () => {
    expect(formatReferenceId('pay_abc123')).toBe('APT-ABC123')
  })

  it('handles references without the pay_ prefix', () => {
    expect(formatReferenceId('e2e-gcash')).toBe('APT-E2E-GCASH')
  })

  it('returns an em dash for missing references', () => {
    expect(formatReferenceId(null)).toBe('—')
  })
})

describe('paymentStatusLabel', () => {
  it('maps database statuses to display statuses', () => {
    expect(paymentStatusLabel('paid')).toBe('Paid')
    expect(paymentStatusLabel('pending')).toBe('Pending')
    expect(paymentStatusLabel('partial')).toBe('Partial')
    expect(paymentStatusLabel('unpaid')).toBe('Unpaid')
  })

  it('falls back to Unpaid for unknown statuses', () => {
    expect(paymentStatusLabel('weird')).toBe('Unpaid')
  })
})

describe('methodLabel', () => {
  it('maps method codes to display labels', () => {
    expect(methodLabel('gcash')).toBe('GCash')
    expect(methodLabel('maya')).toBe('Maya')
    expect(methodLabel('card')).toBe('Debit/Credit Card')
    expect(methodLabel('cash')).toBe('Cash')
  })

  it('falls back for unknown or missing methods', () => {
    expect(methodLabel(null)).toBe('—')
    expect(methodLabel('bank')).toBe('bank')
  })
})

describe('paidAmountForPeriod', () => {
  const payments: PaymentRecord[] = [
    { ...ROW, id: 'a', amount: 1000, status: 'paid', period_start: '2026-08-01' },
    { ...ROW, id: 'b', amount: 2000, status: 'paid', period_start: '2026-08-01' },
    { ...ROW, id: 'c', amount: 5000, status: 'pending', period_start: '2026-08-01' },
    { ...ROW, id: 'd', amount: 9000, status: 'paid', period_start: '2026-07-01' },
    { ...ROW, id: 'e', amount: null, status: 'paid', period_start: '2026-08-01' },
  ]

  it('sums only paid rows of the given period', () => {
    expect(paidAmountForPeriod(payments, '2026-08-01')).toBe(3000)
  })

  it('returns zero when nothing was paid', () => {
    expect(paidAmountForPeriod(payments, '2026-09-01')).toBe(0)
  })
})

describe('periodMonthLabel', () => {
  it('labels from the period start', () => {
    expect(periodMonthLabel('2026-09-01', '2026-01-15')).toBe('September')
  })

  it('falls back to the payment date', () => {
    expect(periodMonthLabel(null, '2026-03-10')).toBe('March')
  })

  it('returns an em dash for unparseable dates', () => {
    expect(periodMonthLabel('garbage', 'garbage')).toBe('—')
  })
})

describe('fetchPayments', () => {
  it('maps rows with embedded apartment and landlord names', async () => {
    mockFrom.mockReturnValue(chainWith({ data: [ROW] }))

    const result = await fetchPayments('tenancy-1')

    expect(result).toHaveLength(1)
    expect(result[0]).toMatchObject({
      id: 'payment-1',
      apartment_name: 'Sunny Apartments',
      landlord_name: 'John Doe',
    })
  })

  it('throws when the query fails', async () => {
    mockFrom.mockReturnValue(chainWith({ error: new Error('boom') }))

    await expect(fetchPayments('tenancy-1')).rejects.toThrow('boom')
  })
})

describe('fetchPaymentByReferenceId', () => {
  it('returns the mapped record for a matching reference', async () => {
    mockFrom.mockReturnValue(chainWith({ data: ROW }))

    const result = await fetchPaymentByReferenceId('pay_abc123')

    expect(result?.landlord_name).toBe('John Doe')
    expect(result?.reference_id).toBe('pay_abc123')
  })

  it('returns null when no row matches', async () => {
    mockFrom.mockReturnValue(chainWith({ data: null }))

    expect(await fetchPaymentByReferenceId('pay_nope')).toBeNull()
  })
})

describe('createCashPayment', () => {
  it('inserts a pending cash row and returns the record', async () => {
    const chain = chainWith({ data: { ...ROW, method: 'cash', status: 'pending' } })
    mockFrom.mockReturnValue(chain)

    const result = await createCashPayment({
      referenceId: 'pay_cash1',
      amount: 15000,
      date: '2026-08-20',
      tenantId: 'tenant-1',
      apartmentId: 'apartment-1',
      tenancyId: 'tenancy-1',
      periodStart: '2026-08-01',
      periodEnd: '2026-08-31',
      dueDate: '2026-08-05',
    })

    expect(chain.insert).toHaveBeenCalledWith({
      method: 'cash',
      status: 'pending',
      date: '2026-08-20',
      amount: 15000,
      reference_id: 'pay_cash1',
      tenant_id: 'tenant-1',
      apartment_id: 'apartment-1',
      tenancy_id: 'tenancy-1',
      period_start: '2026-08-01',
      period_end: '2026-08-31',
      due_date: '2026-08-05',
    })
    expect(result.status).toBe('pending')
    expect(result.method).toBe('cash')
  })
})
