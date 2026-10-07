-- Suspension is enforced by public.users.is_suspended (RLS "Active accounts only",
-- app guards), not by a Supabase Auth ban. A suspended user can authenticate,
-- which lets every client identify them and show the reason.

-- 1. Lift Auth bans previously set by the old edge-function flow.
update auth.users
set banned_until = null
where banned_until is not null
  and id in (select user_id from public.users where is_suspended);

-- 2. Admins suspend/reactivate directly through the database; there is no Auth
-- API call left, so the service-role edge function is no longer needed.
drop function if exists public.admin_set_user_access(uuid, uuid, boolean, text);

create or replace function public.admin_set_user_access(
  p_target_id uuid, p_suspend boolean, p_reason text
) returns void language plpgsql security definer set search_path = '' as $$
declare v_admin_id uuid; v_target public.users%rowtype;
begin
  if p_reason is null or length(btrim(p_reason)) < 3 or length(p_reason) > 500 then
    raise exception 'A reason between 3 and 500 characters is required.';
  end if;
  select id into v_admin_id from public.users
    where user_id = (select auth.uid()) and 'admin' = any(roles) and not is_suspended;
  if v_admin_id is null then raise exception 'Admin access required.'; end if;
  select * into v_target from public.users where id = p_target_id for update;
  -- Only tenant/landlord profiles may be suspended; any admin role is off limits.
  if not found or 'admin' = any(v_target.roles)
      or not (v_target.roles && array['tenant', 'landlord'])
      or v_target.id = v_admin_id or v_target.is_suspended = p_suspend then
    raise exception 'Invalid account access transition.';
  end if;

  update public.users set is_suspended = p_suspend,
    suspended_at = case when p_suspend then now() else null end,
    suspended_by = case when p_suspend then v_admin_id else null end,
    suspension_reason = case when p_suspend then btrim(p_reason) else null end,
    updated_at = now()
  where id = p_target_id;
  insert into public.admin_audit_logs(admin_id, action, target_type, target_id, reason)
  values(v_admin_id, case when p_suspend then 'USER_SUSPENDED' else 'USER_REACTIVATED' end,
    'user', p_target_id, btrim(p_reason));
  -- Force a fresh sign-in so every device sees the suspension notice. Already
  -- issued tokens are denied protected data by the restrictive RLS policies.
  if p_suspend then
    delete from auth.sessions where user_id = v_target.user_id;
  end if;
end;
$$;
revoke all on function public.admin_set_user_access(uuid, boolean, text) from public, anon;
grant execute on function public.admin_set_user_access(uuid, boolean, text) to authenticated;

-- 3. Suspended recipients keep their feed rows but no longer get push messages.
do $$
declare v_definition text := pg_get_functiondef('public.create_notification(uuid,text,text,text,jsonb)'::regprocedure);
  v_anchor text := E'  returning id into v_id;\n';
begin
  if position('is_suspended' in v_definition) = 0 then
    if position(v_anchor in v_definition) = 0 then
      raise exception 'create_notification changed; audit before migrating.';
    end if;
    execute replace(v_definition, v_anchor, v_anchor ||
      E'\n  if exists (select 1 from public.users u where u.id = p_user_id and u.is_suspended) then\n    return v_id;\n  end if;\n');
  end if;
end;
$$;
