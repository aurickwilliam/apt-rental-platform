// PayMongo proxy Edge Function
//
// All PayMongo API calls are proxied through this function so the secret key
// never reaches the mobile client. Invoked from the app via:
//   supabase.functions.invoke('paymongo', { body: { action, ...payload } })
//
// MOCK MODE
// While PAYMONGO_SECRET_KEY is unset the function returns PayMongo-shaped mock
// responses so the client flow can be developed and tested end-to-end:
//   - E-wallet (checkout session) status is derived from the reference id:
//       ends with "-fail"    -> failed
//       ends with "-expired" -> expired
//       otherwise            -> paid
//   - Card payments mirror PayMongo test-card behavior: card numbers ending in
//     "0002" are declined, everything else succeeds.
//
// REAL MODE (PAYMONGO_SECRET_KEY set)
//   - createCheckoutSession     - v2 hosted checkout session (GCash/Maya).
//                                 Records a pending payment row, returns the
//                                 session id + checkout_url.
//   - getCheckoutSessionStatus  - v1 session lookup (create is v2, retrieve is
//                                 v1). Session status is only active/expired,
//                                 so the outcome is derived from the embedded
//                                 payment intent + payments. Backend is the
//                                 source of truth; the deep link only carries
//                                 the session id (or reference id) — never an
//                                 outcome.
//   - createCardPayment         - create payment method -> payment intent ->
//                                 attach. The intent is synchronous: succeeded
//                                 -> payment row (status paid),
//                                 awaiting_next_action (3DS) -> clear
//                                 "not supported yet" error, failed -> decline
//                                 reason.
// The acting user is resolved from the forwarded JWT and their tenancy is
// verified server-side so no one can pay another tenant's rent.
//
// Future actions (refunds, recurring payments, payment verification) are added
// as new cases in the dispatch switch below without restructuring.

import { createClient } from 'jsr:@supabase/supabase-js@2'

const PAYMONGO_API_V1 = 'https://api.paymongo.com/v1'
const PAYMONGO_API_V2 = 'https://api.paymongo.com/v2'

const dbClient = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
)

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })

const badRequest = (message: string) =>
  json(
    {
      errors: [
        {
          code: 'request_error',
          detail: message,
          status: 400,
        },
      ],
    },
    400,
  )

type CheckoutSessionStatus = 'paid' | 'failed' | 'expired' | 'cancelled' | 'pending'

// Mock store — unused in real mode (sessions are persisted in the payment table).
const mockSessions = new Map<string, { id: string; status: CheckoutSessionStatus }>()

// Mock only — remove once PAYMONGO_SECRET_KEY is always set.
const mockStatusForReference = (referenceId: string): CheckoutSessionStatus =>
  referenceId.endsWith('-expired')
    ? 'expired'
    : referenceId.endsWith('-fail')
      ? 'failed'
      : 'paid'

type CheckoutSessionPayload = {
  referenceId: string
  amount: number
  description: string
  redirectBaseUrl: string
  method?: 'gcash' | 'maya'
  tenancyId?: string
  periodStart?: string | null
  periodEnd?: string | null
  dueDate?: string | null
}

type CardPaymentPayload = {
  referenceId: string
  amount: number
  description: string
  card: {
    number: string
    expMonth: number
    expYear: number
    cvc: string
    name: string
  }
  tenancyId?: string
  periodStart?: string | null
  periodEnd?: string | null
  dueDate?: string | null
}

type RefundPayload = {
  paymentId: string
  amount: number
  reason?: 'duplicate' | 'fraudulent' | 'requested_by_customer' | 'others'
  notes?: string
}

// --- Real PayMongo plumbing -------------------------------------------------

class PayMongoApiError extends Error {
  status: number
  code: string

  constructor(status: number, code: string, detail: string) {
    super(detail)
    this.name = 'PayMongoApiError'
    this.status = status
    this.code = code
  }
}

type PayMongoResource<T> = { data: { id: string; type: string; attributes: T } }

