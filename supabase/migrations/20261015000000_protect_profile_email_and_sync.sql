-- Change Email support: public.users.email becomes server-managed and mirrors
-- the canonical auth.users.email only after Auth commits the change.
--
-- Clients keep INSERT(email) for the signup profile row (guarded below to match
-- the authenticated identity), but lose UPDATE(email): email changes go
-- through Supabase Auth's updateUser + dual-inbox confirmation, then the
-- caller-bound sync_my_profile_email() function copies the committed address.

-- Surviving per-column grants bypass a table-level REVOKE, so revoke the email
-- column explicitly from every client role.
revoke update (email) on public.users from public, anon, authenticated;
revoke update on public.users from public, anon, authenticated;
revoke insert (email) on public.users from public, anon;

create or replace function public.guard_user_email_fields()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  auth_email text;
begin
  if current_user <> 'authenticated' then
    return NEW;
  end if;

  if TG_OP = 'INSERT' then
    -- Signup profile rows must belong to the caller and carry the caller's
    -- Auth address. OAuth's handle_new_user() runs as definer and bypasses.
    if NEW.user_id is distinct from auth.uid() then
      raise exception 'Profile email must match your sign-in email.';
    end if;
    select email into auth_email from auth.users where id = auth.uid();
    if auth_email is null or NEW.email is distinct from auth_email then
      raise exception 'Profile email must match your sign-in email.';
    end if;
  elsif NEW.email is distinct from OLD.email then
    raise exception 'Profile email is server-managed.';
  end if;

  return NEW;
end;
$$;

drop trigger if exists guard_user_email_fields on public.users;
create trigger guard_user_email_fields
  before insert or update on public.users
  for each row execute function public.guard_user_email_fields();

revoke all on function public.guard_user_email_fields() from public, anon, authenticated;

-- Copies the caller's committed Auth address onto their own profile row.
-- No inputs, so a caller can never pick another account or address.
create or replace function public.sync_my_profile_email()
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if auth.uid() is null then
    raise exception 'Not signed in.';
  end if;

  update public.users as u
  set email = a.email, updated_at = now()
  from auth.users as a
  where a.id = auth.uid()
    and u.user_id = auth.uid()
    and u.email is distinct from a.email;
end;
$$;

revoke all on function public.sync_my_profile_email() from public, anon;
grant execute on function public.sync_my_profile_email() to authenticated;
