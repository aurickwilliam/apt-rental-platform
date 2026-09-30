-- Expo tokens belong to an app installation, not an account. When another
-- account signs in on the same device, the token must move atomically to the
-- current profile. Keep the table's owner-only RLS policies unchanged.
-- Possession of an Expo push token is the limited capability to claim that
-- token for delivery; this function never returns its previous owner.
create function public.register_push_token(p_token text, p_platform text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid;
begin
  if auth.uid() is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;

  select id into v_user_id
  from public.users
  where user_id = auth.uid();

  if v_user_id is null then
    raise exception 'Profile required' using errcode = '42501';
  end if;

  if p_token is null or length(p_token) > 256 or
     p_token !~ '^Expo(nent)?PushToken\[[A-Za-z0-9_-]+\]$' or
     p_platform not in ('ios', 'android') or p_platform is null then
    raise exception 'Invalid push token or platform' using errcode = '22023';
  end if;

  insert into public.push_tokens (user_id, token, platform)
  values (v_user_id, p_token, p_platform)
  on conflict (token) do update
    set user_id = excluded.user_id,
        platform = excluded.platform,
        updated_at = now();
end;
$$;

revoke all on function public.register_push_token(text, text) from public, anon;
grant execute on function public.register_push_token(text, text) to authenticated;