// PayMongo uses HTTP Basic auth with the secret key as the username and an
// empty password. Errors are returned in PayMongo's real shape
// ({ errors: [{ detail }] }) so client-side reason parsing stays identical.
async function paymongoFetch<T>(url: string, init: { method?: 'GET' | 'POST'; body?: unknown } = {}): Promise<PayMongoResource<T>> {
  const secretKey = Deno.env.get('PAYMONGO_SECRET_KEY')
  if (!secretKey) throw new PayMongoApiError(500, 'configuration_error', 'PayMongo is not configured.')

  const res = await fetch(url, {
    method: init.method ?? 'GET',
    headers: {
      Authorization: `Basic ${btoa(`${secretKey}:`)}`,
      'Content-Type': 'application/json',
    },
    body: init.body === undefined ? undefined : JSON.stringify(init.body),
  })

  const body = (await res.json().catch(() => null)) as PayMongoResource<T> | { errors?: { code?: string; detail?: string; status?: number }[] } | null

  if (!res.ok || !body || !('data' in (body as Record<string, unknown>))) {
    const error = (body as { errors?: { code?: string; detail?: string; status?: number }[] } | null)?.errors?.[0]
    throw new PayMongoApiError(
      error?.status ?? res.status,
      error?.code ?? 'paymongo_error',
      error?.detail ?? `PayMongo request failed (${res.status}).`,
    )
  }

  return body as PayMongoResource<T>
}

// Resolve the acting user from the JWT forwarded by supabase.functions.invoke
// and map it to the internal public.users.id (RLS convention).
async function resolveTenantId(req: Request): Promise<string | null> {
  const jwt = req.headers.get('Authorization')?.replace(/^Bearer\s+/i, '')
  if (!jwt) return null

  const {
    data: { user },
    error,
  } = await dbClient.auth.getUser(jwt)
  if (error || !user) return null

  const { data } = await dbClient.from('users').select('id').eq('user_id', user.id).maybeSingle()
  return data?.id ?? null
}

type TenancyContext = {
  id: string
  apartment_id: string
  monthly_rent: number | null
  landlord_id: string | null
}

// Resolve the caller's tenancy: the requested tenancyId when provided (must
// belong to the caller and be active), otherwise the newest active tenancy.
async function resolveTenancy(req: Request, tenancyId?: string): Promise<{ tenantId: string; tenancy: TenancyContext }> {
  const tenantId = await resolveTenantId(req)
  if (!tenantId) throw new PayMongoApiError(401, 'authentication_error', 'You must be signed in to pay.')

  let query = dbClient
    .from('tenancies')
    .select('id, apartment_id, monthly_rent, apartment:apartments (landlord_id)')
    .eq('tenant_id', tenantId)
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .limit(1)
  if (tenancyId) query = query.eq('id', tenancyId)

  const { data, error } = await query.maybeSingle()
  if (error) throw new PayMongoApiError(500, 'database_error', 'Could not load your tenancy.')
  if (!data) {
    throw new PayMongoApiError(
      400,
      'validation_error',
      tenancyId ? 'This tenancy is not active or does not belong to your account.' : 'No active tenancy found for this account.',
    )
  }

  // PostgREST returns a single object for a to-one embed; the generated types
  // may type it as an array — normalize both defensively.
  const tenancy = data as unknown as {
    id: string
    apartment_id: string
    monthly_rent: number | null
    apartment?: { landlord_id: string | null } | { landlord_id: string | null }[] | null
  }
  const apartment = tenancy.apartment
  const landlordId = Array.isArray(apartment) ? apartment[0]?.landlord_id ?? null : apartment?.landlord_id ?? null
  return {
    tenantId,
    tenancy: {
      id: tenancy.id,
      apartment_id: tenancy.apartment_id,
      monthly_rent: tenancy.monthly_rent,
      landlord_id: landlordId,
    },
  }
}

type PaymentRecord = {
  tenantId: string
  tenancy: TenancyContext
  referenceId: string
  method: 'gcash' | 'maya' | 'card'
  amount: number
  status?: 'pending' | 'paid'
  sessionId?: string | null
  intentId?: string | null
  periodStart?: string | null
  periodEnd?: string | null
  dueDate?: string | null
}

// Persist the payment row (service role — the tenant's own INSERT policy also
// allows it, but the edge function owns this write to keep it atomic with the
// PayMongo call).
async function recordPayment(params: PaymentRecord): Promise<void> {
  const { error } = await dbClient.from('payment').insert({
    tenant_id: params.tenantId,
    tenancy_id: params.tenancy.id,
    apartment_id: params.tenancy.apartment_id,
    landlord_id: params.tenancy.landlord_id,
    reference_id: params.referenceId,
    method: params.method,
    amount: params.amount,
    date: new Date().toISOString().slice(0, 10),
    status: params.status ?? 'pending',
    paymongo_session_id: params.sessionId ?? null,
    paymongo_intent_id: params.intentId ?? null,
    period_start: params.periodStart ?? null,
    period_end: params.periodEnd ?? null,
    due_date: params.dueDate ?? null,
  })

  if (error) {
    console.error('recordPayment:', error)
    throw new PayMongoApiError(500, 'database_error', 'Could not record the payment.')
  }
}

