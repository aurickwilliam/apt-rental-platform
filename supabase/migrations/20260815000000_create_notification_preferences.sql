-- Notification delivery preferences.
--
-- One row per user. Missing row === all notifications enabled (clients and the
-- push-notify edge function treat absence as defaults), so no backfill/trigger
-- is needed. Toggles control banner delivery (in-app toast + OS push), not the
-- in-app feed, which always stores every notification row.
--
-- notifications_enabled: master switch. When false, no push is sent and the
--   client does not register a push token / show toasts.
-- payment/message/maintenance/apartment/system: per-type switches, only
--   consulted when notifications_enabled is true.

create table if not exists public.notification_preferences (
  user_id uuid primary key references public.users (id) on delete cascade,
  notifications_enabled boolean not null default true,
  payment boolean not null default true,
  message boolean not null default true,
  maintenance boolean not null default true,
  apartment boolean not null default true,
  system boolean not null default true,
  updated_at timestamptz not null default now()
);

-- RLS --------------------------------------------------------------------

alter table public.notification_preferences enable row level security;

create policy "Users read own notification preferences"
  on public.notification_preferences for select
  using (user_id = (select id from public.users where user_id = auth.uid()));

create policy "Users insert own notification preferences"
  on public.notification_preferences for insert
  with check (user_id = (select id from public.users where user_id = auth.uid()));

create policy "Users update own notification preferences"
  on public.notification_preferences for update
  using (user_id = (select id from public.users where user_id = auth.uid()))
  with check (user_id = (select id from public.users where user_id = auth.uid()));

create policy "Service role inserts notification preferences"
  on public.notification_preferences for insert
  to service_role
  with check (true);
