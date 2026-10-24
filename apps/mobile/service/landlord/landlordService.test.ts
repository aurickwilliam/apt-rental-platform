import {
  fetchLandlordApplications,
  fetchLandlordPayments,
  fetchAllLandlordPayments,
  ALL_LANDLORD_PAYMENTS_LIMIT,
  fetchLandlordTenancy,
  fetchLandlordMaintenanceRequests,
  updateLandlordMaintenanceStatus,
  waiveMaintenanceFee,
  updateLandlordPaymentStatus,
  type LandlordPaymentRecord,
} from './landlordService'

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
)

const mockFrom = jest.fn()
const mockRpc = jest.fn()

jest.mock('@/service/media/privateMediaResolver', () => ({
  resolvePrivateMediaUrls: jest.fn(async () => ({ urls: {}, error: null })),
}))

jest.mock('@repo/supabase', () => ({
  supabase: {
    from: (...args: unknown[]) => mockFrom(...args),
    rpc: (...args: unknown[]) => mockRpc(...args),
  },
}))

type QueryResult = { data?: unknown; error?: unknown }

type SupabaseChain = {
  select: jest.Mock;
  eq: jest.Mock;
  in: jest.Mock;
  is: jest.Mock;
  order: jest.Mock;
  limit: jest.Mock;
  update: jest.Mock;
  single: jest.Mock;
  maybeSingle: jest.Mock;
  then: (resolve: (value: unknown) => void) => void;
};