// --- Actions ----------------------------------------------------------------

function createCheckoutSession(req: Request, payload: CheckoutSessionPayload) {
  const { referenceId, amount, redirectBaseUrl } = payload

  if (!referenceId || !amount || !redirectBaseUrl) {
    return badRequest('referenceId, amount, and redirectBaseUrl are required.')
  }

  const secretKey = Deno.env.get('PAYMONGO_SECRET_KEY')
  if (!secretKey) {
    // Mock — active only while PAYMONGO_SECRET_KEY is unset.
    const sessionId = `cs_mock_${referenceId}`
    // Keyed by sessionId (which embeds the reference id) so the status lookup
    // in getCheckoutSessionStatus resolves the mock correctly.
    mockSessions.set(sessionId, { id: sessionId, status: mockStatusForReference(referenceId) })

    return json({
      data: {
        id: sessionId,
        type: 'checkout_session',
        attributes: {
          status: 'awaiting_payment_method',
          checkout_url: `https://checkout.paymongo.com/mock/${sessionId}`,
        },
      },
    })
  }

  return createRealCheckoutSession(req, payload)
}

async function createRealCheckoutSession(req: Request, payload: CheckoutSessionPayload): Promise<Response> {
  const { referenceId, amount, description, redirectBaseUrl } = payload

  const { tenantId, tenancy } = await resolveTenancy(req, payload.tenancyId)

  const { data: session } = await paymongoFetch<{
    status: string
    checkout_url?: string
    reference_number?: string
  }>(`${PAYMONGO_API_V2}/checkout_sessions`, {
    method: 'POST',
    body: {
      data: {
        attributes: {
          line_items: [
            {
              currency: 'PHP',
              amount: Math.round(amount * 100),
              name: description,
              quantity: 1,
            },
          ],
          payment_method_types: ['gcash', 'paymaya'],
          // The deep link carries ONLY the reference id — never a payment
          // outcome. On return the client re-verifies with the backend, which
          // resolves the reference id (or the session id) to the session.
          success_url: `${redirectBaseUrl}?sessionId=${referenceId}`,
          cancel_url: `${redirectBaseUrl}?sessionId=${referenceId}`,
          reference_number: referenceId,
        },
      },
    },
  })

  await recordPayment({
    tenantId,
    tenancy,
    referenceId,
    method: payload.method ?? 'gcash',
    amount,
    sessionId: session.id,
    periodStart: payload.periodStart ?? null,
    periodEnd: payload.periodEnd ?? null,
    dueDate: payload.dueDate ?? null,
  })

  return json({
    data: {
      id: session.id,
      type: 'checkout_session',
      attributes: {
        status: session.attributes.status,
        checkout_url: session.attributes.checkout_url,
      },
    },
  })
}

// The webhook matches the session to our row via reference_number; the deep
// link carries only the reference id (see the checkout session flow above).

function getCheckoutSessionStatus({ sessionId }: { sessionId: string }) {
  if (!sessionId) return badRequest('sessionId is required.')

  const secretKey = Deno.env.get('PAYMONGO_SECRET_KEY')
  if (!secretKey) {
    // Mock — active only while PAYMONGO_SECRET_KEY is unset.
    const session = mockSessions.get(sessionId)

    return json({
      data: {
        id: sessionId,
        type: 'checkout_session',
        attributes: {
          status: session?.status ?? 'paid',
        },
      },
    })
  }

  return getRealCheckoutSessionStatus(sessionId)
}

