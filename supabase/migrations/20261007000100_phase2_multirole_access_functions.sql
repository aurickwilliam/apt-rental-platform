-- Phase 2 admin operations, deployable on top of the multi-role schema.
--
-- 20260926143751_phase2_admin_operations.sql predates the roles[] migration and
-- partly overlaps later migrations (visibility columns, audit constraints), so it
-- cannot be applied to a database that already ran those. This migration is
-- idempotent: on a fresh replay (where 20260926143751 already ran) it re-creates
-- the same objects from roles[], and on production (where it never ran) it
-- installs the missing pieces.

-- 1. Account suspension columns (server-managed).
alter table public.users
  add column if not exists is_suspended boolean not null default false,
  add column if not exists suspended_at timestamptz,
  add column if not exists suspended_by uuid references public.users(id),
  add column if not exists suspension_reason text;
alter table public.apartments
  add column if not exists is_hidden_by_admin boolean not null default false,
  add column if not exists hidden_at timestamptz,
  add column if not exists hidden_by uuid references public.users(id),
  add column if not exists hidden_reason text;

-- 2. Keep moderation/suspension columns out of client UPDATE grants.
revoke update on public.apartments from public, anon, authenticated;
grant update (
  name, description, monthly_rent, type, street_address, barangay, city, province,
  status, no_bedrooms, no_bathrooms, area_sqm, zip_code, furnished_type,
  latitude, longitude, max_occupants, deleted_at, amenities, floor_level,
  lease_duration, security_deposit, advance_rent, lease_agreement_url,
  rent_due_day, updated_at
) on public.apartments to authenticated;
revoke update (is_suspended, suspended_at, suspended_by, suspension_reason)
  on public.users from public, anon, authenticated;

-- 3. Authorization-field guard: roles[] plus suspension fields.
create or replace function public.guard_user_authorization_fields()
returns trigger language plpgsql set search_path = '' as $$
begin
  if tg_op = 'INSERT' then
    if new.roles is null or cardinality(new.roles) < 1
       or array_position(new.roles, null) is not null
       or not (new.roles <@ array['tenant', 'landlord']) then
      raise exception 'Client registration cannot create an admin account.';
    end if;
    if current_user = 'authenticated' and (
      new.account_status is null or new.account_status <> 'unverified'
      or new.is_suspended is distinct from false
      or new.suspended_at is not null or new.suspended_by is not null
      or new.suspension_reason is not null
    ) then
      raise exception 'Account status is server-managed.';
    end if;
  else
    if current_user = 'authenticated' and (
      new.id is distinct from old.id or new.user_id is distinct from old.user_id
      or new.roles is distinct from old.roles
      or new.account_status is distinct from old.account_status
      or new.created_at is distinct from old.created_at
      or new.is_suspended is distinct from old.is_suspended
      or new.suspended_at is distinct from old.suspended_at
      or new.suspended_by is distinct from old.suspended_by
      or new.suspension_reason is distinct from old.suspension_reason
    ) then
      raise exception 'Authorization and access fields are server-managed.';
    end if;
    if current_user = 'authenticated' then new.updated_at := now(); end if;
  end if;
  return new;
end;
$$;

-- 4. Conversation RPCs are SECURITY DEFINER and bypass table RLS.
do $$
declare v_definition text; v_v2 text;
begin
  v_definition := pg_get_functiondef('public.get_conversations(uuid)'::regprocedure);
  v_v2 := pg_get_functiondef('public.get_conversations_v2()'::regprocedure);
  if position('is_suspended' in v_definition) = 0 then
    if position('  where sender_id = p_user_id' in v_definition) = 0 then
      raise exception 'Conversation RPC changed; audit before migrating.';
    end if;
    execute replace(v_definition,
      '  where sender_id = p_user_id' || chr(10) || '     or receiver_id = p_user_id',
      '  where (sender_id = p_user_id or receiver_id = p_user_id)' || chr(10) ||
      '    and exists (select 1 from public.users where id = p_user_id and user_id = auth.uid() and not is_suspended)');
  end if;
  if position('is_suspended' in v_v2) = 0 then
    if position('where u.user_id = auth.uid();' in v_v2) = 0 then
      raise exception 'Conversation RPC changed; audit before migrating.';
    end if;
    execute replace(v_v2, 'where u.user_id = auth.uid();',
      'where u.user_id = auth.uid() and not u.is_suspended;');
  end if;
end;
$$;

-- 5. Listing moderation fields are server-managed.
create or replace function public.guard_apartment_moderation_fields()
returns trigger language plpgsql set search_path = '' as $$
begin
  if current_user = 'authenticated' and (
    new.is_hidden_by_admin is distinct from old.is_hidden_by_admin
    or new.hidden_at is distinct from old.hidden_at
    or new.hidden_by is distinct from old.hidden_by
    or new.hidden_reason is distinct from old.hidden_reason
  ) then
    raise exception 'Listing moderation is server-managed.';
  end if;
  return new;
end;
$$;
revoke all on function public.guard_apartment_moderation_fields() from public, anon, authenticated;
drop trigger if exists guard_apartment_moderation_fields on public.apartments;
create trigger guard_apartment_moderation_fields
  before update on public.apartments for each row
  execute function public.guard_apartment_moderation_fields();

-- 6. Suspended accounts: restrictive RLS composes with every existing policy.
create schema if not exists app_private;
revoke all on schema app_private from public, anon;
grant usage on schema app_private to authenticated;

