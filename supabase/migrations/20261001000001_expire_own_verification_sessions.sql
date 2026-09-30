-- Lazily expire the caller's stale QR verification sessions.
--
-- Rows past expires_at keep status 'active' (nothing flips them), which would
-- trip the one-active-session-per-user unique index forever and block QR
-- regeneration. The create-session flow calls this first; clients have no
-- UPDATE grant, so expiry happens only through this SECURITY DEFINER function
-- scoped to the caller's own rows.

create or replace function public.expire_own_verification_sessions()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid;
  v_count integer;
begin
  select id into v_user_id
  from public.users
  where user_id = auth.uid();

  if v_user_id is null then
    raise exception 'Not authenticated.';
  end if;

  update public.verification_sessions
     set status = 'expired',
         updated_at = now()
   where user_id = v_user_id
     and status = 'active'
     and expires_at <= now();

  get diagnostics v_count = row_count;
  return v_count;
end;
$$;

revoke all on function public.expire_own_verification_sessions() from public, anon;
grant execute on function public.expire_own_verification_sessions() to authenticated;
