import { cancelCheckoutSession, getCheckoutSessionStatus, NETWORK_ERROR_CODE, PaymongoError } from './paymongoService'

const mockInvoke = jest.fn()

jest.mock('@repo/supabase', () => ({
  supabase: {
    functions: { invoke: (...args: unknown[]) => mockInvoke(...args) },
  },
}))

const droppedConnection = { data: null, error: { name: 'FunctionsFetchError', message: 'Failed to send a request to the Edge Function' } }
const paid = { data: { data: { id: 'cs_1', attributes: { status: 'paid' } } }, error: null }

describe('paymongoService repeatable calls', () => {
  beforeEach(() => {
    mockInvoke.mockReset()
    jest.useFakeTimers()
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  it('retries a dropped connection and still reports the real status', async () => {
    mockInvoke.mockResolvedValueOnce(droppedConnection).mockResolvedValueOnce(droppedConnection).mockResolvedValueOnce(paid)

    const result = getCheckoutSessionStatus('cs_1')
    await jest.runAllTimersAsync()

    await expect(result).resolves.toBe('paid')
    expect(mockInvoke).toHaveBeenCalledTimes(3)
  })

  it('gives up after three attempts with a clear network error', async () => {
    mockInvoke.mockResolvedValue(droppedConnection)

    const result = cancelCheckoutSession('cs_1')
    const assertion = expect(result).rejects.toMatchObject({ code: NETWORK_ERROR_CODE, reason: expect.stringContaining('could not reach the server') })
    await jest.runAllTimersAsync()

    await assertion
    expect(mockInvoke).toHaveBeenCalledTimes(3)
  })

  it('does not retry an answer from the server', async () => {
    mockInvoke.mockResolvedValue({ data: null, error: { name: 'FunctionsHttpError', message: 'Edge Function returned a non-2xx status code' } })

    await expect(getCheckoutSessionStatus('cs_1')).rejects.toBeInstanceOf(PaymongoError)
    expect(mockInvoke).toHaveBeenCalledTimes(1)
  })
})
