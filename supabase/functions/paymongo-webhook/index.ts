// PayMongo webhook handler
//
// Receives PayMongo events and settles our rows via the service role:
//   - checkout_session.payment.paid -> payment row flipped to paid (matched
//     by paymongo_session_id, fallback reference_id) + rail metadata captured
//   - payment.paid                   -> card rows matched by paymongo_intent_id
//     (the payment resource carries payment_intent_id); the same event also
//     arrives for e-wallet payments — those rows are settled by the session
//     event above, so the intent match no-ops for them
//   - transfer.outward.successful    -> payout completed (idempotent)
//   - transfer.outward.failed        -> payout failed + payments requeued.
//     The transfer resource is a wallet_transaction; matching prefers its
//     transfer_id (== the tr_... id stored by process-payouts), falling back
//     to the resource id. Failure reasons come from provider_error.
//     (PayMongo's catalog has no transfer.outward.returned event.)
//   - payment.refund.updated         -> refund row settled by resource status
//   - payment.refunded               -> refund succeeded (terminal, never
//     downgraded)
//
// Tenant-side notifications fire from the existing DB triggers
// (notify_payment_created / notify_refund_status_changed / ...).
//
// Security:
//   - Requests are rejected unless the Paymongo-Signature header verifies:
//     HMAC-SHA256 over "<timestamp>.<raw body>", timing-safe comparison.
//     Test-mode events sign with te, live-mode with li.
//   - Fails closed while PAYMONGO_WEBHOOK_SECRET is unset.
//   - Replays are rejected beyond a small timestamp tolerance.
//   - Updates are idempotent: paid/complete rows are never downgraded.
//   - Unknown events are acknowledged (200) after verification.
//
// PayMongo retries non-2xx deliveries (up to ~12 times), so a 500 on a
// database error is deliberate — the retry will settle the row.

import { createClient } from 'jsr:@supabase/supabase-js@2'

const SIGNATURE_TOLERANCE_SECONDS = 300

const dbClient = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
)

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })

async function hmacSha256Hex(secret: string, message: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  )
  const signature = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(message))
  return [...new Uint8Array(signature)].map((byte) => byte.toString(16).padStart(2, '0')).join('')
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false
  let diff = 0
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i)
  return diff === 0
}

// Paymongo-Signature header: t=<unix seconds>,te=<test-mode hex>,li=<live-mode hex>
function parseSignatureHeader(header: string | null): { t: number; te: string; li: string } {
  const parts: Record<string, string> = {}
  for (const pair of (header ?? '').split(',')) {
    const [key, value] = pair.split('=')
    if (key) parts[key.trim()] = value?.trim() ?? ''
  }
  return { t: Number(parts.t), te: parts.te ?? '', li: parts.li ?? '' }
}

async function isSignatureValid(rawBody: string, header: string | null, testMode: boolean): Promise<boolean> {
  const secret = Deno.env.get('PAYMONGO_WEBHOOK_SECRET')
  if (!secret) return false

  const { t, te, li } = parseSignatureHeader(header)
  if (!Number.isFinite(t)) return false

  // Replay guard: reject signatures older than the tolerance window.
  if (Math.abs(Date.now() / 1000 - t) > SIGNATURE_TOLERANCE_SECONDS) return false

  const expected = await hmacSha256Hex(secret, `${t}.${rawBody}`)
  const provided = testMode ? te : li
  if (!provided) return false

  return timingSafeEqual(expected, provided)
}

type ParsedEvent = {
  type: string
  testMode: boolean
  resourceId: string
  referenceNumber?: string
  paymentIntentId?: string
  // FIX 1 — PayMongo payment resource id + exact rail (payment method type),
  // captured so refund eligibility can be derived server-side.
  paymentId?: string
  paymentMethodType?: string
  resourceStatus?: string
  errorMessage?: string
  // Wallet-transaction events carry the transfer id the payout row matches on.
  transferId?: string
  failureReason?: string
}

