-- Phase 2 admin functions were written against the scalar users.role column,
-- which 20260927000003 dropped. Re-create the two that still referenced it so
-- they authorize from users.roles[] (analytics and listing visibility were
-- already moved by 20260928*).

create or replace function app_private.can_view_hidden_apartment(p_apartment_id uuid, p_landlord_id uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.users u where u.user_id = auth.uid()
      and not u.is_suspended and (
        'admin' = any(u.roles) or u.id = p_landlord_id
        or exists (select 1 from public.tenancies t
          where t.apartment_id = p_apartment_id and t.tenant_id = u.id)
      )
  );
$$;

create or replace function public.admin_set_user_access(
  p_actor_auth_id uuid, p_target_id uuid, p_suspend boolean, p_reason text
) returns uuid language plpgsql security definer set search_path = '' as $$
declare v_admin_id uuid; v_target public.users%rowtype;
begin
  if current_setting('request.jwt.claim.role', true) is distinct from 'service_role' then
    raise exception 'Service role required.';
  end if;
  if p_reason is null or length(btrim(p_reason)) < 3 or length(p_reason) > 500 then
    raise exception 'A reason between 3 and 500 characters is required.';
  end if;
  select id into v_admin_id from public.users
    where user_id = p_actor_auth_id and 'admin' = any(roles) and not is_suspended;
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
  -- Revoke refreshable sessions. Already issued JWTs remain valid until exp;
  -- the restrictive RLS policies deny those tokens protected data.
  if p_suspend then
    delete from auth.sessions where user_id = v_target.user_id;
  end if;
  return v_target.user_id;
end;
$$;
revoke all on function public.admin_set_user_access(uuid, uuid, boolean, text)
  from public, anon, authenticated;
grant execute on function public.admin_set_user_access(uuid, uuid, boolean, text)
  to service_role;
