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

// Typed error codes surfaced by the paymongo edge function (server-side
// eligibility checks in createRefund): REFUND_NOT_SUPPORTED,
// REFUND_ALREADY_PENDING, PAYMENT_NOT_FOUND, PAYMENT_NOT_OWNED,
// PAYMENT_NOT_PAID, REFUND_INVALID_AMOUNT, REFUND_EXCEEDS_AMOUNT. Code is null
// for transport/unknown failures.
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

export async function createCheckoutSession(params: {
  referenceId: string
  amount: number
  description: string
  redirectBaseUrl: string
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

// The backend is the source of truth for payment status. Deep-link params
// never determine the outcome — only this endpoint's verdict is trusted.
export async function getCheckoutSessionStatus(sessionId: string): Promise<PaymongoSessionStatus> {
  const response = await invoke<PaymongoEnvelope<{
    id: string
    attributes: { status: string }
  }>>('getCheckoutSessionStatus', { sessionId })

  switch (response.data.attributes.status) {
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

export async function createCardPayment(params: {
  referenceId: string
  amount: number
  description: string
  card: PaymongoCard
}): Promise<PaymongoCardPaymentResult> {
  const response = await invoke<PaymongoEnvelope<{
    attributes: { status: string; failure_reason: string | null }
  }>>('createCardPayment', params)

  return {
    status: response.data.attributes.status === 'succeeded' ? 'succeeded' : 'failed',
    failureReason: response.data.attributes.failure_reason,
  }
}

export type RefundRequestResult = {
  status: 'processing' | 'succeeded' | 'failed'
}

// Full-amount refund for a paid, refundable payment. The backend checks
// eligibility (method + PayMongo rail) and inserts the pending refund row
// before calling PayMongo — duplicate requests fail with REFUND_ALREADY_PENDING.
export async function requestRefund(params: {
  paymentId: string
  amount: number
}): Promise<RefundRequestResult> {
  const response = await invoke<PaymongoEnvelope<{
    id: string
    attributes: { status: string }
  }>>('createRefund', {
    paymentId: params.paymentId,
    amount: params.amount,
    reason: 'requested_by_customer',
  })

  const status = response.data.attributes.status
  return {
    status: status === 'succeeded' ? 'succeeded' : status === 'failed' ? 'failed' : 'processing',
  }
}
