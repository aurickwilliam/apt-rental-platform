-- Shared failure counters for sign-in and one-time-code guessing, used by web
-- (server actions) and mobile. Supabase Auth keeps its own platform limits;
-- this adds an app-level, cross-instance window that survives restarts and
-- app reinstalls (the old web limiter was in process memory and the OTP
-- attempt counters lived in React state).
--
-- Only a SHA-256 of the lower-cased subject (email or IP) is stored, never the
-- value itself. Clients cannot read or write the table; they call
-- public.auth_throttle(), which is the only way in. Because anon must be able
-- to call it (sign-in happens before a session exists), it is a speed bump for
-- the apps' own flows, not a gate in front of Supabase Auth's endpoints:
-- hosted Auth rate limits and CAPTCHA remain the server-side backstop.

create table if not exists app_private.auth_throttle (
  key text primary key,
  failures integer not null default 0,
  window_started_at timestamptz not null default now()
);

create index if not exists auth_throttle_window_idx
  on app_private.auth_throttle (window_started_at);

alter table app_private.auth_throttle enable row level security;
revoke all on table app_private.auth_throttle from public, anon, authenticated;

-- p_action: 'check' (read only), 'fail' (record one failure), 'clear' (success).
-- Returns the seconds until the window releases while blocked, otherwise 0.
create or replace function public.auth_throttle(
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
    when 'signin_email'  then v_max := 5;  v_window := 900;
    when 'signin_ip'     then v_max := 20; v_window := 900;
    when 'signup_otp'    then v_max := 5;  v_window := 900;
    when 'recovery_otp'  then v_max := 5;  v_window := 900;
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
    -- Keeps the table small: windows older than two lifetimes are garbage.
    delete from app_private.auth_throttle
      where window_started_at < now() - interval '30 minutes' and key <> v_key;

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

revoke all on function public.auth_throttle(text, text, text) from public;
grant execute on function public.auth_throttle(text, text, text) to anon, authenticated;