async function getRealCheckoutSessionStatus(sessionId: string): Promise<Response> {
  let paymongoId = sessionId

  // Deep links can carry the reference id instead of the session id (older
  // clients); resolve it through the payment row we persisted on creation.
  if (!sessionId.startsWith('cs_')) {
    const { data } = await dbClient
      .from('payment')
      .select('paymongo_session_id')
      .eq('reference_id', sessionId)
      .maybeSingle()
    if (data?.paymongo_session_id) paymongoId = data.paymongo_session_id
  }

  // Create is v2 but retrieve is v1 — both carry the same session resource.
  const { data: session } = await paymongoFetch<{
    status: string
    payment_intent?: {
      attributes?: { status?: string }
    }
    payments?: { id: string; attributes?: { status?: string; type?: string } }[]
  }>(`${PAYMONGO_API_V1}/checkout_sessions/${paymongoId}`)

  const attrs = session.attributes
  const payments = attrs.payments ?? []
  const intentStatus = attrs.payment_intent?.attributes?.status
  const hasPaidPayment = payments.some((payment) => payment.attributes?.status === 'paid')

  // FIX 1 — capture the PayMongo payment resource id + the exact rail used
  // (payment method type) so refund eligibility metadata exists even when the
  // webhook misses. Never clobber a value the webhook already captured.
  const firstPaid = payments.find((payment) => payment.attributes?.status === 'paid') ?? payments[0]
  if (firstPaid?.id?.startsWith('pay_')) {
    await dbClient
      .from('payment')
      .update({
        paymongo_payment_id: firstPaid.id,
        paymongo_payment_method_type: firstPaid.attributes?.type ?? null,
      })
      .eq('paymongo_session_id', paymongoId)
      .is('paymongo_payment_id', null)
  }

  // The session itself only reports active/expired; the payment outcome is
  // derived from the embedded intent and payments. Normalize to the statuses
  // the client understands.
  let status: CheckoutSessionStatus = 'pending'
  if (attrs.status === 'expired') status = 'expired'
  else if (intentStatus === 'succeeded' || hasPaidPayment) status = 'paid'
  else if (intentStatus === 'failed' || intentStatus === 'cancelled') status = 'failed'

  return json({
    data: {
      id: session.id,
      type: 'checkout_session',
      attributes: {
        status,
      },
    },
  })
}

function createCardPayment(req: Request, payload: CardPaymentPayload) {
  const { referenceId, card } = payload

  if (!referenceId || !card?.number || !card?.expMonth || !card?.expYear || !card?.cvc) {
    return badRequest('referenceId and complete card details are required.')
  }

  const secretKey = Deno.env.get('PAYMONGO_SECRET_KEY')
  if (!secretKey) {
    // Mock — active only while PAYMONGO_SECRET_KEY is unset.
    // Mirrors PayMongo test-card behavior: 4000 0000 0000 0002 is declined.
    const isDeclined = card.number.replace(/\s/g, '').endsWith('0002')

    if (isDeclined) {
      return json({
        data: {
          type: 'payment_intent',
          attributes: {
            status: 'failed',
            failure_reason: 'Your card was declined.',
          },
        },
      })
    }

    return json({
      data: {
        type: 'payment_intent',
        attributes: {
          status: 'succeeded',
          failure_reason: null,
        },
      },
    })
  }

  return createRealCardPayment(req, payload)
}

async function createRealCardPayment(req: Request, payload: CardPaymentPayload): Promise<Response> {
  const { referenceId, amount, description, card } = payload

  const { tenantId, tenancy } = await resolveTenancy(req, payload.tenancyId)

  // 1. Create the card payment method (replaces the deprecated /v1/tokens).
  const { data: paymentMethod } = await paymongoFetch<{
    type: string
    details?: { card_number?: string; exp_month?: number; exp_year?: number; cvc?: string }
  }>(`${PAYMONGO_API_V1}/payment_methods`, {
    method: 'POST',
    body: {
      data: {
        attributes: {
          type: 'card',
          details: {
            card_number: card.number.replace(/\s/g, ''),
            exp_month: card.expMonth,
            exp_year: card.expYear,
            cvc: card.cvc,
          },
        },
      },
    },
  })

  // 2. Create the payment intent.
  const { data: intent } = await paymongoFetch<{
    status: string
    amount?: number
    currency?: string
    payment_method_allowed?: string[]
    last_payment_error?: { message?: string; decline_code?: string } | null
  }>(`${PAYMONGO_API_V1}/payment_intents`, {
    method: 'POST',
    body: {
      data: {
        attributes: {
          amount: Math.round(amount * 100),
          currency: 'PHP',
          description,
          payment_method_allowed: ['card'],
          capture_type: 'automatic',
        },
      },
    },
  })

  // 3. Attach the payment method (completes the payment for non-3DS cards).
  await paymongoFetch<{ status: string }>(`${PAYMONGO_API_V1}/payment_intents/${intent.id}/attach`, {
    method: 'POST',
    body: {
      data: {
        attributes: {
          payment_method: paymentMethod.id,
        },
      },
    },
  })

  // 4. Read the authoritative intent status.
  const { data: final } = await paymongoFetch<{
    status: string
    last_payment_error?: { message?: string; decline_code?: string } | null
  }>(`${PAYMONGO_API_V1}/payment_intents/${intent.id}`)

  if (final.attributes.status === 'succeeded') {
    await recordPayment({
      tenantId,
      tenancy,
      referenceId,
      method: 'card',
      amount,
      status: 'paid',
      intentId: intent.id,
      periodStart: payload.periodStart ?? null,
      periodEnd: payload.periodEnd ?? null,
      dueDate: payload.dueDate ?? null,
    })

    return json({
      data: {
        type: 'payment_intent',
        attributes: {
          status: 'succeeded',
          failure_reason: null,
        },
      },
    })
  }

  if (final.attributes.status === 'awaiting_next_action') {
    // 3-D Secure verification flow is a documented follow-up; never record the
    // payment as paid until it completes.
    return json({
      data: {
        type: 'payment_intent',
        attributes: {
          status: 'failed',
          failure_reason: 'This card requires 3-D Secure verification, which is not supported yet. Please use GCash or Maya instead.',
        },
      },
    })
  }

  const lastError = final.attributes.last_payment_error
  return json({
    data: {
      type: 'payment_intent',
      attributes: {
        status: 'failed',
        failure_reason: lastError?.decline_code
          ? `Your card was declined (${lastError.decline_code}).`
          : lastError?.message ?? 'Your card was declined.',
      },
    },
  })
}

