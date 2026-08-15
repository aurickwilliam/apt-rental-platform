// Push delivery for in-app notifications.
//
// Called from the DB via pg_net inside create_notification() (see
// supabase/migrations/20260814000000_create_notifications.sql). Body carries
// everything the push needs; the DB is the source of truth for tokens.
//
// verify_jwt is disabled for this function (same tradeoff as
// delete-application-documents): pg_net cannot sign requests, and the body is
// trigger-generated, not client-controlled. Abuse potential is limited to
// sending Expo pushes for arbitrary user_ids, so no PII is accepted here.
//
// Delivery flow:
//   1. Look up the user's Expo push tokens (service role, bypasses RLS).
//   2. POST one batched send to the Expo Push API (max 100 tickets/request).
//   3. Poll push receipts and delete tokens reported DeviceNotRegistered so
//      stale devices stop receiving pushes.
//
// Secrets (supabase secrets set ...):
//   EXPO_ACCESS_TOKEN  - optional Expo account token for higher rate limits.

import { createClient } from 'jsr:@supabase/supabase-js@2'

const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send'
const EXPO_RECEIPTS_URL = 'https://exp.host/--/api/v2/push/getReceipts'
const MAX_TOKENS_PER_REQUEST = 100

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
)

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })

async function fetchTokens(userId: string): Promise<{ token: string; platform: string }[]> {
  const { data, error } = await supabase
    .from('push_tokens')
    .select('token, platform')
    .eq('user_id', userId)

  if (error) {
    console.error('Failed to fetch push tokens:', error.message)
    return []
  }

  return data ?? []
}

const PREFERENCE_COLUMNS = [
  'notifications_enabled',
  'payment',
  'message',
  'maintenance',
  'apartment',
  'system',
] as const

type PreferenceRow = {
  [K in (typeof PREFERENCE_COLUMNS)[number]]: boolean
}

// Delivery preferences; a missing row means everything is enabled.
async function fetchPreferences(userId: string): Promise<PreferenceRow> {
  const { data, error } = await supabase
    .from('notification_preferences')
    .select(PREFERENCE_COLUMNS.join(', '))
    .eq('user_id', userId)
    .maybeSingle()

  if (error) {
    console.error('Failed to fetch notification preferences:', error.message)
    return { notifications_enabled: true, payment: true, message: true, maintenance: true, apartment: true, system: true }
  }

  return data ?? { notifications_enabled: true, payment: true, message: true, maintenance: true, apartment: true, system: true }
}

// Returns false when the user has disabled delivery entirely or for this type.
function shouldDeliver(prefs: PreferenceRow, type: unknown): boolean {
  if (!prefs.notifications_enabled) return false
  if (typeof type !== 'string') return true
  return prefs[type as keyof PreferenceRow] !== false
}

async function deleteTokens(tokens: string[]): Promise<void> {
  if (tokens.length === 0) return
  const { error } = await supabase.from('push_tokens').delete().in('token', tokens)
  if (error) {
    console.error('Failed to delete stale push tokens:', error.message)
  }
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405)

  const body = await req.json().catch(() => null)
  if (!body?.user_id || !body?.title) {
    return json({ error: 'user_id and title are required' }, 400)
  }

  const tokens = await fetchTokens(String(body.user_id))
  if (tokens.length === 0) return json({ skipped: true, reason: 'no push tokens' })

  const prefs = await fetchPreferences(String(body.user_id))
  if (!shouldDeliver(prefs, body.type)) {
    return json({ skipped: true, reason: 'notifications disabled by preference' })
  }

  const messages = tokens.slice(0, MAX_TOKENS_PER_REQUEST).map((t) => ({
    to: t.token,
    title: String(body.title),
    body: body.message ? String(body.message) : undefined,
    // notificationId lets the client mark the feed row read when the push is
    // tapped, keeping the in-app unread badge accurate.
    data: { ...(body.data ?? {}), notificationId: body.notification_id ?? null },
    channelId: 'default',
    sound: 'default',
  }))

  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  const accessToken = Deno.env.get('EXPO_ACCESS_TOKEN')
  if (accessToken) headers.Authorization = `Bearer ${accessToken}`

  const sendRes = await fetch(EXPO_PUSH_URL, {
    method: 'POST',
    headers,
    body: JSON.stringify(messages),
  })

  const sendResult = await sendRes.json().catch(() => null)
  if (!sendRes.ok || !sendResult) {
    console.error('Expo push send failed:', sendRes.status, JSON.stringify(sendResult))
    return json({ error: 'push send failed' }, 502)
  }

  const ticketIds: string[] = []
  for (const ticket of sendResult.data ?? []) {
    if (ticket.status === 'ok' && ticket.id) {
      ticketIds.push(ticket.id)
    } else if (ticket.status === 'error' && ticket.details?.error === 'DeviceNotRegistered') {
      await deleteTokens([ticket.details.device])
    }
  }

  if (ticketIds.length === 0) return json({ sent: sendResult.data?.length ?? 0 })

  const receiptsRes = await fetch(EXPO_RECEIPTS_URL, {
    method: 'POST',
    headers,
    body: JSON.stringify({ ids: ticketIds }),
  })
  const receiptsResult = await receiptsRes.json().catch(() => null)
  if (receiptsRes.ok && receiptsResult) {
    const staleTokens: string[] = []
    for (const receipt of Object.values(receiptsResult.data ?? {})) {
      if ((receipt as { status?: string }).status === 'error' &&
          (receipt as { details?: { error?: string } }).details?.error === 'DeviceNotRegistered') {
        staleTokens.push((receipt as { details?: { device?: string } }).details?.device ?? '')
      }
    }
    await deleteTokens(staleTokens.filter(Boolean))
  }

  return json({ sent: messages.length })
})
