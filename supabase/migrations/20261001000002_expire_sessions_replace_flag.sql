-- Allow QR regeneration to retire a still-live session.
--
-- expire_own_verification_sessions() only swept past-expiry rows. The desktop
-- "Generate new code" path must also retire a live session (its raw token is
-- gone, so the old QR can never be shown again). The new optional flag does
-- that; default false preserves the original sweep-only behavior. Clients
-- still have no UPDATE grant -- expiry happens only here, scoped to the
-- caller's own rows.

create or replace function public.expire_own_verification_sessions(p_include_active boolean default false)
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
     and (expires_at <= now() or p_include_active);

  get diagnostics v_count = row_count;
  return v_count;
end;
$$;

revoke all on function public.expire_own_verification_sessions(boolean) from public, anon;
grant execute on function public.expire_own_verification_sessions(boolean) to authenticated;
