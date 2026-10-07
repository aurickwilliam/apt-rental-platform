-- A suspended user's own row is hidden by the "Active accounts only" policy, so
-- the app cannot read the reason directly. This returns only the caller's own
-- suspension state (never anyone else's), so a still-signed-in device can show
-- the notice before signing out.
create or replace function public.get_my_suspension_status()
returns jsonb language sql stable security definer set search_path = '' as $$
  select coalesce(
    (select jsonb_build_object('suspended', u.is_suspended, 'reason', u.suspension_reason)
     from public.users u where u.user_id = (select auth.uid())),
    jsonb_build_object('suspended', false, 'reason', null)
  );
$$;
revoke all on function public.get_my_suspension_status() from public, anon;
grant execute on function public.get_my_suspension_status() to authenticated;
