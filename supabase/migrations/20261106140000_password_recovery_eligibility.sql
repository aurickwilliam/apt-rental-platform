-- Forgot password refuses emails that cannot use a recovery code: no confirmed
-- account ('unknown') and Google-only accounts ('google_only', no email/password
-- identity, so there is no password to reset). Everything else is 'eligible',
-- including Google-linked accounts that also have an email identity.
-- Returns only that label, never account details.

create or replace function public.get_password_recovery_eligibility(p_email text)
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select case
    when u.id is null then 'unknown'
    when exists (
      select 1 from auth.identities i
      where i.user_id = u.id and i.provider = 'email'
    ) then 'eligible'
    else 'google_only'
  end
  from (select 1) as one
  left join auth.users u
    on lower(u.email) = lower(btrim(p_email))
   and u.email_confirmed_at is not null
$$;

revoke all on function public.get_password_recovery_eligibility(text) from public;
grant execute on function public.get_password_recovery_eligibility(text) to anon, authenticated;
