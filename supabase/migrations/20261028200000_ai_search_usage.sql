-- Daily message allowance for Casa, the AI chatbot search.
--
-- The `ai-search` edge function calls Gemini's free tier, whose quota is
-- shared by every account. Each account may send a limited number of chat
-- messages per Asia/Manila day; past that, the app falls back to its keyword
-- search, which costs nothing. Only the edge function (service role) reads or
-- writes this table: RLS is on with no policies, and clients get no grants.

create table if not exists public.ai_search_usage (
  user_id uuid not null references public.users (id) on delete cascade,
  usage_date date not null,
  message_count integer not null default 0 check (message_count >= 0),
  primary key (user_id, usage_date)
);

alter table public.ai_search_usage enable row level security;
revoke all on table public.ai_search_usage from public, anon, authenticated;

-- Counts one message for the account. Returns true when the message is within
-- the allowance, false once it is used up (the count then stops growing).
create or replace function public.consume_ai_search_allowance(p_user_id uuid, p_daily_limit integer)
returns boolean language plpgsql security definer set search_path = '' as $$
declare
  v_today date := (now() at time zone 'Asia/Manila')::date;
  v_count integer;
begin
  if p_user_id is null or p_daily_limit is null or p_daily_limit < 1 then
    return false;
  end if;

  insert into public.ai_search_usage as usage (user_id, usage_date, message_count)
  values (p_user_id, v_today, 1)
  on conflict (user_id, usage_date) do update
    set message_count = usage.message_count + 1
    where usage.message_count < p_daily_limit
  returning message_count into v_count;

  -- No row returned means the update was skipped: the allowance is used.
  return v_count is not null;
end;
$$;

revoke all on function public.consume_ai_search_allowance(uuid, integer) from public, anon, authenticated;
grant execute on function public.consume_ai_search_allowance(uuid, integer) to service_role;

-- Old days are not needed; keep the table small.
create index if not exists ai_search_usage_usage_date_idx on public.ai_search_usage (usage_date);
