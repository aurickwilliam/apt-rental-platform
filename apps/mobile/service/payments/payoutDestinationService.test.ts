import {
  createPayoutDestination,
  deletePayoutDestination,
  fetchPayoutDestinations,
  setDefaultPayoutDestination,
  updatePayoutDestination,
} from './payoutDestinationService'

const mockFrom = jest.fn()

jest.mock('@repo/supabase', () => ({
  supabase: {
    from: (...args: unknown[]) => mockFrom(...args),
  },
}))

type QueryResult = { data?: unknown; error?: unknown }

// Every link is chainable AND thenable so `await ...eq(...)` resolves with the
// result object, mirroring supabase-js builder behavior.
function chainWith(result: QueryResult) {
  const resultObject = { data: result.data ?? null, error: result.error ?? null }
  const chain = {
    select: jest.fn(() => chain),
    order: jest.fn(() => chain),
    eq: jest.fn(() => chain),
    insert: jest.fn(() => chain),
    update: jest.fn(() => chain),
    delete: jest.fn(() => chain),
    single: jest.fn(async () => resultObject),
    maybeSingle: jest.fn(async () => resultObject),
    limit: jest.fn(async () => resultObject),
    then: (resolve: (value: typeof resultObject) => unknown) =>
      Promise.resolve(resultObject).then(resolve),
  }
  return chain
}

const ROW = {
  id: 'dest-1',
  type: 'gcash',
  bic: 'GXCHPHM2XXX',
  account_number: '09171234567',
  account_name: 'Juan Dela Cruz',
  is_default: true,
  status: 'active',
  created_at: '2026-08-21T00:00:00+00:00',
}

beforeEach(() => {
  mockFrom.mockReset()
})

describe('fetchPayoutDestinations', () => {
  it('returns the rows from the destination table', async () => {
    const chain = chainWith({ data: [ROW] })
    mockFrom.mockReturnValue(chain)

    const result = await fetchPayoutDestinations()

    expect(mockFrom).toHaveBeenCalledWith('payout_destination')
    expect(result).toHaveLength(1)
    expect(result[0]).toMatchObject({ id: 'dest-1', is_default: true })
    expect(chain.order).toHaveBeenCalledTimes(2)
  })

  it('returns an empty list when no rows exist', async () => {
    mockFrom.mockReturnValue(chainWith({ data: null }))

    await expect(fetchPayoutDestinations()).resolves.toEqual([])
  })

  it('throws on query errors', async () => {
    mockFrom.mockReturnValue(chainWith({ error: { message: 'rls denied' } }))

    await expect(fetchPayoutDestinations()).rejects.toMatchObject({ message: 'rls denied' })
  })
})

describe('createPayoutDestination', () => {
  it('inserts without default and derives the BIC from type', async () => {
    const chain = chainWith({ data: { ...ROW, is_default: false } })
    mockFrom.mockReturnValue(chain)

    const result = await createPayoutDestination('user-1', {
      type: 'gcash',
      accountNumber: '09171234567',
      accountName: '  Juan Dela Cruz  ',
      isDefault: false,
    })

    expect(chain.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        user_id: 'user-1',
        type: 'gcash',
        bic: 'GXCHPHM2XXX',
        account_number: '09171234567',
        account_name: 'Juan Dela Cruz',
        is_default: false,
      })
    )
    expect(chain.update).not.toHaveBeenCalled()
    expect(result.is_default).toBe(false)
  })

  it('derives the Maya BIC when maya is selected', async () => {
    const chain = chainWith({ data: { ...ROW, is_default: false } })
    mockFrom.mockReturnValue(chain)

    await createPayoutDestination('user-1', {
      type: 'maya',
      accountNumber: '09181234567',
      accountName: 'Juan Dela Cruz',
      isDefault: false,
    })

    expect(chain.insert).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'maya', bic: 'PAPHPHM1XXX' })
    )
  })

  it('clears the previous default before inserting the new default row', async () => {
    const chain = chainWith({ data: ROW })
    mockFrom.mockReturnValue(chain)

    const result = await createPayoutDestination('user-1', {
      type: 'gcash',
      accountNumber: '09171234567',
      accountName: 'Juan Dela Cruz',
      isDefault: true,
    })

    // Clear-old-default update runs first; the insert itself carries
    // is_default so no follow-up default updates are needed.
    expect(chain.update).toHaveBeenCalledTimes(1)
    expect(chain.eq.mock.calls).toEqual(
      expect.arrayContaining([
        ['user_id', 'user-1'],
        ['is_default', true],
      ])
    )
    expect(chain.insert).toHaveBeenCalledWith(
      expect.objectContaining({ is_default: true })
    )
    expect(result.is_default).toBe(true)
  })
})

describe('updatePayoutDestination', () => {
  it('updates the row fields and re-derives the BIC from type', async () => {
    const chain = chainWith({})
    mockFrom.mockReturnValue(chain)

    await updatePayoutDestination('dest-1', {
      type: 'maya',
      accountNumber: '09181234567',
      accountName: 'Juana Dela Cruz',
      isDefault: false,
    })

    expect(mockFrom).toHaveBeenCalledWith('payout_destination')
    expect(chain.update).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'maya',
        bic: 'PAPHPHM1XXX',
        account_number: '09181234567',
        account_name: 'Juana Dela Cruz',
      })
    )
    expect(chain.eq).toHaveBeenCalledWith('id', 'dest-1')
  })
})

describe('setDefaultPayoutDestination', () => {
  it('clears the old default before setting the new one', async () => {
    const chain = chainWith({ data: { id: 'dest-old' } })
    mockFrom.mockReturnValue(chain)

    await setDefaultPayoutDestination('user-1', 'dest-2')

    expect(chain.update).toHaveBeenCalledTimes(2)
    expect(chain.eq.mock.calls).toEqual(
      expect.arrayContaining([
        ['user_id', 'user-1'],
        ['is_default', true],
        ['id', 'dest-2'],
      ])
    )
  })

  it('no-ops when the row is already the default', async () => {
    const chain = chainWith({ data: { id: 'dest-2' } })
    mockFrom.mockReturnValue(chain)

    await setDefaultPayoutDestination('user-1', 'dest-2')

    expect(chain.update).not.toHaveBeenCalled()
  })

  it('throws when clearing the old default fails', async () => {
    mockFrom.mockReturnValue(chainWith({ error: { message: 'boom' } }))

    await expect(setDefaultPayoutDestination('user-1', 'dest-2')).rejects.toMatchObject({
      message: 'boom',
    })
  })
})

describe('deletePayoutDestination', () => {
  it('deletes the row', async () => {
    const chain = chainWith({})
    mockFrom.mockReturnValue(chain)

    await deletePayoutDestination('dest-1')

    expect(chain.delete).toHaveBeenCalled()
    expect(chain.eq).toHaveBeenCalledWith('id', 'dest-1')
  })

  it('translates foreign key violations into a friendly error', async () => {
    mockFrom.mockReturnValue(
      chainWith({ error: { code: '23503', message: 'foreign key violation' } })
    )

    await expect(deletePayoutDestination('dest-1')).rejects.toThrow(
      /used in past payouts/
    )
  })

  it('rethrows unrelated errors as-is', async () => {
    mockFrom.mockReturnValue(chainWith({ error: { code: '42501', message: 'rls' } }))

    await expect(deletePayoutDestination('dest-1')).rejects.toMatchObject({ message: 'rls' })
  })
})
