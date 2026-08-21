// Process payouts — daily disbursement runner.
//
// Walks every landlord with claimable paid payments and hands each one to
// create_payout_and_claim (FIX 2 — atomic claim: a concurrent or overlapping
// run can never claim the same payments twice; the losing run rolls back and
// gets zero rows), then submits the aggregated payout to PayMongo
// batch_transfers as a single transfer from the APT wallet to the landlord's
// default payout destination.
//
// Transfer rail (provider) is chosen by net amount: instapay up to ₱50,000,
// PESONet above. The payout's reference_number is carried in the transfer
// description (PayMongo batch_transfers does not guarantee reference_number
// acceptance); our reference is internal anyway — they do not dedupe.
// The source is the APT PayMongo wallet: the wallet account number/name must
// match the wallet provisioned in the PayMongo dashboard, and its BIC is the
// constant PayMongo wallet code (PAEYPHM2XXX).
//
// After a successful submission the payout is 'processing' and the
// transfer.outward.* webhook settles it (completed / failed / returned).
//
// Failure handling:
//   - A batch_transfers POST failure requeues the claimed payments
//     (payout_id = null) and marks the payout 'failed' so the next run picks
//     the payments up again. The per-payment 3-attempt cap still applies —
//     beyond it payments stay in the manual admin-review queue (failed payout
//     rows + payout_run.failures).
//   - One bad landlord never swallows the run: per-landlord try/catch, each
//     failure recorded in payout_run.failures; the loop continues.
//   - Note: a request that fails on OUR side (timeout) may still have been
//     processed by PayMongo; reconciliation happens via the dashboard /
//     getTransferStatus. At-least-once is the accepted tradeoff — PayMongo
//     does not dedupe batches.
//
// Security: verify_jwt=true + explicit service_role check — the daily cron
// (or an admin) must present a service-role JWT. An authenticated user JWT
// is rejected even though it passes the platform's JWT gate.
//
// Mock mode: when PAYMONGO_SECRET_KEY is unset the payout is completed
// directly with a trn_mock_* transfer id (no webhook in local dev).

import { createClient } from 'jsr:@supabase/supabase-js@2'

const MAX_ATTEMPTS = 3
const INSTAPAY_MAX_AMOUNT = 50000
const PAYMONGO_API_V2 = 'https://api.paymongo.com/v2'
const PAYMONGO_WALLET_BIC = 'PAEYPHM2XXX'

const dbClient = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
)

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })

// Decode (not verify) a JWT payload. Signature verification happens at the
// platform gateway (verify_jwt=true); here we only read the claims.
function decodeJwtPayload(token: string): Record<string, unknown> | null {
  const part = token.split('.')[1]
  if (!part) return null
  try {
    const base64 = part.replace(/-/g, '+').replace(/_/g, '/')
    const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, '=')
    return JSON.parse(atob(padded)) as Record<string, unknown>
  } catch {
    return null
  }
}

async function requireServiceRole(req: Request): Promise<void> {
  // The platform gateway already verified the JWT signature (verify_jwt=true);
  // this gate enforces that it is a service-role token specifically — an
  // authenticated user JWT passes the gateway but must be rejected here.
  // The service-role key cannot go through auth.getUser(): it has no `sub`
  // claim, so GoTrue's /user endpoint rejects it (bad_jwt: missing sub claim).
  // The role claim is checked instead of comparing to the env key, which can
  // drift from a key string captured in vault before a rotation.
  const bearer = req.headers.get('Authorization')?.replace(/^Bearer\s+/i, '') ?? ''
  const claims = decodeJwtPayload(bearer)
  if (!claims || claims.role !== 'service_role') {
    throw new Error('Forbidden: service role required.')
  }
}

// Current Philippine rental period — used only for payout reference numbers.
function currentPeriod(): { start: string; end: string } {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Manila',
    year: 'numeric',
    month: '2-digit',
  }).formatToParts(new Date())
  const year = Number(parts.find((p) => p.type === 'year')?.value)
  const month = Number(parts.find((p) => p.type === 'month')?.value)
  const start = new Date(Date.UTC(year, month - 1, 1))
  const end = new Date(Date.UTC(year, month, 0))
  return {
    start: start.toISOString().slice(0, 10),
    end: end.toISOString().slice(0, 10),
  }
}

async function paymongoFetch(path: string, init?: RequestInit): Promise<{ data: any }> {
  const secretKey = Deno.env.get('PAYMONGO_SECRET_KEY') ?? ''
  const response = await fetch(`${PAYMONGO_API_V2}${path}`, {
    ...init,
    headers: {
      Authorization: `Basic ${btoa(`${secretKey}:`)}`,
      'Content-Type': 'application/json',
      ...init?.headers,
    },
  })

  const body = await response.json().catch(() => ({}))
  if (!response.ok) {
    const detail = body?.errors?.[0]?.detail ?? body?.errors?.[0]?.code ?? 'PayMongo request failed.'
    throw new Error(detail)
  }
  return body as { data: any }
}

type Destination = {
  id: string
  type: string
  bic: string
  account_number: string
  account_name: string
}

type ClaimedPayout = {
  payout_id: string
  amount: number
  net_amount: number
  reference_number: string
}

// Requel the claimed payments of a payout that never reached PayMongo.
async function requeuePayout(payoutId: string, reason: string): Promise<void> {
  await dbClient.from('payment').update({ payout_id: null }).eq('payout_id', payoutId)
  await dbClient.from('payout').update({ status: 'failed', failure_reason: reason }).eq('id', payoutId)
}

