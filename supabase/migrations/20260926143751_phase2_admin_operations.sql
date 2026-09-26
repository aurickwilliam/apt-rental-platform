-- Phase 2: independently managed account access, listing visibility and admin metrics.
alter table public.users
  add column is_suspended boolean not null default false,
  add column suspended_at timestamptz,
  add column suspended_by uuid references public.users(id),
  add column suspension_reason text;

alter table public.apartments
  add column is_hidden_by_admin boolean not null default false,
  add column hidden_at timestamptz,
  add column hidden_by uuid references public.users(id),
  add column hidden_reason text;

alter table public.admin_audit_logs drop constraint admin_audit_logs_action_check;
alter table public.admin_audit_logs add constraint admin_audit_logs_action_check check (action in (
  'USER_VERIFICATION_APPROVED', 'USER_VERIFICATION_REJECTED',
  'PROPERTY_VERIFICATION_APPROVED', 'PROPERTY_VERIFICATION_REJECTED',
  'USER_SUSPENDED', 'USER_REACTIVATED', 'APARTMENT_HIDDEN', 'APARTMENT_RESTORED'
));
alter table public.admin_audit_logs drop constraint admin_audit_logs_target_type_check;
alter table public.admin_audit_logs add constraint admin_audit_logs_target_type_check check (
  target_type in ('user_verification', 'apartment_verification', 'user', 'apartment')
);

-- A broad pre-existing apartment UPDATE grant would also grant the new columns.
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

create or replace function public.guard_user_authorization_fields()
returns trigger language plpgsql set search_path = '' as $$
begin
  if tg_op = 'INSERT' then
    if new.role is null or new.role not in ('tenant', 'landlord') then
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
      or new.role is distinct from old.role
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

-- Conversation RPCs are SECURITY DEFINER and bypass table RLS.
do $$
declare v_definition text; v_v2 text;
begin
  v_definition := pg_get_functiondef('public.get_conversations(uuid)'::regprocedure);
  v_v2 := pg_get_functiondef('public.get_conversations_v2()'::regprocedure);
  if position('  where sender_id = p_user_id' in v_definition) = 0
     or position('where u.user_id = auth.uid();' in v_v2) = 0 then
    raise exception 'Conversation RPC changed; audit before migrating.';
  end if;
  execute replace(v_definition,
    '  where sender_id = p_user_id' || chr(10) || '     or receiver_id = p_user_id',
    '  where (sender_id = p_user_id or receiver_id = p_user_id)' || chr(10) ||
    '    and exists (select 1 from public.users where id = p_user_id and user_id = auth.uid() and not is_suspended)');
  execute replace(v_v2, 'where u.user_id = auth.uid();',
    'where u.user_id = auth.uid() and not u.is_suspended;');
end;
$$;

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
create trigger guard_apartment_moderation_fields
  before update on public.apartments for each row
  execute function public.guard_apartment_moderation_fields();

create schema if not exists app_private;
revoke all on schema app_private from public, anon;
grant usage on schema app_private to authenticated;

-- SECURITY DEFINER is necessary here to look up suspension without recursing
-- through the users table's own RLS. This schema is not exposed by PostgREST.
create function app_private.is_active_user()
returns boolean language sql stable security definer set search_path = '' as $$
  select auth.uid() is not null and not exists (
    select 1 from public.users where user_id = auth.uid() and is_suspended
  );
$$;
revoke all on function app_private.is_active_user() from public, anon;
grant execute on function app_private.is_active_user() to authenticated;

-- A restrictive policy composes with every existing owner/admin policy.
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
    execute format('create policy "Active accounts only" on public.%I as restrictive for all to authenticated using ((select app_private.is_active_user())) with check ((select app_private.is_active_user()))', v_table);
  end loop;
end;
$$;
create policy "Active accounts only" on storage.objects as restrictive
  for all to authenticated
  using ((select app_private.is_active_user()))
  with check ((select app_private.is_active_user()));

-- Preserve access to one's own existing rental, even if its listing is hidden.
create function app_private.can_view_hidden_apartment(p_apartment_id uuid, p_landlord_id uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.users u where u.user_id = auth.uid()
      and not u.is_suspended and (
        u.role = 'admin' or u.id = p_landlord_id
        or exists (select 1 from public.tenancies t
          where t.apartment_id = p_apartment_id and t.tenant_id = u.id)
      )
  );
$$;
revoke all on function app_private.can_view_hidden_apartment(uuid, uuid) from public, anon;
grant execute on function app_private.can_view_hidden_apartment(uuid, uuid) to authenticated;
create policy "Hidden listings excluded for anonymous visitors" on public.apartments
  as restrictive for select to anon using (not is_hidden_by_admin);
create policy "Hidden listings limited to participants" on public.apartments
  as restrictive for select to authenticated
  using (not is_hidden_by_admin or
    (select app_private.can_view_hidden_apartment(id, landlord_id)));
create policy "Images follow listing visibility" on public.apartment_images
  as restrictive for select to anon, authenticated
  using (exists (select 1 from public.apartments a where a.id = apartment_id));

-- Hiding a listing blocks fresh applications/visits without changing existing
-- tenancy, payment, or submitted application history.
create policy "No new applications for hidden listings" on public.rental_application
  as restrictive for insert to authenticated with check (
    exists (select 1 from public.apartments a
      where a.id = apartment_id and not a.is_hidden_by_admin)
  );
