-- guard_user_email_fields runs as the caller (it must, to tell client writes
-- from server ones via current_user), but `authenticated` cannot read
-- auth.users, so every client profile INSERT failed with "permission denied
-- for table users" and sign-up could not create profiles. The Auth email is
-- now read through a narrow SECURITY DEFINER helper that returns only the
-- caller's own address.

create or replace function app_private.current_auth_email() returns text
language sql stable security definer set search_path = '' as $$
  select email::text from auth.users where id = auth.uid()
$$;

revoke all on function app_private.current_auth_email() from public, anon;
grant execute on function app_private.current_auth_email() to authenticated;

create or replace function public.guard_user_email_fields() returns trigger
language plpgsql set search_path = '' as $$
declare
  auth_email text;
begin
  if current_user <> 'authenticated' then
    return NEW;
  end if;

  if TG_OP = 'INSERT' then
    if NEW.user_id is distinct from auth.uid() then
      raise exception 'Profile email must match your sign-in email.';
    end if;
    auth_email := app_private.current_auth_email();
    if auth_email is null or NEW.email is distinct from auth_email then
      raise exception 'Profile email must match your sign-in email.';
    end if;
  elsif NEW.email is distinct from OLD.email then
    raise exception 'Profile email is server-managed.';
  end if;

  return NEW;
end;
$$;