// Mock: complete directly — no webhook exists in local dev.
async function mockCompletePayout(payout: ClaimedPayout): Promise<void> {
  await dbClient
    .from('payout')
    .update({
      status: 'completed',
      paymongo_transfer_id: `trn_mock_${payout.payout_id}`,
      completed_at: new Date().toISOString(),
    })
    .eq('id', payout.payout_id)
}

// Current PayMongo v2 batch_transfers shape: a flat transfers[] array; the
// source_account must match the merchant's provisioned wallet (its BIC is the
// constant PAYMONGO_WALLET_BIC), the destination is the landlord's payout
// destination. The response carries the batch id on data.id and each transfer
// on data.transfers[].id.
async function submitBatchTransfer(destination: Destination, payout: ClaimedPayout): Promise<{ batchId: string; transferId: string }> {
  const provider = Number(payout.net_amount) <= INSTAPAY_MAX_AMOUNT ? 'instapay' : 'pesonet'

  const { data: batch } = await paymongoFetch('/batch_transfers', {
    method: 'POST',
    body: JSON.stringify({
      transfers: [
        {
          amount: Math.round(Number(payout.net_amount) * 100),
          currency: 'PHP',
          description: payout.reference_number,
          provider,
          source_account: {
            number: Deno.env.get('APT_WALLET_ACCOUNT_NUMBER') ?? '',
            name: Deno.env.get('APT_WALLET_ACCOUNT_NAME') ?? '',
            bic: PAYMONGO_WALLET_BIC,
          },
          destination_account: {
            number: destination.account_number,
            name: destination.account_name,
            bic: destination.bic,
          },
        },
      ],
    }),
  })

  const firstTransfer = Array.isArray(batch.transfers) ? batch.transfers[0] : undefined
  const transferId = (firstTransfer as { id?: string } | undefined)?.id ?? batch.id
  return { batchId: batch.id, transferId }
}

Deno.serve(async (req) => {
  try {
    if (req.method !== 'POST') return json({ error: 'Method not allowed.' }, 405)

    await requireServiceRole(req)

    const payload = await req.json().catch(() => ({}))
    const { landlordId } = payload as { landlordId?: string }
    const period = currentPeriod()

    const { data: run, error: runError } = await dbClient
      .from('payout_run')
      .insert({})
      .select('id')
      .single()
    if (runError) throw runError
    const runId = run.id

    let query = dbClient
      .from('payment')
      .select('landlord_id')
      .eq('status', 'paid')
      .is('payout_id', null)
      .lte('payout_eligible_at', new Date().toISOString())
      .lt('payout_attempts', MAX_ATTEMPTS)
      .in('method', ['gcash', 'maya', 'card'])
      .not('landlord_id', 'is', null)
    if (landlordId) query = query.eq('landlord_id', landlordId)

    const { data: rows } = await query
    const landlordIds = [...new Set((rows ?? []).map((row) => row.landlord_id))]

    let landlordsProcessed = 0
    let payoutsCreated = 0
    const failures: { landlordId: string | null; error: string }[] = []

    for (const landlord of landlordIds) {
      try {
        const { data: destination, error: destError } = await dbClient
          .from('payout_destination')
          .select('id, type, bic, account_number, account_name')
          .eq('user_id', landlord)
          .eq('is_default', true)
          .eq('status', 'active')
          .limit(1)
          .maybeSingle()
        if (destError) throw destError
        if (!destination) {
          failures.push({ landlordId: landlord, error: 'No active default payout destination.' })
          continue
        }

        const { data: claimed, error: rpcError } = await dbClient.rpc('create_payout_and_claim', {
          p_landlord_id: landlord,
          p_destination_id: destination.id,
          p_period_start: period.start,
          p_period_end: period.end,
          p_max_attempts: MAX_ATTEMPTS,
        })
        if (rpcError) throw rpcError

        // Empty result = claim below min_payout_amount — rolled back inside the RPC.
        const payout = (claimed ?? [])[0] as ClaimedPayout | undefined
        if (!payout) {
          landlordsProcessed++
          continue
        }

        if (Deno.env.get('PAYMONGO_SECRET_KEY')) {
          const { batchId, transferId } = await submitBatchTransfer(destination, payout)
          await dbClient
            .from('payout')
            .update({
              status: 'processing',
              paymongo_batch_id: batchId,
              paymongo_transfer_id: transferId,
            })
            .eq('id', payout.payout_id)
        } else {
          await mockCompletePayout(payout)
        }

        landlordsProcessed++
        payoutsCreated++
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error.'
        console.error('process-payouts landlord', landlord, err)
        failures.push({ landlordId: landlord, error: message })

        // The claim is real but the batch never went out — release the
        // payments back to the pool for the next run (attempt cap applies).
        const { data: pending, error: pendError } = await dbClient
          .from('payout')
          .select('id')
          .eq('user_id', landlord)
          .eq('status', 'pending')
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle()
        if (!pendError && pending) {
          await requeuePayout(pending.id, message)
        }
      }
    }

    const { error: finishError } = await dbClient
      .from('payout_run')
      .update({
        finished_at: new Date().toISOString(),
        landlords_processed: landlordsProcessed,
        payouts_created: payoutsCreated,
        failures,
      })
      .eq('id', runId)
    if (finishError) throw finishError

    return json({
      runId,
      period,
      landlords_processed: landlordsProcessed,
      payouts_created: payoutsCreated,
      failures,
    })
  } catch (err) {
    console.error('process-payouts:', err)
    return json({ error: err instanceof Error ? err.message : 'Unexpected error.' }, 500)
  }
})