create policy "No new visits for hidden listings" on public.visit_request
  as restrictive for insert to authenticated with check (
    exists (select 1 from public.apartments a
      where a.id = apartment_id and not a.is_hidden_by_admin)
  );

-- Restrict privileged state changes to the service role; the Edge Function
-- supplies the verified actor ID after checking its caller JWT.
create function public.admin_set_user_access(
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
    where user_id = p_actor_auth_id and role = 'admin' and not is_suspended;
  if v_admin_id is null then raise exception 'Admin access required.'; end if;
  select * into v_target from public.users where id = p_target_id for update;
  if not found or v_target.role not in ('tenant', 'landlord')
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
  -- the restrictive RLS policies above deny those tokens protected data.
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

create function public.admin_set_apartment_visibility(
  p_apartment_id uuid, p_hide boolean, p_reason text
) returns void language plpgsql security definer set search_path = '' as $$
declare v_admin_id uuid; v_apartment public.apartments%rowtype;
begin
  if p_reason is null or length(btrim(p_reason)) < 3 or length(p_reason) > 500 then
    raise exception 'A reason between 3 and 500 characters is required.';
  end if;
  select id into v_admin_id from public.users
    where user_id = auth.uid() and role = 'admin' and not is_suspended;
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

create function public.get_admin_analytics(date_from date, date_to date)
returns jsonb language plpgsql stable security definer set search_path = '' as $$
begin
  if auth.uid() is null or not exists (
    select 1 from public.users where user_id = auth.uid()
      and role = 'admin' and not is_suspended
  ) then raise exception 'Admin access required.'; end if;
  if date_from is null or date_to is null or date_to < date_from
    or date_to - date_from > 365 then
    raise exception 'Select a date range of at most 366 days.';
  end if;
  return jsonb_build_object(
    'users', (select jsonb_build_object(
      'total', count(*), 'new', count(*) filter (where created_at >= date_from and created_at < date_to + 1),
      'newTenants', count(*) filter (where role = 'tenant' and created_at >= date_from and created_at < date_to + 1),
      'newLandlords', count(*) filter (where role = 'landlord' and created_at >= date_from and created_at < date_to + 1),
      'tenants', count(*) filter (where role = 'tenant'),
      'landlords', count(*) filter (where role = 'landlord'),
      'verified', count(*) filter (where account_status = 'verified'),
      'suspended', count(*) filter (where is_suspended)
    ) from public.users),
    'apartments', (select jsonb_build_object(
      'total', count(*), 'new', count(*) filter (where created_at >= date_from and created_at < date_to + 1),
      'hidden', count(*) filter (where is_hidden_by_admin),
      'verified', count(*) filter (where is_verified),
      'available', count(*) filter (where status = 'available')
    ) from public.apartments where deleted_at is null),
    'userVerifications', (select jsonb_build_object(
      'pending', count(*) filter (where status = 'pending'),
      'approved', count(*) filter (where status = 'approved' and reviewed_at >= date_from and reviewed_at < date_to + 1),
      'rejected', count(*) filter (where status = 'rejected' and reviewed_at >= date_from and reviewed_at < date_to + 1)
    ) from public.user_verifications),
    'apartmentVerifications', (select jsonb_build_object(
      'pending', count(*) filter (where status = 'pending'),
      'approved', count(*) filter (where status = 'approved' and reviewed_at >= date_from and reviewed_at < date_to + 1),
      'rejected', count(*) filter (where status = 'rejected' and reviewed_at >= date_from and reviewed_at < date_to + 1)
    ) from public.apartment_verifications),
    'applications', (select jsonb_build_object(
      'new', count(*), 'approved', count(*) filter (where status = 'approved')
    ) from public.rental_application where created_at >= date_from and created_at < date_to + 1),
    'tenancies', (select jsonb_build_object(
      'new', count(*) filter (where created_at >= date_from and created_at < date_to + 1),
      'active', count(*) filter (where status = 'active'),
      'occupiedUnits', count(distinct apartment_id) filter (where status = 'active')
    ) from public.tenancies),
    'payments', (select jsonb_build_object(
      'paidCount', count(*), 'paidTotal', coalesce(sum(amount), 0)
    ) from public.payment where status = 'paid' and created_at >= date_from and created_at < date_to + 1),
    'maintenance', (select jsonb_build_object(
      'total', count(*), 'pending', count(*) filter (where status = 'pending'),
      'inProgress', count(*) filter (where status = 'in_progress'),
      'resolved', count(*) filter (where status = 'resolved'),
      'cancelled', count(*) filter (where status = 'cancelled')
    ) from public.maintenance_request where created_at >= date_from and created_at < date_to + 1)
  );
end;
$$;
revoke all on function public.get_admin_analytics(date, date) from public, anon;
grant execute on function public.get_admin_analytics(date, date) to authenticated;

-- The search RPC runs as postgres and bypasses apartment RLS. Patch all six
-- section predicates in the existing, identical test/production definition.
do $$
declare v_definition text;
begin
  v_definition := pg_get_functiondef('public.get_search_sections(text,text,jsonb,integer)'::regprocedure);
  if (length(v_definition) - length(replace(v_definition, 'where a.deleted_at is null', ''))) / length('where a.deleted_at is null') <> 6 then
    raise exception 'Search RPC has changed; audit its visibility predicates before migrating.';
  end if;
  execute replace(v_definition, 'where a.deleted_at is null',
    'where a.deleted_at is null and a.is_hidden_by_admin = false');
end;
$$;
