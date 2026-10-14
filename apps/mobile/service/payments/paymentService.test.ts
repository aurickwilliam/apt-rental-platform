import {
  createCashPayment,
  fetchPaymentByReferenceId,
  fetchPayments,
  formatReferenceId,
  getCurrentRentStatus,
  methodLabel,
  paidAmountForPeriod,
  paymentStatusLabel,
  periodMonthLabel,
  type PaymentRecord,
  type RentStatusTenancy,
} from './paymentService'

const mockFrom = jest.fn()

jest.mock('@repo/supabase', () => ({
  supabase: {
    from: (...args: unknown[]) => mockFrom(...args),
  },
}))

type QueryResult = { data?: unknown; error?: unknown }

type SupabaseChain = {
  select: jest.Mock;
  eq: jest.Mock;
  order: jest.Mock;
  limit: jest.Mock;
  insert: jest.Mock;
  maybeSingle: jest.Mock;
  single: jest.Mock;
};

function chainWith(result: QueryResult): SupabaseChain {
  const resultObject = { data: result.data ?? null, error: result.error ?? null }
  const chain: SupabaseChain = {
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
  tenant: { first_name: 'Jane', last_name: 'Smith' },
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
    { ...(ROW as unknown as PaymentRecord), id: 'a', amount: 1000, status: 'paid', period_start: '2026-08-01', apartment_name: 'Sunny Apartments', landlord_name: 'John Doe', tenant_name: 'Jane Smith' },
    { ...(ROW as unknown as PaymentRecord), id: 'b', amount: 2000, status: 'paid', period_start: '2026-08-01', apartment_name: 'Sunny Apartments', landlord_name: 'John Doe', tenant_name: 'Jane Smith' },
    { ...(ROW as unknown as PaymentRecord), id: 'c', amount: 5000, status: 'pending', period_start: '2026-08-01', apartment_name: 'Sunny Apartments', landlord_name: 'John Doe', tenant_name: 'Jane Smith' },
    { ...(ROW as unknown as PaymentRecord), id: 'd', amount: 9000, status: 'paid', period_start: '2026-07-01', apartment_name: 'Sunny Apartments', landlord_name: 'John Doe', tenant_name: 'Jane Smith' },
    { ...(ROW as unknown as PaymentRecord), id: 'e', amount: null, status: 'paid', period_start: '2026-08-01', apartment_name: 'Sunny Apartments', landlord_name: 'John Doe', tenant_name: 'Jane Smith' },
  ]

  it('sums only paid rows of the given period', () => {
    expect(paidAmountForPeriod(payments, '2026-08-01')).toBe(3000)
  })

  it('returns zero when nothing was paid', () => {
    expect(paidAmountForPeriod(payments, '2026-09-01')).toBe(0)
  })
})

describe('periodMonthLabel', () => {
  it('labels the month and due day', () => {
    expect(periodMonthLabel('2026-09-01')).toBe('September 1')
  })

  it('returns an em dash for missing dates', () => {
    expect(periodMonthLabel(null)).toBe('—')
  })

  it('returns an em dash for unparseable dates', () => {
    expect(periodMonthLabel('garbage')).toBe('—')
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

describe('getCurrentRentStatus', () => {
  const paid = (amount: number, periodStart: string): PaymentRecord => ({
    ...(ROW as unknown as PaymentRecord),
    amount,
    status: 'paid',
    period_start: periodStart,
  })

  const tenancy = (overrides: Partial<RentStatusTenancy> = {}): RentStatusTenancy => ({
    lease_start: '2026-01-15',
    rent_due_day: 5,
    monthly_rent: 10000,
    apartment: { monthly_rent: 12000 },
    currentPayment: null,
    ...overrides,
  })

  beforeEach(() => {
    jest.useFakeTimers().setSystemTime(new Date('2026-10-14T09:00:00'))
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  it('bills the current month, due on the 5th, when there is no current payment', () => {
    expect(getCurrentRentStatus(tenancy(), [])).toEqual({
      monthlyRent: 10000,
      periodStart: '2026-10-01',
      periodEnd: '2026-10-31',
      dueDate: '2026-10-05',
      isFullyPaid: false,
      status: 'Pending',
    })
  })

  it("falls back to the apartment's rent when the tenancy has none", () => {
    expect(getCurrentRentStatus(tenancy({ monthly_rent: null }), []).monthlyRent).toBe(12000)
  })

  it('is paid once paid payments for the period cover the rent', () => {
    const status = getCurrentRentStatus(tenancy(), [paid(4000, '2026-10-01'), paid(6000, '2026-10-01')])

    expect(status.isFullyPaid).toBe(true)
    expect(status.status).toBe('Paid')
  })

  it('ignores payments for other periods and partial amounts', () => {
    const status = getCurrentRentStatus(tenancy(), [paid(10000, '2026-09-01'), paid(5000, '2026-10-01')])

    expect(status.isFullyPaid).toBe(false)
    expect(status.status).toBe('Pending')
  })

  it("shows Paid from the tenancy's current payment before the payment list catches up", () => {
    const status = getCurrentRentStatus(
      tenancy({
        currentPayment: {
          status: 'paid',
          period_start: '2026-10-01',
          period_end: '2026-10-31',
          due_date: '2026-10-05',
        },
      }),
      []
    )

    expect(status.isFullyPaid).toBe(false)
    expect(status.status).toBe('Paid')
  })

  it("bills the lease's first month when the lease starts later, due on its due day", () => {
    const status = getCurrentRentStatus(tenancy({ lease_start: '2026-11-03' }), [])

    expect(status.periodStart).toBe('2026-11-01')
    expect(status.dueDate).toBe('2026-11-05')
  })

  it('skips a month whose due date falls before move-in, like the server reminders', () => {
    const status = getCurrentRentStatus(tenancy({ lease_start: '2026-11-08' }), [])

    expect(status.periodStart).toBe('2026-12-01')
    expect(status.periodEnd).toBe('2026-12-31')
    expect(status.dueDate).toBe('2026-12-05')
  })

  it('skips the current month when the lease began after its due date', () => {
    expect(getCurrentRentStatus(tenancy({ lease_start: '2026-10-08' }), []).periodStart).toBe('2026-11-01')
  })

  it("uses the tenancy's due day, clamped to the end of the month", () => {
    jest.setSystemTime(new Date('2026-11-10T09:00:00'))

    expect(getCurrentRentStatus(tenancy({ rent_due_day: 31 }), []).dueDate).toBe('2026-11-30')
  })

  it('rolls a December move-in past its due date into January', () => {
    expect(getCurrentRentStatus(tenancy({ lease_start: '2026-12-20' }), []).periodStart).toBe('2027-01-01')
  })

  it('never counts rent as paid when the rent is zero', () => {
    expect(getCurrentRentStatus(tenancy({ monthly_rent: 0, apartment: { monthly_rent: 0 } }), []).isFullyPaid).toBe(false)
  })
})