// --- Refunds (tenant payouts) ------------------------------------------------
//
// FIX 1 — server-side eligibility, typed errors only (never a raw PayMongo
// 4xx). Refundable rails are card + standard e-wallet checkout (gcash /
// paymaya); QR Ph, direct online banking and OTC payments are refunded
// manually. The pending refund row is inserted BEFORE calling PayMongo; the
// one_active_refund_per_payment partial unique index closes the double-tap /
// two-device race — the losing INSERT (23505) surfaces as REFUND_ALREADY_PENDING.

async function createRefund(req: Request, payload: RefundPayload): Promise<Response> {
  const { paymentId, amount, reason = 'requested_by_customer', notes } = payload

  if (!paymentId || !amount) {
    return badRequest('paymentId and amount are required.')
  }

  const tenantId = await resolveTenantId(req)
  if (!tenantId) {
    throw new PayMongoApiError(401, 'authentication_error', 'You must be signed in to request a refund.')
  }

  const { data: paymentRow, error: paymentError } = await dbClient
    .from('payment')
    .select(
      'id, tenant_id, status, amount, is_refundable, paymongo_payment_id'
    )
    .eq('id', paymentId)
    .maybeSingle()
  if (paymentError || !paymentRow) {
    throw new PayMongoApiError(404, 'PAYMENT_NOT_FOUND', 'Payment not found.')
  }

  if (paymentRow.tenant_id !== tenantId) {
    throw new PayMongoApiError(403, 'PAYMENT_NOT_OWNED', 'This payment does not belong to your account.')
  }
  if (paymentRow.status !== 'paid') {
    throw new PayMongoApiError(400, 'PAYMENT_NOT_PAID', 'Only completed payments can be refunded.')
  }
  if (!paymentRow.is_refundable) {
    throw new PayMongoApiError(
      400,
      'REFUND_NOT_SUPPORTED',
      'This payment method cannot be refunded online. Cash, QR and over-the-counter payments are refunded manually.',
    )
  }
  if (amount < 1) {
    throw new PayMongoApiError(400, 'REFUND_INVALID_AMOUNT', 'The minimum refund is ₱1.00.')
  }

  const { data: refundRows } = await dbClient
    .from('refund')
    .select('amount')
    .eq('payment_id', paymentId)
    .in('status', ['pending', 'processing', 'succeeded'])

  const refunded = (refundRows ?? []).reduce((sum, row) => sum + Number(row.amount), 0)
  const remaining = Number(paymentRow.amount ?? 0) - refunded
  if (amount > remaining) {
    throw new PayMongoApiError(400, 'REFUND_EXCEEDS_AMOUNT', 'The refund amount exceeds what can be refunded for this payment.')
  }

  const { data: refundRow, error: insertError } = await dbClient
    .from('refund')
    .insert({
      payment_id: paymentId,
      user_id: tenantId,
      amount,
      reason,
      created_by: tenantId,
      status: 'pending',
    })
    .select('id')
    .single()

  if (insertError) {
    if (insertError.code === '23505') {
      throw new PayMongoApiError(409, 'REFUND_ALREADY_PENDING', 'A refund is already being processed for this payment.')
    }
    console.error('createRefund insert:', insertError)
    throw new PayMongoApiError(500, 'database_error', 'Could not record the refund.')
  }

  const secretKey = Deno.env.get('PAYMONGO_SECRET_KEY')
  if (!secretKey) {
    // Mock — mirrors the other mock branches; payment ids ending in "-fail"
    // produce a failed refund.
    const mockSucceeded = !paymentId.endsWith('-fail')
    const mockStatus = mockSucceeded ? 'succeeded' : 'failed'
    await dbClient
      .from('refund')
      .update({
        status: mockStatus,
        ...(mockSucceeded
          ? { completed_at: new Date().toISOString() }
          : { failure_reason: 'Mock refund declined.' }),
      })
      .eq('id', refundRow.id)

    return json({
      data: {
        id: refundRow.id,
        type: 'refund',
        attributes: { status: mockStatus, failure_reason: mockSucceeded ? null : 'Mock refund declined.' },
      },
    })
  }

  try {
    const { data: refund } = await paymongoFetch<{
      status: string
      failure_reason?: string | null
    }>(`${PAYMONGO_API_V1}/refunds`, {
      method: 'POST',
      body: {
        data: {
          attributes: {
            amount: Math.round(amount * 100),
            payment_id: paymentRow.paymongo_payment_id,
            reason,
            ...(notes ? { notes } : {}),
          },
        },
      },
    })

    await dbClient
      .from('refund')
      .update({ status: 'processing', paymongo_refund_id: refund.id })
      .eq('id', refundRow.id)

    return json({
      data: {
        id: refund.id,
        type: 'refund',
        attributes: { status: 'processing' },
      },
    })
  } catch (err) {
    const detail = err instanceof PayMongoApiError
      ? err.message
      : 'Refund could not be processed.'
    await dbClient
      .from('refund')
      .update({ status: 'failed', failure_reason: detail })
      .eq('id', refundRow.id)
    throw err instanceof PayMongoApiError
      ? err
      : new PayMongoApiError(500, 'refund_error', detail)
  }
}

