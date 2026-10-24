-- Sign-up duplicate check must see Auth accounts, not only profiles: an email
-- verified but never given a profile row stays registered in auth.users, and
-- Supabase then silently sends no code for it. Unconfirmed accounts (code not
-- yet entered, e.g. a refresh mid-verification) do not count: signing up again
-- simply sends a fresh code. Returns only a boolean.

create or replace function public.is_email_registered(p_email text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from auth.users
    where lower(email) = lower(btrim(p_email))
      and email_confirmed_at is not null
  )
$$;

revoke all on function public.is_email_registered(text) from public;
grant execute on function public.is_email_registered(text) to anon, authenticated;
