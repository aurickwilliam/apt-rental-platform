-- Removing a device's push token has to work after the session has ended.
--
-- The app deletes the token from its SIGNED_OUT handler, when the request runs
-- as `anon`. The owner-only DELETE policy on public.push_tokens reads
-- public.users.user_id, which `anon` can no longer select
-- (20261024120000_restrict_anon_profile_columns.sql), so every sign-out
-- cleanup failed with 42501 "permission denied for table users" and the token
-- stayed registered to the previous account.
--
-- Like register_push_token, this relies on possession of the Expo token being
-- the limited capability: whoever holds the token can claim it or release it.
-- The function never returns the previous owner or a row count, and the
-- table's owner-only RLS policies stay unchanged.
create function public.unregister_push_token(p_token text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if p_token is null or length(p_token) > 256 or
     p_token !~ '^Expo(nent)?PushToken\[[A-Za-z0-9_-]+\]$' then
    raise exception 'Invalid push token' using errcode = '22023';
  end if;

  delete from public.push_tokens where token = p_token;
end;
$$;

revoke all on function public.unregister_push_token(text) from public;
grant execute on function public.unregister_push_token(text) to anon, authenticated;
