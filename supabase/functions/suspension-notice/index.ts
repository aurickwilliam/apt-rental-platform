import { createClient } from 'jsr:@supabase/supabase-js@2';

const url = Deno.env.get('SUPABASE_URL') ?? '';
const anonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? '';
const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
const headers = { 'Content-Type': 'application/json' };
const respond = (body: Record<string, unknown>, status = 200) =>
  new Response(JSON.stringify(body), { status, headers });

const MAX_EMAIL_LENGTH = 320;
const MAX_PASSWORD_LENGTH = 256;

interface NoticeRequest {
  email: string;
  password: string;
}

// Returns the suspension reason only to someone who proves the password of a
// banned account, so it cannot be used to look up other people's accounts.
Deno.serve(async (request) => {
  if (request.method !== 'POST') return respond({ error: 'Method not allowed.' }, 405);
  if (!url || !anonKey || !serviceKey) return respond({ error: 'Unavailable.' }, 500);

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return respond({ error: 'Invalid request.' }, 400);
  }
  const input = payload as Partial<NoticeRequest> | null;
  if (
    !input || typeof input.email !== 'string' || typeof input.password !== 'string' ||
    input.email.length === 0 || input.email.length > MAX_EMAIL_LENGTH ||
    input.password.length === 0 || input.password.length > MAX_PASSWORD_LENGTH
  ) {
    return respond({ error: 'Invalid request.' }, 400);
  }

  const anonClient = createClient(url, anonKey, { auth: { persistSession: false } });
  const { data, error } = await anonClient.auth.signInWithPassword({
    email: input.email.trim(),
    password: input.password,
  });

  if (!error) {
    // Not suspended; discard the session this check created.
    if (data.session) await anonClient.auth.signOut();
    return respond({ suspended: false });
  }
  if (error.code !== 'user_banned') return respond({ suspended: false });

  const adminClient = createClient(url, serviceKey, { auth: { persistSession: false } });
  const { data: profile, error: profileError } = await adminClient.from('users')
    .select('is_suspended, suspension_reason, suspended_at')
    .ilike('email', input.email.trim()).maybeSingle();
  if (profileError || !profile?.is_suspended) return respond({ suspended: true, reason: null });

  return respond({
    suspended: true,
    reason: profile.suspension_reason,
    suspendedAt: profile.suspended_at,
  });
});