function chainWith(result: QueryResult): SupabaseChain {
  const resultObject = { data: result.data ?? null, error: result.error ?? null }
  const chain: SupabaseChain = {
    select: jest.fn((columns?: string) =>
      columns === "id" ? Promise.resolve(resultObject) : chain
    ),
    eq: jest.fn(() => chain),
    in: jest.fn(() => chain),
    is: jest.fn(() => chain),
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

describe('fetchLandlordApplications', () => {
  const baseRow = {
    id: 'app-1',
    status: 'approved',
    created_at: '2026-09-21T12:51:26.728404+00:00',
    rejected_reason: null,
    apartment_id: 'apt-1',
    tenant_id: 'tenant-1',
    occupation: '',
    employer_name: '',
    monthly_income: 0,
    employment_type: 'Student',
    prev_landlord_name: null,
    prev_landlord_contact: null,
    move_in_date: '2026-09-23',
    no_occupants: 1,
    has_pets: false,
    has_smoker: false,
    need_parking: false,
    message: 'hello',
    gov_id_url: 'tenant/app/govId.jpg',
    proof_of_income_url: null,
    proof_of_billing_url: 'tenant/app/billing.jpg',
    nbi_clearance_url: null,
    users: {
      first_name: 'Watermalown',
      last_name: 'Zero',
      avatar_url: null,
      street_address: null,
      barangay: null,
      city: null,
      province: null,
      postal_code: null,
      email: 'watermalownzero@gmail.com',
      mobile_number: null,
    },
  }

  const apartmentRow = {
    name: 'Kaunlaran Affordable Studio',
    monthly_rent: 9000,
    city: 'Caloocan',
    street_address: '67 Rizal Avenue Extension',
    barangay: 'Kaunlaran',
    province: 'Metro Manila',
    zip_code: 1410,
    status: 'occupied',
  }

  it('maps numeric monthly_rent and numeric zip_code (regression: ₱0 bug)', async () => {
    mockFrom.mockReset()
    mockFrom.mockReturnValue(chainWith({ data: [{ ...baseRow, apartments: apartmentRow }] }))

    const result = await fetchLandlordApplications('landlord-1')

    expect(result).toHaveLength(1)
    expect(result[0].monthly_rent).toBe(9000)
    expect(result[0].apartment_address).toContain('1410')
  })

  it('maps string monthly_rent from PostgREST numeric columns', async () => {
    mockFrom.mockReset()
    mockFrom.mockReturnValue(
      chainWith({ data: [{ ...baseRow, apartments: { ...apartmentRow, monthly_rent: '9000' } }] }),
    )

    const result = await fetchLandlordApplications('landlord-1')

    expect(result[0].monthly_rent).toBe(9000)
  })
})

describe('maintenance fees', () => {
  beforeEach(() => { jest.clearAllMocks() })

  it.each(['pending', 'paid', 'waived'])('loads fee amount and preserves %s status', async (feeStatus) => {
    const chain = chainWith({ data: [{
      id: 'request-1', title: 'Leak', status: 'resolved', urgency: 'low', image_urls: [],
      apartment_id: 'apartment-1', tenant_id: 'tenant-1', tenancy_id: 'tenancy-1',
      fee_amount: 1250, fee_status: feeStatus,
    }] })
    mockFrom.mockReturnValue(chain)
    const rows = await fetchLandlordMaintenanceRequests('landlord-1')
    expect(rows[0]).toMatchObject({ fee_amount: 1250, fee_status: feeStatus, tenant_id: 'tenant-1', tenancy_id: 'tenancy-1' })
    expect(chain.select).toHaveBeenCalledWith(expect.stringContaining('fee_amount, fee_status'))
    expect(chain.limit).toHaveBeenCalledWith(200)
  })

  it('resolves and adds a fee in one owner-scoped write', async () => {
    const chain = chainWith({ data: [{ id: 'request-1' }] })
    mockFrom.mockReturnValue(chain)
    expect(await updateLandlordMaintenanceStatus('request-1', 'landlord-1', 'Resolved', ' Repaired pipe ', 1250)).toEqual({ success: true })
    expect(chain.update).toHaveBeenCalledWith(expect.objectContaining({ status: 'resolved', resolution_notes: 'Repaired pipe', fee_amount: 1250, fee_status: 'pending' }))
    expect(chain.eq).toHaveBeenCalledWith('landlord_id', 'landlord-1')
    expect(chain.eq).toHaveBeenCalledWith('status', 'in_progress')
  })

  it('does not invent or clear a fee when resolving without one', async () => {
    const chain = chainWith({ data: [{ id: 'request-1' }] })
    mockFrom.mockReturnValue(chain)
    await updateLandlordMaintenanceStatus('request-1', 'landlord-1', 'Resolved', 'Repaired pipe')
    expect(chain.update.mock.calls[0][0]).not.toHaveProperty('fee_amount')
    expect(chain.update.mock.calls[0][0]).not.toHaveProperty('fee_status')
  })

  it.each([0, -1, NaN, Infinity])('rejects invalid fee %s before writing', async (amount) => {
    expect((await updateLandlordMaintenanceStatus('request-1', 'landlord-1', 'Resolved', 'Fixed', amount)).success).toBe(false)
    expect(mockFrom).not.toHaveBeenCalled()
  })

  it('requires notes and only adds fees when resolving', async () => {
    expect((await updateLandlordMaintenanceStatus('request-1', 'landlord-1', 'Resolved', ' ')).success).toBe(false)
    expect((await updateLandlordMaintenanceStatus('request-1', 'landlord-1', 'In Progress', undefined, 500)).success).toBe(false)
    expect(mockFrom).not.toHaveBeenCalled()
  })

  it('treats zero affected rows as failure', async () => {
    mockFrom.mockReturnValue(chainWith({ data: [] }))
    expect((await updateLandlordMaintenanceStatus('request-1', 'landlord-1', 'Resolved', 'Fixed', 500)).success).toBe(false)
  })

  it('waives only through the caller-bound RPC', async () => {
    mockRpc.mockResolvedValue({ error: null })
    expect(await waiveMaintenanceFee('request-1')).toEqual({ success: true })
    expect(mockRpc).toHaveBeenCalledWith('waive_maintenance_fee', { p_request_id: 'request-1' })
    expect(mockFrom).not.toHaveBeenCalled()
  })

  it('preserves the reservation refusal from the database', async () => {
    mockRpc.mockResolvedValue({ error: { message: 'This fee is reserved by a pending payment.' } })
    expect(await waiveMaintenanceFee('request-1')).toEqual({ success: false, error: 'This fee is reserved by a pending payment.' })
  })
})

describe('fetchAllLandlordPayments', () => {
  beforeEach(() => { mockFrom.mockReset() })

  const unit = (id: string, name: string) => ({ id, name })

  it("reads the landlord's own units first, then every payment for exactly those units", async () => {
    const unitsChain = chainWith({ data: [unit('unit-a', 'Unit A'), unit('unit-b', 'Unit B')] })
    const paymentsChain = chainWith({
      data: [
        { ...ROW, id: 'p1', apartment_id: 'unit-a', apartment: { name: 'Unit A' } },
        { ...ROW, id: 'p2', apartment_id: 'unit-b', apartment: null, tenant: null, status: 'paid' },
      ],
    })
    mockFrom.mockReturnValueOnce(unitsChain).mockReturnValueOnce(paymentsChain)

    const result = await fetchAllLandlordPayments('landlord-1')

    expect(mockFrom).toHaveBeenNthCalledWith(1, 'apartments')
    expect(unitsChain.eq).toHaveBeenCalledWith('landlord_id', 'landlord-1')
    expect(unitsChain.is).toHaveBeenCalledWith('deleted_at', null)
    expect(mockFrom).toHaveBeenNthCalledWith(2, 'payment')
    expect(paymentsChain.in).toHaveBeenCalledWith('apartment_id', ['unit-a', 'unit-b'])
    expect(paymentsChain.limit).toHaveBeenCalledWith(ALL_LANDLORD_PAYMENTS_LIMIT)
    expect(result.units).toEqual([unit('unit-a', 'Unit A'), unit('unit-b', 'Unit B')])
    expect(result.payments.map((p) => [p.id, p.apartment_id, p.apartment_name, p.tenant_name])).toEqual([
      ['p1', 'unit-a', 'Unit A', 'Case Oh'],
      ['p2', 'unit-b', null, null],
    ])
  })

  it('never queries payments for a landlord without units', async () => {
    mockFrom.mockReturnValueOnce(chainWith({ data: [] }))

    const result = await fetchAllLandlordPayments('landlord-1')

    expect(result).toEqual({ units: [], payments: [] })
    expect(mockFrom).toHaveBeenCalledTimes(1)
  })

  it('surfaces a units or payments error instead of an empty list', async () => {
    mockFrom.mockReturnValueOnce(chainWith({ error: new Error('units down') }))
    await expect(fetchAllLandlordPayments('landlord-1')).rejects.toThrow('units down')

    mockFrom
      .mockReturnValueOnce(chainWith({ data: [unit('unit-a', 'Unit A')] }))
      .mockReturnValueOnce(chainWith({ error: new Error('payments down') }))
    await expect(fetchAllLandlordPayments('landlord-1')).rejects.toThrow('payments down')
  })
})
