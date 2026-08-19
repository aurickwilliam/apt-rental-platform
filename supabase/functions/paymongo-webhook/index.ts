// PayMongo webhook handler
//
// Receives PayMongo events (checkout_session.payment.paid, payment.paid) and
// marks the matching payment row as paid via the service role. The tenant-side
// notifications fire automatically from the notify_payment_created trigger.
//
// Registration (dashboard): Developers -> Webhooks -> Add endpoint
//   URL:    https://<project-ref>.supabase.co/functions/v1/paymongo-webhook
//   Events: checkout_session.payment.paid, payment.paid
// Then set PAYMONGO_WEBHOOK_SECRET to the endpoint's signing secret
// (supabase secrets set PAYMONGO_WEBHOOK_SECRET=<secret>).
//
// Event mapping:
//   - checkout_session.payment.paid  -> row matched by paymongo_session_id
//     (fallback: reference_id from the session's reference_number)
//   - payment.paid                   -> row matched by paymongo_intent_id
//     (the payment resource carries payment_intent_id)
//
// Security:
//   - Requests are rejected unless the Paymongo-Signature header verifies:
//     HMAC-SHA256 over "<timestamp>.<raw body>", timing-safe comparison.
//     Test-mode events sign with te, live-mode with li.
//   - Fails closed while PAYMONGO_WEBHOOK_SECRET is unset.
//   - Replays are rejected beyond a small timestamp tolerance.
//   - Updates are idempotent: paid/partial rows are never downgraded.
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
}

// PayMongo event envelopes vary by endpoint. The current shape is:
//   { data: { type: 'event', attributes: { type, livemode, data: {...resource} } } }
// Some endpoints emit the resource directly on data:
//   { data: { id, type, attributes: {...} } }
// Both are handled defensively.
function parseEvent(rawBody: string): ParsedEvent | null {
  const body = JSON.parse(rawBody) as {
    data?: {
      id?: string
      type?: string
      attributes?: {
        type?: string
        livemode?: boolean
        data?: { id?: string; attributes?: { reference_number?: string; payment_intent_id?: string } }
      }
    }
  }

  const data = body.data
  const attributes = data?.attributes
  const type = attributes?.type ?? data?.type
  if (!type) return null

  const resource = (attributes?.data ?? attributes ?? null) as {
    id?: string
    attributes?: { reference_number?: string; payment_intent_id?: string }
  } | null
  const resourceId = resource?.id ?? data?.id
  if (!resourceId) return null

  return {
    type,
    testMode: !(attributes?.livemode ?? false),
    resourceId,
    referenceNumber: resource?.attributes?.reference_number,
    paymentIntentId: resource?.attributes?.payment_intent_id,
  }
}

// Idempotent: only pending/unpaid rows flip to paid; paid/partial rows stay.
async function markPaymentPaid(column: 'paymongo_session_id' | 'paymongo_intent_id' | 'reference_id', value: string): Promise<boolean> {
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
      const updated = await markPaymentPaid('paymongo_session_id', event.resourceId)
      // Some session events identify the row by reference number instead.
      if (!updated && event.referenceNumber) {
        await markPaymentPaid('reference_id', event.referenceNumber)
      }
    } else if (event.type === 'payment.paid') {
      // The payment resource carries the payment_intent_id of the intent that
      // produced it — matches the card flow rows we persist on success.
      if (event.paymentIntentId) {
        await markPaymentPaid('paymongo_intent_id', event.paymentIntentId)
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
