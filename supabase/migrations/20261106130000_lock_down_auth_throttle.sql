-- Locks down the brute-force counter from 20261105144525_auth_attempt_throttle.sql.
--
-- That migration let `anon` call public.auth_throttle() with every action, so
-- anyone holding the public key could `clear` their own failure window (defeating
-- even the server-side web limit) or `fail` a victim's email five times to lock
-- it out. Now:
--   * public.auth_throttle()        answers 'check' only (anon + authenticated),
--   * public.auth_throttle_server() records or clears failures, service_role only.
-- The web server actions call the server function with the service-role key;
-- mobile can only read the counters, so its limit is a speed bump and Supabase
-- Auth's own limits and CAPTCHA remain the backstop.
--
-- Also adds the purposes the web server now uses:
--   signin_email_ip    5 failures / 15 min for one email from one IP, so a stranger
--                      on another IP cannot lock the owner out;
--   signin_email_hour  20 failures / hour for one email from anywhere, the cap
--                      against guessing spread over many IPs;
--   email_change_otp   5 wrong email-change codes / 15 min per account.
-- `signin_email` stays defined so older apps that still send it get an answer.
--
-- Release order: ship the web and mobile changes first, then apply this. Older
-- clients that still call 'fail'/'clear' are refused (they fail open and stop
-- counting), they are never locked out.

create or replace function app_private.auth_throttle_apply(
  p_action text,
  p_purpose text,
  p_subject text
) returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_max integer;
  v_window integer;
  v_subject text := lower(btrim(coalesce(p_subject, '')));
  v_key text;
  v_row app_private.auth_throttle;
  v_ends timestamptz;
begin
  case p_purpose
    when 'signin_email'      then v_max := 5;  v_window := 900;
    when 'signin_email_ip'   then v_max := 5;  v_window := 900;
    when 'signin_email_hour' then v_max := 20; v_window := 3600;
    when 'signin_ip'         then v_max := 20; v_window := 900;
    when 'signup_otp'        then v_max := 5;  v_window := 900;
    when 'recovery_otp'      then v_max := 5;  v_window := 900;
    when 'email_change_otp'  then v_max := 5;  v_window := 900;
    else raise exception 'Unknown throttle purpose' using errcode = '22023';
  end case;

  if p_action not in ('check', 'fail', 'clear') then
    raise exception 'Unknown throttle action' using errcode = '22023';
  end if;
  if v_subject = '' or length(v_subject) > 320 then
    raise exception 'Invalid throttle subject' using errcode = '22023';
  end if;

  v_key := p_purpose || ':' || encode(sha256(convert_to(v_subject, 'utf8')), 'hex');

  if p_action = 'clear' then
    delete from app_private.auth_throttle where key = v_key;
    return 0;
  end if;

  if p_action = 'fail' then
    -- Keeps the table small: the longest window is one hour, so anything older
    -- than two hours is garbage (the old 30 minutes would have dropped live
    -- hourly windows).
    delete from app_private.auth_throttle
      where window_started_at < now() - interval '2 hours' and key <> v_key;

    insert into app_private.auth_throttle as t (key, failures, window_started_at)
    values (v_key, 1, now())
    on conflict (key) do update
      set failures = case
            when t.window_started_at + make_interval(secs => v_window) <= now() then 1
            else t.failures + 1 end,
          window_started_at = case
            when t.window_started_at + make_interval(secs => v_window) <= now() then now()
            else t.window_started_at end;
  end if;

  select * into v_row from app_private.auth_throttle where key = v_key;
  if not found then return 0; end if;

  v_ends := v_row.window_started_at + make_interval(secs => v_window);
  if v_ends <= now() or v_row.failures < v_max then return 0; end if;

  return greatest(1, ceil(extract(epoch from (v_ends - now())))::integer);
end;
$$;

revoke all on function app_private.auth_throttle_apply(text, text, text) from public, anon, authenticated;

-- Public, read-only: "am I blocked?" Anything that would change a counter is refused.
create or replace function public.auth_throttle(
  p_action text,
  p_purpose text,
  p_subject text
) returns integer
language plpgsql
security definer
set search_path = ''
as $$
begin
  if p_action is distinct from 'check' then
    raise exception 'Only the server may change throttle counts' using errcode = '42501';
  end if;
  return app_private.auth_throttle_apply('check', p_purpose, p_subject);
end;
$$;

revoke all on function public.auth_throttle(text, text, text) from public;
grant execute on function public.auth_throttle(text, text, text) to anon, authenticated, service_role;

-- Server only: record a failure, clear after a success, or check.
create or replace function public.auth_throttle_server(
  p_action text,
  p_purpose text,
  p_subject text
) returns integer
language plpgsql
security definer
set search_path = ''
as $$
begin
  return app_private.auth_throttle_apply(p_action, p_purpose, p_subject);
end;
$$;

revoke all on function public.auth_throttle_server(text, text, text) from public, anon, authenticated;
grant execute on function public.auth_throttle_server(text, text, text) to service_role;