// PayMongo event envelopes vary by endpoint. The current shape is:
//   { data: { type: 'event', attributes: { type, livemode, data: {...resource} } } }
// Some endpoints emit the resource directly on data:
//   { data: { id, type, attributes: {...} } }
// Both are handled defensively. Where the resource is a Payment (pay_...),
// its id + attributes.type (the payment method type) are extracted directly;
// where it is a checkout session, the first paid payment in the payments[]
// array supplies them.
function parseEvent(rawBody: string): ParsedEvent | null {
  const body = JSON.parse(rawBody) as {
    data?: {
      id?: string
      type?: string
      attributes?: {
        type?: string
        livemode?: boolean
        data?: {
          id?: string
          attributes?: Record<string, unknown>
        }
      }
    }
  }

  const data = body.data
  const attributes = data?.attributes
  const type = attributes?.type ?? data?.type
  if (!type) return null

  const resource = (attributes?.data ?? attributes ?? null) as {
    id?: string
    attributes?: Record<string, unknown>
  } | null
  const resourceId = resource?.id ?? data?.id
  if (!resourceId) return null

  const resourceAttrs = (resource?.attributes ?? {}) as {
    reference_number?: string
    payment_intent_id?: string
    type?: string
    // Payment resources nest the rail under source.type.
    source?: { type?: string }
    status?: string
    error_message?: string
    transfer_id?: string
    provider_error?: string
    provider_error_code?: string
    failure_reason?: string
    payments?: {
      id?: string
      attributes?: { status?: string; type?: string; source?: { type?: string } }
    }[]
  }

  const isPaymentResource = resourceId.startsWith('pay_')
  const payments = Array.isArray(resourceAttrs.payments) ? resourceAttrs.payments : []
  const firstPaidPayment = payments.find((payment) => payment.attributes?.status === 'paid') ?? payments[0]
  // The rail lives at attributes.type on session payment entries, but Payment
  // resources carry it at attributes.source.type — check both.
  const railType = (attrs?: { type?: string; source?: { type?: string } }) =>
    attrs?.type ?? attrs?.source?.type

  return {
    type,
    testMode: !(attributes?.livemode ?? false),
    resourceId,
    referenceNumber: resourceAttrs.reference_number,
    paymentIntentId: resourceAttrs.payment_intent_id,
    paymentId: isPaymentResource
      ? resourceId
      : firstPaidPayment?.id?.startsWith('pay_')
        ? firstPaidPayment.id
        : undefined,
    paymentMethodType: isPaymentResource
      ? railType(resourceAttrs)
      : railType(firstPaidPayment?.attributes),
    resourceStatus: resourceAttrs.status,
    errorMessage: resourceAttrs.error_message,
    transferId: resourceAttrs.transfer_id,
    failureReason: resourceAttrs.provider_error ?? resourceAttrs.failure_reason ?? resourceAttrs.error_message,
  }
}

// Idempotent: only pending/unpaid rows flip to paid; paid/partial rows stay.
async function markPaymentPaid(
  column: 'paymongo_session_id' | 'paymongo_intent_id' | 'paymongo_payment_id' | 'reference_id',
  value: string
): Promise<boolean> {
  const { data, error } = await dbClient
    .from('payment')
    .update({ status: 'paid', updated_at: new Date().toISOString() })
    .eq(column, value)
    .in('status', ['pending', 'unpaid'])
    .select('id')
    .maybeSingle()

  if (error) throw error
  return data !== null
}

// FIX 1 — capture refund-eligibility metadata. Runs regardless of whether the
// flip above matched (card rows are already 'paid' at insert; they still need
// paymongo_payment_id for refunds). Never clobbers a captured value, but a
// late-learned rail type backfills a null one.
async function capturePaymentMetadata(
  matchColumn: 'paymongo_session_id' | 'paymongo_intent_id',
  matchValue: string,
  paymentId?: string,
  paymentMethodType?: string
): Promise<void> {
  if (!paymentId) return

  const { error } = await dbClient
    .from('payment')
    .update({
      paymongo_payment_id: paymentId,
      paymongo_payment_method_type: paymentMethodType ?? null,
    })
    .eq(matchColumn, matchValue)
    .is('paymongo_payment_id', null)

  if (error) throw error

  if (paymentMethodType) {
    const { error: typeError } = await dbClient
      .from('payment')
      .update({ paymongo_payment_method_type: paymentMethodType })
      .eq(matchColumn, matchValue)
      .is('paymongo_payment_method_type', null)

    if (typeError) throw typeError
  }
}

type PayoutStatus = 'completed' | 'failed'

