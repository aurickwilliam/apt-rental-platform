-- In-app notifications + push token infrastructure.
--
-- notifications: per-user in-app feed. Rows are written by triggers /
-- create_notification() (system path). Clients only SELECT own rows and
-- UPDATE is_read; they never INSERT.
--
-- push_tokens: Expo push tokens registered by the mobile client. Upserted on
-- sign-in, deleted on sign-out or when Expo reports DeviceNotRegistered.
--
-- create_notification(user_id, type, title, message, data):
--   SECURITY DEFINER helper used by every trigger and future system features.
--   Inserts the feed row, then fires pg_net -> push-notify edge function so
--   the same event reaches in-app and push. The edge function is
--   verify_jwt=false (same tradeoff as delete-application-documents) and
--   resolves push tokens itself.

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  type text not null check (type in ('payment', 'message', 'maintenance', 'apartment', 'system')),
  title text not null,
  message text not null default '',
  data jsonb not null default '{}'::jsonb,
  is_read boolean not null default false,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists notifications_user_created_idx
  on public.notifications (user_id, created_at desc);

create index if not exists notifications_user_unread_idx
  on public.notifications (user_id) where is_read = false;

create table if not exists public.push_tokens (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  token text not null unique,
  platform text not null check (platform in ('ios', 'android')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- RLS --------------------------------------------------------------------

alter table public.notifications enable row level security;
alter table public.push_tokens enable row level security;

create policy "Users read own notifications"
  on public.notifications for select
  using (user_id = (select id from public.users where user_id = auth.uid()));

create policy "Users update own notifications"
  on public.notifications for update
  using (user_id = (select id from public.users where user_id = auth.uid()))
  with check (user_id = (select id from public.users where user_id = auth.uid()));

create policy "Service role inserts notifications"
  on public.notifications for insert
  to service_role
  with check (true);

create policy "Users read own push tokens"
  on public.push_tokens for select
  using (user_id = (select id from public.users where user_id = auth.uid()));

create policy "Users insert own push tokens"
  on public.push_tokens for insert
  with check (user_id = (select id from public.users where user_id = auth.uid()));

create policy "Users update own push tokens"
  on public.push_tokens for update
  using (user_id = (select id from public.users where user_id = auth.uid()))
  with check (user_id = (select id from public.users where user_id = auth.uid()));

create policy "Users delete own push tokens"
  on public.push_tokens for delete
  using (user_id = (select id from public.users where user_id = auth.uid()));

-- Helper ----------------------------------------------------------------

create or replace function public.create_notification(
  p_user_id uuid,
  p_type text,
  p_title text,
  p_message text default '',
  p_data jsonb default '{}'::jsonb
) returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid;
begin
  insert into public.notifications (user_id, type, title, message, data)
  values (p_user_id, p_type, p_title, p_message, p_data)
  returning id into v_id;

  perform net.http_post(
    url := 'https://ezxirkpgfpripjydcqnt.supabase.co/functions/v1/push-notify',
    headers := jsonb_build_object('Content-Type', 'application/json'),
    body := jsonb_build_object(
      'notification_id', v_id,
      'user_id', p_user_id,
      'type', p_type,
      'title', p_title,
      'message', p_message,
      'data', p_data
    )
  );

  return v_id;
end;
$$;

revoke execute on function public.create_notification(uuid, text, text, text, jsonb) from public, anon;
grant execute on function public.create_notification(uuid, text, text, text, jsonb) to authenticated, service_role;

comment on function public.create_notification(uuid, text, text, text, jsonb) is
  'Insert a notification row and enqueue its push delivery. Authenticated and service_role only.';

-- Triggers --------------------------------------------------------------

-- Payment: paid -> landlord "Payment received", tenant "Payment processed".
create or replace function public.notify_payment_created()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_landlord_id uuid;
begin
  if NEW.status <> 'paid' then
    return NEW;
  end if;

  select a.landlord_id into v_landlord_id
  from public.apartments a
  where a.id = NEW.apartment_id;

  perform public.create_notification(
    NEW.tenant_id,
    'payment',
    'Payment Successful',
    'Your rent payment of ₱' || to_char(NEW.amount, 'FM999,999,999.00') || ' was received.',
    jsonb_build_object('screen', 'payments', 'paymentId', NEW.id)
  );

  if v_landlord_id is not null then
    perform public.create_notification(
      v_landlord_id,
      'payment',
      'Payment Received',
      'A tenant paid ₱' || to_char(NEW.amount, 'FM999,999,999.00') || '.',
      jsonb_build_object('screen', 'payments', 'paymentId', NEW.id)
    );
  end if;

  return NEW;
end;
$$;

create trigger notify_payment_created
  after insert or update of status on public.payment
  for each row
  when (new.status = 'paid')
  execute function public.notify_payment_created();

-- Maintenance: new request -> landlord; status change -> tenant.
create or replace function public.notify_maintenance_request()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_landlord_id uuid;
  v_title text;
begin
  if TG_OP = 'INSERT' then
    select a.landlord_id into v_landlord_id
    from public.apartments a
    where a.id = NEW.apartment_id;

    if v_landlord_id is not null then
      perform public.create_notification(
        v_landlord_id,
        'maintenance',
        'New Maintenance Request',
        NEW.title || ' (' || NEW.urgency || ' priority).',
        jsonb_build_object('screen', 'maintenance', 'maintenanceId', NEW.id)
      );
    end if;

    return NEW;
  end if;

  if NEW.status is distinct from OLD.status then
    v_title := case NEW.status
      when 'in_progress' then 'Maintenance In Progress'
      when 'resolved' then 'Maintenance Resolved'
      when 'cancelled' then 'Maintenance Cancelled'
      else 'Maintenance Update'
    end;

    perform public.create_notification(
      NEW.tenant_id,
      'maintenance',
      v_title,
      NEW.title,
      jsonb_build_object('screen', 'maintenance', 'maintenanceId', NEW.id)
    );
  end if;

  return NEW;
end;
$$;

create trigger notify_maintenance_request
  after insert or update of status on public.maintenance_request
  for each row
  execute function public.notify_maintenance_request();

-- Chat: new message -> receiver.
create or replace function public.notify_chat_message()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_sender_name text;
  v_preview text;
begin
  select trim(both from coalesce(u.first_name, '') || ' ' || coalesce(u.last_name, ''))
  into v_sender_name
  from public.users u
  where u.id = NEW.sender_id;

  v_preview := case
    when NEW.message is not null then NEW.message
    when NEW.message_type = 'image' then 'Sent an image'
    when NEW.message_type = 'video' then 'Sent a video'
    when NEW.message_type = 'gif' then 'Sent a GIF'
    else 'Sent an attachment'
  end;

  perform public.create_notification(
    NEW.receiver_id,
    'message',
    coalesce(nullif(v_sender_name, ''), 'New Message'),
    v_preview,
    jsonb_build_object(
      'screen', 'chat',
      'apartmentId', NEW.apartment_id,
      'conversationKey',
        'chat:' || coalesce(NEW.apartment_id::text, 'none') || ':' ||
        least(NEW.sender_id::text, NEW.receiver_id::text) || ':' ||
        greatest(NEW.sender_id::text, NEW.receiver_id::text)
    )
  );

  return NEW;
end;
$$;

create trigger notify_chat_message
  after insert on public.chat
  for each row
  execute function public.notify_chat_message();

-- Application: approved/rejected -> tenant.
create or replace function public.notify_application_status()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_apartment_name text;
begin
  if NEW.status is distinct from OLD.status and NEW.status in ('approved', 'rejected') then
    select coalesce(a.name, 'Apartment') into v_apartment_name
    from public.apartments a
    where a.id = NEW.apartment_id;

    if NEW.status = 'approved' then
      perform public.create_notification(
        NEW.tenant_id,
        'apartment',
        'Application Approved',
        'Your application for ' || v_apartment_name || ' was approved.',
        jsonb_build_object('screen', 'apartment', 'apartmentId', NEW.apartment_id)
      );
    else
      perform public.create_notification(
        NEW.tenant_id,
        'apartment',
        'Application Rejected',
        'Your application for ' || v_apartment_name || ' was not approved.',
        jsonb_build_object('screen', 'apartment', 'apartmentId', NEW.apartment_id)
      );
    end if;
  end if;

  return NEW;
end;
$$;

create trigger notify_application_status
  after update of status on public.rental_application
  for each row
  execute function public.notify_application_status();

-- Visit request: new -> landlord; response -> tenant.
create or replace function public.notify_visit_request()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_landlord_id uuid;
  v_title text;
  v_message text;
begin
  if TG_OP = 'INSERT' then
    select a.landlord_id into v_landlord_id
    from public.apartments a
    where a.id = NEW.apartment_id;

    if v_landlord_id is not null then
      perform public.create_notification(
        v_landlord_id,
        'apartment',
        'New Visit Request',
        'A tenant wants to visit on ' || to_char(NEW.visit_date, 'Mon DD, YYYY') || '.',
        jsonb_build_object('screen', 'visitRequests', 'visitRequestId', NEW.id)
      );
    end if;

    return NEW;
  end if;

  if NEW.status is distinct from OLD.status then
    v_title := case NEW.status
      when 'approved' then 'Visit Approved'
      when 'rejected' then 'Visit Rejected'
      when 'rescheduled' then 'Visit Rescheduled'
      when 'cancelled' then 'Visit Cancelled'
      else 'Visit Update'
    end;

    v_message := 'Your visit request on ' || to_char(NEW.visit_date, 'Mon DD, YYYY');
    if NEW.confirmed_visit_date is not null then
      v_message := v_message || ' has been moved to ' || to_char(NEW.confirmed_visit_date, 'Mon DD, YYYY');
    else
      v_message := v_message || ' was ' || NEW.status || '.';
    end if;

    perform public.create_notification(
      NEW.tenant_id,
      'apartment',
      v_title,
      v_message,
      jsonb_build_object('screen', 'visitRequests', 'visitRequestId', NEW.id)
    );
  end if;

  return NEW;
end;
$$;

create trigger notify_visit_request
  after insert or update of status on public.visit_request
  for each row
  execute function public.notify_visit_request();

-- Realtime: live-refresh the in-app feed.
alter publication supabase_realtime add table public.notifications;