-- Phase 0: protect authorization/verification fields before shipping /admin.
-- The hosted users table predates tracked migrations. Existing owner RLS alone
-- lets an authenticated user write any column (including role and status).

revoke update on public.users from public, anon, authenticated;
-- Existing per-column grants can survive a table-level REVOKE.
revoke update (
  id, user_id, role, account_status, created_at, updated_at,
  first_name, last_name, middle_name, suffix, gender, mobile_number,
  birth_date, street_address, barangay, city, province, postal_code,
  avatar_url, background_url, email, preferences
) on public.users from public, anon, authenticated;
grant update (
  first_name, last_name, middle_name, suffix, gender, mobile_number,
  birth_date, street_address, barangay, city, province, postal_code,
  avatar_url, background_url, email, preferences
) on public.users to authenticated;

create or replace function public.guard_user_authorization_fields()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if TG_OP = 'INSERT' then
    -- Email/OTP signups choose a normal role; OAuth's auth.users trigger
    -- inserts tenant. Neither path may create an admin or verified account.
    if NEW.role is null or NEW.role not in ('tenant', 'landlord') then
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
$$;

create trigger guard_user_authorization_fields
  before insert or update on public.users
  for each row execute function public.guard_user_authorization_fields();

revoke all on function public.guard_user_authorization_fields() from public, anon, authenticated;

-- Google OAuth creates an incomplete tenant profile in handle_new_user().
-- Allow choosing tenant/landlord only during that initial onboarding window.
-- The function takes no user ID and never accepts admin as an input or output.
create function public.set_onboarding_role(requested_role text)
returns text
language plpgsql
security definer
set search_path = ''
as $$
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

  update public.users set role = requested_role, updated_at = now()
  where id = profile.id;
  return requested_role;
end;
$$;

revoke all on function public.set_onboarding_role(text) from public, anon;
grant execute on function public.set_onboarding_role(text) to authenticated;

-- Admin provisioning: create a normal authenticated account, then use a
-- trusted database operator connection (postgres) to promote its users row:
-- UPDATE public.users SET role = 'admin' WHERE user_id = '<auth user UUID>';
-- Verify exactly one row changed; never run this via a user JWT or ship a
-- service-role credential to a web/mobile client. Revoke access by updating
-- this row back to a normal role using the same trusted connection.
