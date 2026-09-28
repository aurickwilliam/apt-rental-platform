-- Phase 5 of multi-role support (contract): remove the legacy scalar role
-- column. All readers were moved to roles in Phases 2-4; writers stop
-- dual-writing here. roles[1] remains the primary role by convention.

-- Tighten the allowlist while here: reject null array elements too
-- (a {NULL} array otherwise slips through three-valued CHECK logic).
alter table public.users drop constraint if exists roles_valid_values;
alter table public.users add constraint roles_valid_values
  check (
    roles <@ array['tenant', 'landlord', 'admin']
    and cardinality(roles) >= 1
    and array_position(roles, null) is null
  );

-- handle_new_user: roles-only insert.
create or replace function public.handle_new_user()
 returns trigger
 language plpgsql
 security definer
 set search_path to 'public'
as $function$
begin
  -- Only auto-insert for OAuth providers (e.g. Google), not email/OTP signups
  if NEW.raw_app_meta_data->>'provider' = 'google' then
    insert into public.users (user_id, email, first_name, last_name, avatar_url, roles, account_status)
    values (
      NEW.id,
      NEW.email,
      coalesce(NEW.raw_user_meta_data->>'given_name', split_part(coalesce(NEW.raw_user_meta_data->>'full_name', ''), ' ', 1)),
      coalesce(NEW.raw_user_meta_data->>'family_name', split_part(coalesce(NEW.raw_user_meta_data->>'full_name', ''), ' ', 2)),
      NEW.raw_user_meta_data->>'avatar_url',
      '{tenant}',
      'unverified'
    )
    on conflict (user_id) do nothing;
  end if;
  return NEW;
end;
$function$;

-- set_onboarding_role: roles-only selection (primary element replaces
-- the scalar check; single-element at onboarding time by construction).
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

  if not found or not (profile.roles[1] in ('tenant', 'landlord'))
     or profile.mobile_number is not null
     or profile.account_status <> 'unverified' then
    raise exception 'Role selection is no longer available.';
  end if;

  update public.users set roles = array[requested_role], updated_at = now()
  where id = profile.id;
  return requested_role;
end;
$function$;

-- guard_user_authorization_fields: roles-only authorization fields.
create or replace function public.guard_user_authorization_fields()
 returns trigger
 language plpgsql
 set search_path to ''
as $function$
begin
  if TG_OP = 'INSERT' then
    -- Email/OTP signups choose a normal role; OAuth's auth.users trigger
    -- inserts tenant. Neither path may create an admin or verified account.
    if NEW.roles is null or cardinality(NEW.roles) < 1
       or array_position(NEW.roles, null) is not null
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

-- Storage policies referencing the scalar column (same membership flip).
drop policy if exists "Landlords can upload lease agreements" on storage.objects;
create policy "Landlords can upload lease agreements" on storage.objects
  for insert to public with check (((bucket_id = 'lease-agreements'::text)
    and (exists (select 1 from users
      where ((users.user_id = auth.uid())
        and ('landlord'::text = any (users.roles)))))));

drop policy if exists "user-verification admin read" on storage.objects;
create policy "user-verification admin read" on storage.objects
  for select to authenticated using (((bucket_id = 'user-verification'::text)
    and (exists (select 1 from users
      where ((users.user_id = auth.uid())
        and ('admin'::text = any (users.roles)))))));

-- Contract: drop the legacy column. Fails loudly if any policy, view,
-- trigger, or constraint still references it.
alter table public.users drop column role;
