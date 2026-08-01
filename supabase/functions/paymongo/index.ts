// PayMongo proxy Edge Function (mock-ready)
//
// All PayMongo API calls are proxied through this function so the secret key
// never reaches the mobile client. Invoked from the app via:
//   supabase.functions.invoke('paymongo', { body: { action, ...payload } })
//
// MOCK MODE
// Until PAYMONGO_SECRET_KEY is set the function returns PayMongo-shaped mock
// responses so the client flow can be developed and tested end-to-end:
//   - E-wallet (checkout session) status is derived from the reference id:
//       ends with "-fail"    -> failed
//       ends with "-expired" -> expired
//       otherwise            -> paid
//   - Card payments mirror PayMongo test-card behavior: card numbers ending in
//     "0002" are declined, everything else succeeds.
// Errors are returned in PayMongo's real shape ({ errors: [{ detail }] }) so
// client-side reason parsing stays identical in production.
//
// GOING LIVE (TODO)
//   1. supabase secrets set PAYMONGO_SECRET_KEY=sk_test_...
//   2. Replace each "TODO: Real PayMongo call" block below with the documented
//      fetch to https://api.paymongo.com/v1/...
//   3. supabase functions deploy paymongo
//
// ACTIONS
//   createCheckoutSession     - GCash/Maya hosted checkout (returns checkout_url)
//   getCheckoutSessionStatus  - authoritative payment status (backend is source of truth)
//   createCardPayment         - tokenize card, create payment intent, attach, confirm
//
// Future actions (refunds, webhooks, recurring payments, payment verification)
// are added as new cases in the dispatch switch below without restructuring.

const PAYMONGO_API = 'https://api.paymongo.com/v1'

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

// TODO: Mock store — remove once real credentials are available. In production
// the reference id (client-generated) maps to a PayMongo checkout session id
// that must be persisted (e.g. a payments table) so status can be looked up.
const mockSessions = new Map<string, { id: string; status: CheckoutSessionStatus }>()

// TODO: Mock — remove once PAYMONGO_SECRET_KEY is set.
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
}

function createCheckoutSession(payload: CheckoutSessionPayload) {
  const { referenceId, amount, redirectBaseUrl } = payload

  if (!referenceId || !amount || !redirectBaseUrl) {
    return badRequest('referenceId, amount, and redirectBaseUrl are required.')
  }

  const secretKey = Deno.env.get('PAYMONGO_SECRET_KEY')
  if (!secretKey) {
    // TODO: Mock — remove once PAYMONGO_SECRET_KEY is set.
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

  // TODO: Real PayMongo call:
  // POST ${PAYMONGO_API}/checkout_sessions with Authorization: Basic base64(secretKey)
  // body: {
  //   data: {
  //     attributes: {
  //       billing: { name: 'APT Tenant' },
  //       line_items: [{ currency: 'PHP', amount: Math.round(amount * 100), name: description, quantity: 1 }],
  //       payment_method_types: ['gcash', 'maya'],
  //       success_url: `${redirectBaseUrl}?sessionId=${referenceId}`,
  //       failed_url: `${redirectBaseUrl}?sessionId=${referenceId}`,
  //     },
  //   },
  // }
  // Note: the deep link carries ONLY the reference id — never a payment outcome.
  // Persist referenceId -> returned session.id, then respond with session.id and
  // session.checkout_url.
  throw new Error('PAYMONGO_SECRET_KEY is set but the real checkout session call is not implemented yet.')
}

function getCheckoutSessionStatus({ sessionId }: { sessionId: string }) {
  if (!sessionId) return badRequest('sessionId is required.')

  const secretKey = Deno.env.get('PAYMONGO_SECRET_KEY')
  if (!secretKey) {
    // TODO: Mock — remove once PAYMONGO_SECRET_KEY is set.
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

  // TODO: Real PayMongo call:
  // GET ${PAYMONGO_API}/checkout_sessions/{sessionId} (lookup sessionId via the
  // persisted referenceId -> session mapping), then map the returned
  // attributes.status: paid -> paid | failed|cancelled -> failed |
  // expired -> expired | awaiting_* -> pending.
  throw new Error('PAYMONGO_SECRET_KEY is set but the real session status call is not implemented yet.')
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
}

function createCardPayment(payload: CardPaymentPayload) {
  const { referenceId, card } = payload

  if (!referenceId || !card?.number || !card?.expMonth || !card?.expYear || !card?.cvc) {
    return badRequest('referenceId and complete card details are required.')
  }

  const secretKey = Deno.env.get('PAYMONGO_SECRET_KEY')
  if (!secretKey) {
    // TODO: Mock — remove once PAYMONGO_SECRET_KEY is set.
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

  // TODO: Real PayMongo calls (all with Authorization: Basic base64(secretKey)):
  // 1. POST ${PAYMONGO_API}/tokens
  //    body: { data: { attributes: { number, exp_month: card.expMonth,
  //            exp_year: card.expYear, cvc: card.cvc, name: card.name } } }
  // 2. POST ${PAYMONGO_API}/payment_intents
  //    body: { data: { attributes: { amount: Math.round(amount * 100),
  //            currency: 'PHP', description, payment_method_allowed: ['card'],
  //            capture_type: 'automatic' } } }
  // 3. POST ${PAYMONGO_API}/payment_intents/{intentId}/attach
  //    body: { data: { attributes: { payment_method: token.id } } }
  // 4. GET ${PAYMONGO_API}/payment_intents/{intentId} -> attributes.status
  //    succeeded -> succeeded | failed -> failed (use attributes.last_payment_error
  //    or a generic decline message) | awaiting_next_action -> 3DS redirect flow (TBD).
  throw new Error('PAYMONGO_SECRET_KEY is set but the real card payment call is not implemented yet.')
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { action, ...payload } = await req.json()

    switch (action) {
      case 'createCheckoutSession':
        return createCheckoutSession(payload)
      case 'getCheckoutSessionStatus':
        return getCheckoutSessionStatus(payload)
      case 'createCardPayment':
        return createCardPayment(payload)
      default:
        return badRequest(`Unknown action: ${action}`)
    }
  } catch (err) {
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
