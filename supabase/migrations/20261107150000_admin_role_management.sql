-- Admins can give and remove admin access from the portal. Until now only a
-- database operator could (docs/admin-provisioning.md), so these two functions
-- are the only client path that ever writes 'admin' into users.roles:
-- grant_user_role still refuses it and the column stays out of the client grants.
--
-- Guards, all enforced here rather than in the web app:
--   * the caller is an active admin with a verified second step (require_admin);
--   * the caller entered an authenticator code in the last 5 minutes, read from
--     the token's amr claim, so a stolen aal2 session cannot call these directly;
--   * nobody changes their own admin access, which also means the caller is still
--     an admin afterwards and the last admin can never be removed;
--   * a new admin must be a verified, complete, non-suspended tenant/landlord;
--   * an admin-only account cannot be revoked here: it would be left with no role,
--     and a role must never be inferred, so that stays an operator decision.

alter table public.admin_audit_logs drop constraint admin_audit_logs_action_check;
alter table public.admin_audit_logs add constraint admin_audit_logs_action_check check (
  action = any (array[
    'USER_VERIFICATION_APPROVED', 'USER_VERIFICATION_REJECTED',
    'PROPERTY_VERIFICATION_APPROVED', 'PROPERTY_VERIFICATION_REJECTED',
    'USER_SUSPENDED', 'USER_REACTIVATED',
    'APARTMENT_HIDDEN', 'APARTMENT_RESTORED',
    'PASSPORT_DOCUMENT_APPROVED', 'PASSPORT_DOCUMENT_REJECTED',
    'USER_REPORT_RESOLVED', 'USER_REPORT_DISMISSED',
    'ADMIN_ROLE_GRANTED', 'ADMIN_ROLE_REVOKED'
  ])
);

create or replace function app_private.has_recent_totp()
returns boolean language sql stable set search_path = '' as $$
  select exists (
    select 1
    from jsonb_array_elements(
      case when jsonb_typeof(auth.jwt() -> 'amr') = 'array'
        then auth.jwt() -> 'amr' else '[]'::jsonb end
    ) as entry
    where entry ->> 'method' = 'totp'
      and (entry ->> 'timestamp')::bigint >= extract(epoch from now() - interval '5 minutes')
  );
$$;
revoke all on function app_private.has_recent_totp() from public, anon, authenticated;

-- Shared checks. One lock serializes every admin role change, so two admins
-- removing each other at the same moment cannot both succeed: the second one
-- re-reads its own access after the first has committed and is refused.
create or replace function app_private.begin_admin_role_change(p_target_id uuid, p_reason text)
returns uuid language plpgsql security definer set search_path = '' as $$
declare v_admin_id uuid;
begin
  -- Before the lock, so someone who is not an admin can never queue on it.
  perform app_private.require_admin();
  if p_reason is null or length(btrim(p_reason)) < 3 or length(p_reason) > 500 then
    raise exception 'A reason between 3 and 500 characters is required.';
  end if;
  if not app_private.has_recent_totp() then
    raise exception 'Enter a new authenticator code and try again.';
  end if;

  perform pg_advisory_xact_lock(hashtext('admin_role_change'));
  v_admin_id := app_private.require_admin();
  if p_target_id = v_admin_id then
    raise exception 'You cannot change your own admin access.';
  end if;
  return v_admin_id;
end;
$$;
revoke all on function app_private.begin_admin_role_change(uuid, text) from public, anon, authenticated;

create or replace function public.admin_grant_admin_role(p_target_id uuid, p_reason text)
returns void language plpgsql security definer set search_path = '' as $$
declare
  v_admin_id uuid;
  v_target public.users%rowtype;
begin
  v_admin_id := app_private.begin_admin_role_change(p_target_id, p_reason);

  select * into v_target from public.users where id = p_target_id for update;
  if not found then raise exception 'Account not found.'; end if;
  if 'admin' = any(v_target.roles) then
    raise exception 'This account is already an admin.';
  end if;
  if v_target.is_suspended then
    raise exception 'A suspended account cannot become an admin.';
  end if;
  if v_target.account_status is distinct from 'verified' or v_target.mobile_number is null then
    raise exception 'Only a verified account with a complete profile can become an admin.';
  end if;

  update public.users set roles = roles || 'admin'::text, updated_at = now()
  where id = p_target_id;

  insert into public.admin_audit_logs(admin_id, action, target_type, target_id, reason)
  values (v_admin_id, 'ADMIN_ROLE_GRANTED', 'user', p_target_id, btrim(p_reason));

  perform public.create_notification(
    p_target_id, 'system', 'Admin access added',
    'You now have admin access to APT. Sign in on the web and set up two-step login to use it.',
    jsonb_build_object('event', 'admin_role_granted')
  );
end;
$$;

create or replace function public.admin_revoke_admin_role(p_target_id uuid, p_reason text)
returns void language plpgsql security definer set search_path = '' as $$
declare
  v_admin_id uuid;
  v_target public.users%rowtype;
begin
  v_admin_id := app_private.begin_admin_role_change(p_target_id, p_reason);

  select * into v_target from public.users where id = p_target_id for update;
  if not found then raise exception 'Account not found.'; end if;
  if not ('admin' = any(v_target.roles)) then
    raise exception 'This account is not an admin.';
  end if;
  if not (v_target.roles && array['tenant', 'landlord']) then
    raise exception 'This account has no tenant or landlord role to keep. A database operator must change it.';
  end if;

  update public.users set roles = array_remove(roles, 'admin'), updated_at = now()
  where id = p_target_id;

  insert into public.admin_audit_logs(admin_id, action, target_type, target_id, reason)
  values (v_admin_id, 'ADMIN_ROLE_REVOKED', 'user', p_target_id, btrim(p_reason));

  perform public.create_notification(
    p_target_id, 'system', 'Admin access removed',
    'Your admin access to APT was removed. Your tenant and landlord access is unchanged.',
    jsonb_build_object('event', 'admin_role_revoked')
  );

  -- Admin checks read users.roles, so access ends at once for tokens already
  -- issued. Ending the sessions also sends every open device back to sign-in.
  delete from auth.sessions where user_id = v_target.user_id;
end;
$$;

revoke all on function public.admin_grant_admin_role(uuid, text) from public, anon;
revoke all on function public.admin_revoke_admin_role(uuid, text) from public, anon;
grant execute on function public.admin_grant_admin_role(uuid, text) to authenticated;
grant execute on function public.admin_revoke_admin_role(uuid, text) to authenticated;
