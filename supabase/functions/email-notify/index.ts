// Moderation emails (listing hidden, account suspended, warning, report reviewed).
//
// Called from the DB via pg_net by app_private.queue_email(), which first
// writes a row to public.email_outbox. The request carries only that row's id:
// recipient, template and params all come from the DB, so a caller cannot make
// this function send arbitrary content or mail arbitrary addresses. A row is
// claimed (attempts + 1) before sending and is sent at most once.
//
// verify_jwt is disabled (pg_net cannot sign requests), same as push-notify.
//
// Secrets (supabase secrets set ...):
//   BREVO_API_KEY  - Brevo transactional email API key (v3)
//   EMAIL_FROM     - a sender address verified in Brevo
//   EMAIL_FROM_NAME - optional display name (default "APT")
// Without the first two, rows stay queued and are retried by the DB job.

import { createClient } from 'jsr:@supabase/supabase-js@2'

import { EMAIL_TEMPLATES, renderEmail, type EmailTemplate } from './templates.ts'

const BREVO_URL = 'https://api.brevo.com/v3/smtp/email'
const MAX_ATTEMPTS = 3

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
)

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } })

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

Deno.serve(async (req: Request) => {
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405)

  const body = await req.json().catch(() => null)
  const id = body?.id
  if (typeof id !== 'string' || !UUID.test(id)) return json({ error: 'id is required' }, 400)

  const apiKey = Deno.env.get('BREVO_API_KEY')
  const from = Deno.env.get('EMAIL_FROM')
  if (!apiKey || !from) {
    console.error('email-notify: BREVO_API_KEY or EMAIL_FROM is not set; leaving the email queued')
    return json({ skipped: true, reason: 'email provider not configured' })
  }

  // Claim the row: only an unsent row with attempts left, counted before the send.
  const { data: row, error: readError } = await supabase
    .from('email_outbox')
    .select('id, user_id, template, params, attempts')
    .eq('id', id)
    .is('sent_at', null)
    .lt('attempts', MAX_ATTEMPTS)
    .maybeSingle()
  if (readError) {
    console.error('email-notify: failed to read outbox row:', readError.message)
    return json({ error: 'read failed' }, 500)
  }
  if (!row) return json({ skipped: true, reason: 'nothing to send' })

  const { data: claimed } = await supabase
    .from('email_outbox')
    .update({ attempts: row.attempts + 1 })
    .eq('id', id)
    .eq('attempts', row.attempts)
    .is('sent_at', null)
    .select('id')
    .maybeSingle()
  if (!claimed) return json({ skipped: true, reason: 'claimed elsewhere' })

  const fail = async (message: string) => {
    await supabase.from('email_outbox').update({ last_error: message }).eq('id', id)
    return json({ error: message }, 502)
  }

  if (!(EMAIL_TEMPLATES as readonly string[]).includes(row.template)) return fail('unknown template')

  const { data: user } = await supabase.from('users').select('email').eq('id', row.user_id).maybeSingle()
  if (!user?.email) return fail('recipient has no email')

  const email = renderEmail(row.template as EmailTemplate, (row.params ?? {}) as Record<string, unknown>)
  const res = await fetch(BREVO_URL, {
    method: 'POST',
    headers: { 'api-key': apiKey, 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({
      sender: { name: Deno.env.get('EMAIL_FROM_NAME') ?? 'APT', email: from },
      to: [{ email: user.email }],
      subject: email.subject,
      htmlContent: email.html,
      textContent: email.text,
    }),
  })
  if (!res.ok) {
    // Status only: the response body can echo addresses.
    console.error('email-notify: Brevo send failed with status', res.status)
    return fail(`provider status ${res.status}`)
  }

  // The email is out. Record that, retrying once, so the retry job never sends it again.
  const markSent = () =>
    supabase
      .from('email_outbox')
      .update({ sent_at: new Date().toISOString(), last_error: null })
      .eq('id', id)
  let marked = await markSent()
  if (marked.error) marked = await markSent()
  if (marked.error) {
    console.error('email-notify: sent but could not record it:', marked.error.message)
    // Use up the attempts so the retry job cannot send a duplicate.
    await supabase
      .from('email_outbox')
      .update({ attempts: MAX_ATTEMPTS, last_error: 'sent; status not recorded' })
      .eq('id', id)
  }
  return json({ sent: true })
})