// FIX 3 — payout settlement. Idempotent: only pending/processing rows move,
// so a settled payout (completed/failed) is never downgraded by a duplicate
// or late event. Failed payouts requeue their payments for the next run —
// the 3-attempt cap (payment.payout_attempts) still applies.
async function settlePayout(transferId: string, status: PayoutStatus, failureReason?: string): Promise<void> {
  const { data: payout, error } = await dbClient
    .from('payout')
    .update({
      status,
      ...(status === 'completed' ? { completed_at: new Date().toISOString() } : {}),
      ...(failureReason ? { failure_reason: failureReason } : {}),
    })
    .eq('paymongo_transfer_id', transferId)
    .in('status', ['pending', 'processing'])
    .select('id')
    .maybeSingle()

  if (error) throw error
  if (!payout) return

  if (status === 'failed') {
    // Requeue: the payments become claimable by the next process-payouts run.
    await dbClient.from('payment').update({ payout_id: null }).eq('payout_id', payout.id)
  }
}

// payment.refund.updated carries the authoritative status on the resource;
// payment.refunded is terminal success.
function refundStatusFor(event: ParsedEvent): string | null {
  if (event.type === 'payment.refunded') return 'succeeded'
  if (event.type === 'payment.refund.updated') {
    return ['pending', 'processing', 'succeeded', 'failed'].includes(event.resourceStatus ?? '')
      ? event.resourceStatus!
      : null
  }
  return null
}

// Idempotent: succeeded/failed refunds are terminal — never downgraded.
// Returns whether a refund row was matched, so unmatched events can be
// inspected (payload shape is verified against real deliveries).
async function settleRefund(refundId: string, status: string, failureReason?: string): Promise<boolean> {
  const { data, error } = await dbClient
    .from('refund')
    .update({
      status,
      ...(status === 'succeeded' ? { completed_at: new Date().toISOString() } : {}),
      ...(failureReason ? { failure_reason: failureReason } : {}),
    })
    .eq('paymongo_refund_id', refundId)
    .in('status', ['pending', 'processing'])
    .select('id')
    .maybeSingle()

  if (error) throw error
  return data !== null
}

Deno.serve(async (req) => {
  try {
    const rawBody = await req.text()
    if (!rawBody) return json({ error: 'Empty body.' }, 400)

    let event: ParsedEvent | null = null
    try {
      event = parseEvent(rawBody)
    } catch {
      return json({ error: 'Invalid JSON.' }, 400)
    }

    if (!event) {
      console.warn('paymongo-webhook: unrecognized payload:', rawBody.slice(0, 200))
      return json({ received: true })
    }

    if (!(await isSignatureValid(rawBody, req.headers.get('Paymongo-Signature'), event.testMode))) {
      return json({ error: 'Invalid signature.' }, 401)
    }

    if (event.type === 'checkout_session.payment.paid') {
      let updated = await markPaymentPaid('paymongo_session_id', event.resourceId)
      // Some session events identify the row by reference number instead.
      if (!updated && event.referenceNumber) {
        updated = await markPaymentPaid('reference_id', event.referenceNumber)
      }
      await capturePaymentMetadata('paymongo_session_id', event.resourceId, event.paymentId, event.paymentMethodType)
    } else if (event.type === 'payment.paid') {
      // Card rows are matched by intent id (the payment resource carries
      // payment_intent_id). E-wallet payments also emit this event but their
      // rows are settled by the session event above; the intent match no-ops.
      let updated = false
      if (event.paymentIntentId) {
        updated = await markPaymentPaid('paymongo_intent_id', event.paymentIntentId)
        await capturePaymentMetadata('paymongo_intent_id', event.paymentIntentId, event.paymentId, event.paymentMethodType)
      }
      if (!updated && event.paymentId) {
        await markPaymentPaid('paymongo_payment_id', event.paymentId)
      }
    } else if (event.type === 'transfer.outward.successful') {
      await settlePayout(event.transferId ?? event.resourceId, 'completed')
    } else if (event.type === 'transfer.outward.failed') {
      await settlePayout(
        event.transferId ?? event.resourceId,
        'failed',
        event.failureReason ?? 'Transfer failed.'
      )
    } else {
      const refundStatus = refundStatusFor(event)
      if (refundStatus) {
        const matched = await settleRefund(event.resourceId, refundStatus, event.failureReason)
        if (!matched) {
          // No row matched: log the full payload so extraction can be verified
          // against a real refund delivery.
          console.warn('paymongo-webhook: unmatched refund event:', rawBody)
        }
      }
    }

    // Acknowledge every verified event — including unknown types — so PayMongo
    // does not retry deliveries we cannot act on.
    return json({ received: true })
  } catch (err) {
    console.error('paymongo-webhook:', err)
    return json({ error: 'Unexpected error.' }, 500)
  }
})