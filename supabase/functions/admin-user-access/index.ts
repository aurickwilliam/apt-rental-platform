import { createClient } from 'jsr:@supabase/supabase-js@2';

const url = Deno.env.get('SUPABASE_URL') ?? '';
const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
const headers = { 'Content-Type': 'application/json' };
const respond = (message: string, status: number) =>
  new Response(JSON.stringify({ error: message }), { status, headers });

interface AccessRequest {
  targetId: string;
  suspend: boolean;
  reason: string;
}

Deno.serve(async (request) => {
  if (request.method !== 'POST') return respond('Method not allowed.', 405);
  const bearer = request.headers.get('authorization');
  if (!bearer?.startsWith('Bearer ') || !url || !serviceKey) return respond('Unauthorized.', 401);
  const adminClient = createClient(url, serviceKey, { auth: { persistSession: false } });

  const { data: { user }, error: authError } = await adminClient.auth.getUser(bearer.slice(7));
  if (authError || !user) return respond('Unauthorized.', 401);

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return respond('Invalid request.', 400);
  }
  if (payload === null || typeof payload !== 'object') return respond('Invalid request.', 400);
  const input = payload as AccessRequest;
  if (
    typeof input.targetId !== 'string' ||
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      input.targetId,
    ) ||
    typeof input.suspend !== 'boolean' || typeof input.reason !== 'string' ||
    input.reason.trim().length < 3 || input.reason.length > 500
  ) {
    return respond('Invalid account or reason.', 400);
  }

  const { data: actor, error: actorError } = await adminClient.from('users')
    .select('id, role, is_suspended').eq('user_id', user.id).single();
  if (actorError || actor?.role !== 'admin' || actor.is_suspended) {
    return respond('Forbidden.', 403);
  }

  const { data: target, error: targetError } = await adminClient.from('users')
    .select('id, user_id, role, is_suspended').eq('id', input.targetId).single();
  if (
    targetError || !target || target.id === actor.id ||
    !['tenant', 'landlord'].includes(target.role) || target.is_suspended === input.suspend
  ) {
    return respond('Invalid account access transition.', 409);
  }

  // Auth is changed first. If the atomic database state+audit transition fails,
  // undo the ban; database-side access remains unchanged in the meantime.
  const { error: banError } = await adminClient.auth.admin.updateUserById(
    target.user_id,
    { ban_duration: input.suspend ? '876000h' : 'none' },
  );
  if (banError) {
    console.error('Admin Auth access update failed', banError);
    return respond('Unable to update account access.', 502);
  }

  const { error: updateError } = await adminClient.rpc('admin_set_user_access', {
    p_actor_auth_id: user.id,
    p_target_id: target.id,
    p_suspend: input.suspend,
    p_reason: input.reason.trim(),
  });
  if (updateError) {
    console.error('Admin access transaction failed', updateError);
    const { data: current, error: currentError } = await adminClient.from('users')
      .select('is_suspended').eq('id', target.id).single();
    if (currentError || current?.is_suspended === input.suspend) {
      // Another admin may have completed the same transition concurrently.
      // Reversing Auth here would undo their successful operation.
      console.error('Account state requires reconciliation', currentError ?? updateError);
      return respond(
        'Account state changed concurrently. Refresh and verify access with an operator.',
        409,
      );
    }
    const { error: rollbackError } = await adminClient.auth.admin.updateUserById(
      target.user_id,
      { ban_duration: input.suspend ? 'none' : '876000h' },
    );
    if (rollbackError) console.error('Admin Auth compensation failed', rollbackError);
    return respond(
      'Account update could not be completed. Contact an operator if access remains inconsistent.',
      409,
    );
  }

  return new Response(JSON.stringify({ ok: true }), { headers });
});
