-- Phase 1 of multi-role support: additive roles[] column, no behavior change.
-- Readers keep using users.role; writers dual-write role + roles.
-- Conventions: roles[1] is the primary role; active-role context stays URL-based.
-- Append semantics for future role grants (new roles go last, primary unchanged).

-- 1. Additive column with a safe default; existing rows backfilled from role.
alter table public.users add column if not exists roles text[] not null default '{tenant}';

update public.users set roles = array[role] where roles is distinct from array[role];

-- 2. Allowed-values guard for the new column.
alter table public.users drop constraint if exists roles_valid_values;
alter table public.users add constraint roles_valid_values
  check (roles <@ array['tenant', 'landlord', 'admin'] and cardinality(roles) >= 1);

-- 3. preferences CHECK reworded from scalar role to roles array
-- (team decision: tenant-only preferences, landlord presence disqualifies).
alter table public.users drop constraint if exists preferences_only_for_tenants;
alter table public.users add constraint preferences_only_for_tenants
  check ((not ('landlord' = any (roles))) or (preferences is null));

-- 4. handle_new_user: keep the role write, add the roles write.
create or replace function public.handle_new_user()
 returns trigger
 language plpgsql
 security definer
 set search_path to 'public'
as $function$
begin
  -- Only auto-insert for OAuth providers (e.g. Google), not email/OTP signups
  if NEW.raw_app_meta_data->>'provider' = 'google' then
    insert into public.users (user_id, email, first_name, last_name, avatar_url, role, roles, account_status)
    values (
      NEW.id,
      NEW.email,
      coalesce(NEW.raw_user_meta_data->>'given_name', split_part(coalesce(NEW.raw_user_meta_data->>'full_name', ''), ' ', 1)),
      coalesce(NEW.raw_user_meta_data->>'family_name', split_part(coalesce(NEW.raw_user_meta_data->>'full_name', ''), ' ', 2)),
      NEW.raw_user_meta_data->>'avatar_url',
      'tenant',
      '{tenant}',
      'unverified'
    )
    on conflict (user_id) do nothing;
  end if;
  return NEW;
end;
$function$;

-- 5. set_onboarding_role: keep the role write, add the roles write
-- (single-element at onboarding time; append semantics belong to the
-- future grant_user_role function, not here).
create or replace function public.set_onboarding_role(requested_role text)
 returns text
 language plpgsql
 security definer
 set search_path to ''
as $function$
declare
  profile public.users%rowtype;
begin
  if auth.uid() is null or requested_role is null
     or requested_role not in ('tenant', 'landlord') then
    raise exception 'Invalid onboarding role.';
  end if;

  if not exists (
    select 1 from auth.users
    where id = auth.uid() and raw_app_meta_data->>'provider' = 'google'
  ) then
    raise exception 'Only Google onboarding may choose a role here.';
  end if;

  select * into profile from public.users
  where user_id = auth.uid() for update;

  if not found or profile.role not in ('tenant', 'landlord')
     or profile.mobile_number is not null
     or profile.account_status <> 'unverified' then
    raise exception 'Role selection is no longer available.';
  end if;

  update public.users set role = requested_role, roles = array[requested_role], updated_at = now()
  where id = profile.id;
  return requested_role;
end;
$function$;

-- 6. guard_user_authorization_fields: extend both checks to the roles array.
-- SECURITY DEFINER writers (handle_new_user, set_onboarding_role) run as the
-- function owner, so they bypass the authenticated-only checks exactly as
-- they do today for the scalar role column.
create or replace function public.guard_user_authorization_fields()
 returns trigger
 language plpgsql
 set search_path to ''
as $function$
begin
  if TG_OP = 'INSERT' then
    -- Email/OTP signups choose a normal role; OAuth's auth.users trigger
    -- inserts tenant. Neither path may create an admin or verified account.
    if NEW.role is null or NEW.role not in ('tenant', 'landlord') then
      raise exception 'Client registration cannot create an admin account.';
    end if;
    if NEW.roles is null or cardinality(NEW.roles) < 1
       or not (NEW.roles <@ array['tenant', 'landlord']) then
      raise exception 'Client registration cannot create an admin account.';
    end if;
    if current_user = 'authenticated'
       and (NEW.account_status is null or NEW.account_status <> 'unverified') then
      raise exception 'Account verification status is server-managed.';
    end if;
  else
    -- Also protect direct SQL updates if a broad grant is accidentally restored.
    -- Existing verification triggers run as postgres and can still sync status.
    if current_user = 'authenticated' and (
      NEW.id is distinct from OLD.id
      or NEW.user_id is distinct from OLD.user_id
      or NEW.role is distinct from OLD.role
      or NEW.roles is distinct from OLD.roles
      or NEW.account_status is distinct from OLD.account_status
      or NEW.created_at is distinct from OLD.created_at
    ) then
      raise exception 'Authorization and verification fields are server-managed.';
    end if;
    if current_user = 'authenticated' then
      NEW.updated_at := now();
    end if;
  end if;
  return NEW;
end;
$function$;