// --- Transfer status (fallback poll) -----------------------------------------
//
// The webhook (transfer.outward.*) is the primary settlement path; this
// endpoint is the manual/fallback poll. PayMongo transfer event/status names
// are verified against the dashboard catalog at go-live.

function getTransferStatus({ transferId }: { transferId: string }) {
  if (!transferId) return badRequest('transferId is required.')

  const secretKey = Deno.env.get('PAYMONGO_SECRET_KEY')
  if (!secretKey) {
    return json({
      data: {
        id: transferId,
        type: 'transfer',
        attributes: { status: transferId.endsWith('-fail') ? 'failed' : 'successful' },
      },
    })
  }

  return getRealTransferStatus(transferId)
}

async function getRealTransferStatus(transferId: string): Promise<Response> {
  const { data: transfer } = await paymongoFetch<{ status: string }>(
    `${PAYMONGO_API_V2}/transfers/${transferId}`
  )

  return json({
    data: {
      id: transferId,
      type: 'transfer',
      attributes: { status: transfer.attributes.status },
    },
  })
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { action, ...payload } = await req.json()

    switch (action) {
      case 'createCheckoutSession':
        return await createCheckoutSession(req, payload)
      case 'getCheckoutSessionStatus':
        return getCheckoutSessionStatus(payload)
      case 'createCardPayment':
        return await createCardPayment(req, payload)
      case 'createRefund':
        return await createRefund(req, payload)
      case 'getTransferStatus':
        return getTransferStatus(payload)
      default:
        return badRequest(`Unknown action: ${action}`)
    }
  } catch (err) {
    if (err instanceof PayMongoApiError) {
      return json(
        {
          errors: [
            {
              code: err.code,
              detail: err.message,
              status: err.status,
            },
          ],
        },
        err.status,
      )
    }
    console.error('paymongo:', err)
    return json(
      {
        errors: [
          {
            code: 'internal_error',
            detail: 'Unexpected error processing payment.',
            status: 500,
          },
        ],
      },
      500,
    )
  }
})
