import {
  fetchLandlordPayments,
  fetchLandlordTenancy,
  updateLandlordPaymentStatus,
  type LandlordPaymentRecord,
} from './landlordService'

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
)

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
    select: jest.fn((columns?: string) =>
      columns === "id" ? Promise.resolve(resultObject) : chain
    ),
    eq: jest.fn(() => chain),
    in: jest.fn(() => chain),
    order: jest.fn(() => chain),
    limit: jest.fn(() => chain),
    update: jest.fn(() => chain),
    single: jest.fn(async () => resultObject),
    maybeSingle: jest.fn(async () => resultObject),
    then: (resolve: (value: unknown) => void) => resolve(resultObject),
  }
  return chain
}

const ROW = {
  id: 'payment-1',
  created_at: '2026-08-19T07:00:00+00:00',
  date: '2026-08-19',
  amount: 30000,
  status: 'pending',
  method: 'cash',
  reference_id: 'pay_cash1',
  period_start: '2026-08-01',
  period_end: '2026-08-31',
  due_date: '2026-08-05',
  tenant: { first_name: 'Case', last_name: 'Oh' },
}

describe('fetchLandlordTenancy', () => {
  it('includes pending payments in the dashboard preview', async () => {
    const tenancyChain = chainWith({
      data: {
        id: 'tenancy-1',
        lease_start: '2026-06-01',
        lease_end: null,
        tenant: {
          id: 'tenant-1',
          first_name: 'Case',
          last_name: 'Oh',
          mobile_number: '09171234567',
          email: null,
          avatar_url: null,
        },
      },
    })
    const maintenanceChain = chainWith({ data: null })
    const paymentChain = chainWith({
      data: [
        { id: 'payment-1', amount: 30000, date: '2026-08-19', status: 'pending' },
        { id: 'payment-2', amount: 30000, date: '2026-07-19', status: 'paid' },
      ],
    })
    mockFrom
      .mockReturnValueOnce(tenancyChain)
      .mockReturnValueOnce(maintenanceChain)
      .mockReturnValueOnce(paymentChain)

    const result = await fetchLandlordTenancy('apartment-1')

    expect(result.tenant?.fullName).toBe('Case Oh')
    expect(result.paymentHistory.map((p) => p.status)).toEqual(['pending', 'paid'])
  })
})

describe('fetchLandlordPayments', () => {
  it('fetches all payment rows for an apartment regardless of status', async () => {
    const chain = chainWith({
      data: [
        { ...ROW, status: 'pending' },
        { ...ROW, id: 'payment-2', status: 'paid', method: 'gcash', reference_id: 'pay_gcash1' },
        { ...ROW, id: 'payment-3', status: 'unpaid' },
      ],
    })
    mockFrom.mockReturnValue(chain)

    const result = await fetchLandlordPayments('apartment-1')

    expect(mockFrom).toHaveBeenCalledWith('payment')
    expect(chain.eq).toHaveBeenCalledWith('apartment_id', 'apartment-1')
    expect(result).toHaveLength(3)
    expect(result.map((p) => p.status)).toEqual(['pending', 'paid', 'unpaid'])
  })

  it('flattens tenant name into tenant_name', async () => {
    const chain = chainWith({ data: [ROW] })
    mockFrom.mockReturnValue(chain)

    const result: LandlordPaymentRecord[] = await fetchLandlordPayments('apartment-1')

    expect(result[0].tenant_name).toBe('Case Oh')
    expect(result[0].method).toBe('cash')
    expect(result[0].reference_id).toBe('pay_cash1')
  })

  it('throws on query error', async () => {
    const chain = chainWith({ error: new Error('RLS blocked') })
    mockFrom.mockReturnValue(chain)

    await expect(fetchLandlordPayments('apartment-1')).rejects.toThrow('RLS blocked')
  })
})

describe('updateLandlordPaymentStatus', () => {
  it('updates only pending cash rows to paid', async () => {
    const chain = chainWith({ data: [{ id: 'payment-1' }] })
    mockFrom.mockReturnValue(chain)

    const result = await updateLandlordPaymentStatus('payment-1')

    expect(chain.update).toHaveBeenCalledWith({ status: 'paid' })
    expect(chain.eq).toHaveBeenCalledWith('id', 'payment-1')
    expect(chain.eq).toHaveBeenCalledWith('method', 'cash')
    expect(chain.eq).toHaveBeenCalledWith('status', 'pending')
    expect(result).toEqual({ success: true })
  })

  it('returns an error when no row matched (not a pending cash row)', async () => {
    const chain = chainWith({ data: [] })
    mockFrom.mockReturnValue(chain)

    const result = await updateLandlordPaymentStatus('payment-1')

    expect(result.success).toBe(false)
    expect(result.error).toBe('Could not update payment status.')
  })

  it('returns the query error message on failure', async () => {
    const chain = chainWith({ error: new Error('RLS blocked') })
    mockFrom.mockReturnValue(chain)

    const result = await updateLandlordPaymentStatus('payment-1')

    expect(result.success).toBe(false)
    expect(result.error).toBe('RLS blocked')
  })
})