create or replace function app_private.is_active_user()
returns boolean language sql stable security definer set search_path = '' as $$
  select auth.uid() is not null and not exists (
    select 1 from public.users where user_id = auth.uid() and is_suspended
  );
$$;
revoke all on function app_private.is_active_user() from public, anon;
grant execute on function app_private.is_active_user() to authenticated;

do $$
declare v_table text;
begin
  foreach v_table in array array[
    'admin_audit_logs', 'apartment_images', 'apartment_verifications',
    'apartments', 'chat', 'chat_reactions', 'favorites', 'maintenance_request',
    'notification_preferences', 'notifications', 'payment', 'push_tokens',
    'rent_reminders', 'rental_application', 'reviews', 'tenancies',
    'user_verifications', 'users', 'visit_request'
  ] loop
    execute format('drop policy if exists "Active accounts only" on public.%I', v_table);
    execute format('create policy "Active accounts only" on public.%I as restrictive for all to authenticated using ((select app_private.is_active_user())) with check ((select app_private.is_active_user()))', v_table);
  end loop;
end;
$$;
drop policy if exists "Active accounts only" on storage.objects;
create policy "Active accounts only" on storage.objects as restrictive
  for all to authenticated
  using ((select app_private.is_active_user()))
  with check ((select app_private.is_active_user()));

-- 7. Hidden listings: participants (landlord, tenants, admins) keep access.
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
revoke all on function app_private.can_view_hidden_apartment(uuid, uuid) from public, anon;
grant execute on function app_private.can_view_hidden_apartment(uuid, uuid) to authenticated;

drop policy if exists "Hidden listings excluded for anonymous visitors" on public.apartments;
create policy "Hidden listings excluded for anonymous visitors" on public.apartments
  as restrictive for select to anon using (not is_hidden_by_admin);
drop policy if exists "Hidden listings limited to participants" on public.apartments;
create policy "Hidden listings limited to participants" on public.apartments
  as restrictive for select to authenticated
  using (not is_hidden_by_admin or
    (select app_private.can_view_hidden_apartment(id, landlord_id)));
drop policy if exists "Images follow listing visibility" on public.apartment_images;
create policy "Images follow listing visibility" on public.apartment_images
  as restrictive for select to anon, authenticated
  using (exists (select 1 from public.apartments a where a.id = apartment_id));
drop policy if exists "No new applications for hidden listings" on public.rental_application;
create policy "No new applications for hidden listings" on public.rental_application
  as restrictive for insert to authenticated with check (
    exists (select 1 from public.apartments a
      where a.id = apartment_id and not a.is_hidden_by_admin)
  );
drop policy if exists "No new visits for hidden listings" on public.visit_request;
create policy "No new visits for hidden listings" on public.visit_request
  as restrictive for insert to authenticated with check (
    exists (select 1 from public.apartments a
      where a.id = apartment_id and not a.is_hidden_by_admin)
  );

-- 8. Admin operations (roles[]-based).
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

create or replace function public.admin_set_apartment_visibility(
  p_apartment_id uuid, p_hide boolean, p_reason text
) returns void language plpgsql security definer set search_path = '' as $$
declare v_admin_id uuid; v_apartment public.apartments%rowtype;
begin
  if p_reason is null or length(btrim(p_reason)) < 3 or length(p_reason) > 500 then
    raise exception 'A reason between 3 and 500 characters is required.';
  end if;
  select id into v_admin_id from public.users
  where user_id = (select auth.uid()) and 'admin' = any(roles) and not is_suspended;
  if v_admin_id is null then raise exception 'Admin access required.'; end if;

  select * into v_apartment from public.apartments where id = p_apartment_id for update;
  if not found or v_apartment.deleted_at is not null
    or v_apartment.is_hidden_by_admin = p_hide then
    raise exception 'Invalid listing visibility transition.';
  end if;
  update public.apartments set is_hidden_by_admin = p_hide,
    hidden_at = case when p_hide then now() else null end,
    hidden_by = case when p_hide then v_admin_id else null end,
    hidden_reason = case when p_hide then btrim(p_reason) else null end,
    updated_at = now()
  where id = p_apartment_id;
  insert into public.admin_audit_logs(admin_id, action, target_type, target_id, reason)
  values(v_admin_id, case when p_hide then 'APARTMENT_HIDDEN' else 'APARTMENT_RESTORED' end,
    'apartment', p_apartment_id, btrim(p_reason));
end;
$$;
revoke all on function public.admin_set_apartment_visibility(uuid, boolean, text)
  from public, anon;
grant execute on function public.admin_set_apartment_visibility(uuid, boolean, text)
  to authenticated;

-- 9. The search RPC runs as postgres and bypasses RLS: hide admin-hidden listings
-- from all six cohorts and the all_results fallback.
do $$
declare v_definition text;
begin
  v_definition := pg_get_functiondef('public.get_search_sections(text,text,jsonb,integer)'::regprocedure);
  if position('is_hidden_by_admin' in v_definition) = 0 then
    v_definition := replace(v_definition, 'where a.deleted_at is null',
      'where a.deleted_at is null and a.is_hidden_by_admin = false');
    v_definition := replace(v_definition, 'where (a.deleted_at is null)',
      'where (a.deleted_at is null) and a.is_hidden_by_admin = false');
    if (length(v_definition) - length(replace(v_definition, 'is_hidden_by_admin = false', '')))
       / length('is_hidden_by_admin = false') < 6 then
      raise exception 'Search RPC has changed; audit its visibility predicates.';
    end if;
    execute v_definition;
  end if;
end;
$$;
