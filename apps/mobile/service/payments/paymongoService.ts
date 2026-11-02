import { supabase } from '@repo/supabase'

// Client for the `paymongo` Supabase Edge Function. The function holds the
// PayMongo secret key; the client only sends data the app already has.
//
// Mock mode: while PAYMONGO_SECRET_KEY is unset on the edge function, all calls
// return PayMongo-shaped mock responses. For e-wallet sessions, a reference id
// ending in "-fail" or "-expired" simulates a failed/expired session; card
// numbers ending in "0002" are declined.

export type PaymongoCard = {
  number: string
  expMonth: number
  expYear: number
  cvc: string
  name: string
}

export type PaymongoCheckoutSession = {
  id: string
  checkoutUrl: string
  status: string
}

export type PaymongoSessionStatus = 'paid' | 'failed' | 'expired' | 'pending'

export type PaymongoCardPaymentResult = {
  status: 'succeeded' | 'failed'
  failureReason: string | null
}

// Error codes surfaced by the paymongo edge function (for example
// configuration_error or not_found). Code is null for transport/unknown failures.
export class PaymongoError extends Error {
  reason: string
  code: string | null

  constructor(reason: string, code: string | null = null) {
    super(reason)
    this.name = 'PaymongoError'
    this.reason = reason
    this.code = code
  }
}

type PaymongoEnvelope<T> = {
  data: T
}

export const NETWORK_ERROR_CODE = 'network_error'
const NETWORK_ERROR_REASON =
  'We could not reach the server. Check your connection and try again. If you already paid, your payment is safe.'
// Delays before retrying a dropped connection (up to 3 attempts in all).
const NETWORK_RETRY_DELAYS_MS = [1000, 2000]

const extractError = async (error: unknown): Promise<{ reason: string; code: string | null }> => {
  const response = (error as { context?: Response }).context
  if (response) {
    try {
      const body = (await response.json()) as { errors?: { detail?: string; code?: string }[] }
      const first = body.errors?.[0]
      if (first?.detail) return { reason: first.detail, code: first.code ?? null }
      if (first?.code) return { reason: first.code, code: first.code }
    } catch {
      // Response body was not JSON — fall through to the generic message.
    }
  }
  // The request never reached the function (e.g. the connection dropped while
  // the app returned from the browser). Nothing is known about the payment.
  if ((error as { name?: string }).name === 'FunctionsFetchError') {
    return { reason: NETWORK_ERROR_REASON, code: NETWORK_ERROR_CODE }
  }
  return {
    reason: (error as { message?: string }).message ?? 'Payment failed. Please try again.',
    code: null,
  }
}

const invoke = async <T>(action: string, payload: Record<string, unknown>): Promise<T> => {
  const { data, error } = await supabase.functions.invoke<T>('paymongo', {
    body: { action, ...payload },
  })

  if (error) {
    const { reason, code } = await extractError(error)
    throw new PaymongoError(reason, code)
  }

  return data as T
}

// Only for calls that are safe to repeat (status checks, cancelling): a brief
// network drop, common when returning from the browser, should not look like a
// failed payment.
async function invokeRepeatable<T>(action: string, payload: Record<string, unknown>): Promise<T> {
  for (let attempt = 0; ; attempt++) {
    try {
      return await invoke<T>(action, payload)
    } catch (error) {
      const delay = NETWORK_RETRY_DELAYS_MS[attempt]
      if (!(error instanceof PaymongoError) || error.code !== NETWORK_ERROR_CODE || delay === undefined) throw error
      await new Promise((resolve) => setTimeout(resolve, delay))
    }
  }
}

export async function createCheckoutSession(params: {
  referenceId: string
  amount: number
  description: string
  redirectBaseUrl: string
  method?: 'gcash' | 'maya' | 'qrph'
  tenancyId?: string
  periodStart?: string | null
  periodEnd?: string | null
  dueDate?: string | null
}): Promise<PaymongoCheckoutSession> {
  const response = await invoke<PaymongoEnvelope<{
    id: string
    attributes: { status: string; checkout_url: string }
  }>>('createCheckoutSession', params)

  return {
    id: response.data.id,
    checkoutUrl: response.data.attributes.checkout_url,
    status: response.data.attributes.status,
  }
}

function toSessionStatus(status: string): PaymongoSessionStatus {
  switch (status) {
    case 'paid':
      return 'paid'
    case 'failed':
    case 'cancelled':
      return 'failed'
    case 'expired':
      return 'expired'
    default:
      return 'pending'
  }
}

export type PaymongoSessionDetails = {
  status: PaymongoSessionStatus
  // Only present while the session is still open, so it can be resumed.
  checkoutUrl: string | null
}

// The backend is the source of truth for payment status. Deep-link params
// never determine the outcome — only this endpoint's verdict is trusted.
export async function getCheckoutSessionDetails(sessionId: string): Promise<PaymongoSessionDetails> {
  const response = await invokeRepeatable<PaymongoEnvelope<{
    id: string
    attributes: { status: string; checkout_url?: string }
  }>>('getCheckoutSessionStatus', { sessionId })

  return {
    status: toSessionStatus(response.data.attributes.status),
    checkoutUrl: response.data.attributes.checkout_url ?? null,
  }
}

export async function getCheckoutSessionStatus(sessionId: string): Promise<PaymongoSessionStatus> {
  return (await getCheckoutSessionDetails(sessionId)).status
}

// The tenant backed out of the hosted checkout: ask the backend to close the
// session so it can't be paid later. Its verdict is what counts ('paid' if the
// payment went through first, 'pending' if the session could not be closed).
export async function cancelCheckoutSession(sessionId: string): Promise<PaymongoSessionStatus> {
  const response = await invokeRepeatable<PaymongoEnvelope<{
    id: string
    attributes: { status: string }
  }>>('cancelCheckoutSession', { sessionId })

  return toSessionStatus(response.data.attributes.status)
}

export async function createCardPayment(params: {
  referenceId: string
  amount: number
  description: string
  card: PaymongoCard
  tenancyId?: string
  periodStart?: string | null
  periodEnd?: string | null
  dueDate?: string | null
}): Promise<PaymongoCardPaymentResult> {
  const response = await invoke<PaymongoEnvelope<{
    attributes: { status: string; failure_reason: string | null }
  }>>('createCardPayment', params)

  return {
    status: response.data.attributes.status === 'succeeded' ? 'succeeded' : 'failed',
    failureReason: response.data.attributes.failure_reason,
  }
}
