-- Email for the moderation actions that need one: a hidden listing, a warning
-- and a suspension reach the person's inbox, and the reporter gets a generic
-- "we reviewed your report" when any report is closed.
--
-- Emails are queued in public.email_outbox by app_private.queue_email() from
-- inside the audited admin functions (no new triggers), then sent by the
-- email-notify edge function, which receives only the outbox row id: recipient,
-- template and params come from the database, so the function cannot be used to
-- mail arbitrary content. A job retries rows that were not sent.

create table if not exists public.email_outbox (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  template text not null,
  params jsonb not null default '{}'::jsonb,
  attempts integer not null default 0,
  sent_at timestamptz,
  last_error text,
  created_at timestamptz not null default now(),
  constraint email_outbox_template_check check (
    template in ('listing_hidden', 'account_suspended', 'warning', 'report_reviewed')
  )
);

-- Written and read only by the database functions and the edge function (service role).
alter table public.email_outbox enable row level security;
revoke all on table public.email_outbox from anon, authenticated;

create index if not exists email_outbox_user_id_idx on public.email_outbox (user_id);
create index if not exists email_outbox_unsent_idx on public.email_outbox (created_at) where sent_at is null;

create or replace function app_private.queue_email(p_user_id uuid, p_template text, p_params jsonb)
returns void language plpgsql security definer set search_path = '' as $$
declare v_id uuid;
begin
  if p_user_id is null then return; end if;
  insert into public.email_outbox (user_id, template, params)
  values (p_user_id, p_template, coalesce(p_params, '{}'::jsonb))
  returning id into v_id;

  -- Same operator switch as push: a test run can suppress delivery.
  if session_user <> 'postgres'
    or current_setting('app.suppress_push_delivery', true) is distinct from 'true' then
    perform net.http_post(
      url := 'https://ezxirkpgfpripjydcqnt.supabase.co/functions/v1/email-notify',
      headers := jsonb_build_object('Content-Type', 'application/json'),
      body := jsonb_build_object('id', v_id)
    );
  end if;
end;
$$;
revoke all on function app_private.queue_email(uuid, text, jsonb) from public, anon, authenticated;

-- Retry emails that were not sent (provider outage, secrets not set yet), for a day.
create or replace function app_private.retry_pending_emails()
returns integer language plpgsql security definer set search_path = '' as $$
declare v_row record; v_count integer := 0;
begin
  for v_row in
    select id from public.email_outbox
    where sent_at is null and attempts < 3
      and created_at < now() - interval '2 minutes'
      and created_at > now() - interval '1 day'
    order by created_at
    limit 50
  loop
    perform net.http_post(
      url := 'https://ezxirkpgfpripjydcqnt.supabase.co/functions/v1/email-notify',
      headers := jsonb_build_object('Content-Type', 'application/json'),
      body := jsonb_build_object('id', v_row.id)
    );
    v_count := v_count + 1;
  end loop;
  return v_count;
end;
$$;
revoke all on function app_private.retry_pending_emails() from public, anon, authenticated;

do $$
begin
  if exists (select 1 from cron.job where jobname = 'retry-pending-emails') then
    perform cron.unschedule('retry-pending-emails');
  end if;
  perform cron.schedule('retry-pending-emails', '*/10 * * * *', 'select app_private.retry_pending_emails()');
end;
$$;

-- ---------------------------------------------------------------------------
-- Same functions as before, with the email queued next to the notification
-- ---------------------------------------------------------------------------
create or replace function public.admin_set_apartment_visibility(
  p_apartment_id uuid, p_hide boolean, p_reason text
) returns void language plpgsql security definer set search_path = '' as $$
declare v_admin_id uuid; v_apartment public.apartments%rowtype;
begin
  if p_reason is null or length(btrim(p_reason)) < 3 or length(p_reason) > 500 then
    raise exception 'A reason between 3 and 500 characters is required.';
  end if;
  select id into v_admin_id from public.users
  where user_id = (select auth.uid()) and ('admin' = any(roles) and private.has_admin_second_step()) and not is_suspended;
  if v_admin_id is null then raise exception 'Admin access required.'; end if;

  select * into v_apartment from public.apartments where id = p_apartment_id for update;
  if not found or v_apartment.deleted_at is not null
    or v_apartment.is_hidden_by_admin = p_hide then
    raise exception 'Invalid listing visibility transition.';
  end if;
  update public.apartments set is_hidden_by_admin = p_hide,
    hidden_at = case when p_hide then now() else null end,
    hidden_by = case when p_hide then v_admin_id else null end,
    hidden_reason = case when p_hide then btrim(p_reason) else null end,
    updated_at = now()
  where id = p_apartment_id;
  insert into public.admin_audit_logs(admin_id, action, target_type, target_id, reason)
  values(v_admin_id, case when p_hide then 'APARTMENT_HIDDEN' else 'APARTMENT_RESTORED' end,
    'apartment', p_apartment_id, btrim(p_reason));

  if v_apartment.landlord_id is not null then
    perform public.create_notification(
      v_apartment.landlord_id,
      'system',
      case when p_hide then 'Listing hidden' else 'Listing restored' end,
      case when p_hide
        then '"' || coalesce(v_apartment.name, 'Your listing') || '" is hidden from search after a review: ' || btrim(p_reason)
        else '"' || coalesce(v_apartment.name, 'Your listing') || '" is visible in search again.'
      end,
      jsonb_build_object(
        'audience', 'landlord',
        'event', case when p_hide then 'listing_hidden' else 'listing_restored' end,
        'apartmentId', p_apartment_id
      )
    );
    if p_hide then
      perform app_private.queue_email(
        v_apartment.landlord_id, 'listing_hidden',
        jsonb_build_object('apartmentName', coalesce(v_apartment.name, 'Your listing'), 'reason', btrim(p_reason))
      );
    end if;
  end if;
end;
$$;

create or replace function public.admin_set_user_access(
  p_target_id uuid, p_suspend boolean, p_reason text, p_until timestamptz default null
) returns void language plpgsql security definer set search_path = '' as $$
declare v_admin_id uuid; v_target public.users%rowtype;
begin
  if p_reason is null or length(btrim(p_reason)) < 3 or length(p_reason) > 500 then
    raise exception 'A reason between 3 and 500 characters is required.';
  end if;
  if p_until is not null and (not p_suspend or p_until <= now() or p_until > now() + interval '1 year') then
    raise exception 'A temporary suspension must end within the next year.';
  end if;
  select id into v_admin_id from public.users
    where user_id = (select auth.uid()) and ('admin' = any(roles) and private.has_admin_second_step()) and not is_suspended;
  if v_admin_id is null then raise exception 'Admin access required.'; end if;
  select * into v_target from public.users where id = p_target_id for update;
  -- Only tenant/landlord profiles may be suspended; any admin role is off limits.
  if not found or 'admin' = any(v_target.roles)
      or not (v_target.roles && array['tenant', 'landlord'])
      or v_target.id = v_admin_id or v_target.is_suspended = p_suspend then
    raise exception 'Invalid account access transition.';
  end if;

  update public.users set is_suspended = p_suspend,
    suspended_at = case when p_suspend then now() else null end,
    suspended_by = case when p_suspend then v_admin_id else null end,
    suspension_reason = case when p_suspend then btrim(p_reason) else null end,
    suspended_until = case when p_suspend then p_until else null end,
    updated_at = now()
  where id = p_target_id;
  insert into public.admin_audit_logs(admin_id, action, target_type, target_id, reason)
  values(v_admin_id, case when p_suspend then 'USER_SUSPENDED' else 'USER_REACTIVATED' end,
    'user', p_target_id,
    case when p_until is not null
      then btrim(p_reason) || ' (until ' || to_char(p_until at time zone 'Asia/Manila', 'YYYY-MM-DD HH24:MI') || ' Manila)'
      else btrim(p_reason) end);

  perform public.create_notification(
    p_target_id,
    'system',
    case when p_suspend then 'Account suspended' else 'Account reactivated' end,
    case when p_suspend
      then 'Your account was suspended'
        || case when p_until is not null
             then ' until ' || to_char(p_until at time zone 'Asia/Manila', 'Mon DD, YYYY HH12:MI AM') || ' (Manila time)'
             else '' end
        || ': ' || btrim(p_reason)
      else 'Your account is active again. You can use APT as usual.'
    end,
    jsonb_build_object('event', case when p_suspend then 'account_suspended' else 'account_reactivated' end)
  );

  if p_suspend then
    perform app_private.queue_email(
      p_target_id, 'account_suspended',
      jsonb_build_object('reason', btrim(p_reason), 'until', p_until)
    );
  end if;

  -- Force a fresh sign-in so every device sees the suspension notice. Already
  -- issued tokens are denied protected data by the restrictive RLS policies.
  if p_suspend then
    delete from auth.sessions where user_id = v_target.user_id;
  end if;
end;
$$;

create or replace function app_private.notify_report_reviewed(p_report_id uuid)
returns void language plpgsql security definer set search_path = '' as $$
declare v_reporter uuid;
begin
  select reporter_id into v_reporter from public.user_reports where id = p_report_id;
  if v_reporter is null then return; end if;
  perform public.create_notification(
    v_reporter, 'system', 'Report reviewed',
    'Our team reviewed your report. Thank you for helping keep APT safe.',
    jsonb_build_object('event', 'report_reviewed', 'reportId', p_report_id)
  );
  perform app_private.queue_email(v_reporter, 'report_reviewed', '{}'::jsonb);
end;
$$;

create or replace function public.admin_act_on_report(
  p_report_id uuid,
  p_action text,
  p_note text,
  p_until timestamptz default null
)
returns void language plpgsql security definer set search_path = '' as $$
declare
  v_admin_id uuid;
  v_report public.user_reports%rowtype;
  v_apartment public.apartments%rowtype;
  v_target public.users%rowtype;
  v_taken text;
begin
  if p_note is null or length(btrim(p_note)) < 3 or length(p_note) > 500 then
    raise exception 'A note between 3 and 500 characters is required.';
  end if;
  if p_action not in ('warn', 'hide_listing', 'suspend_user') then
    raise exception 'Invalid report action.';
  end if;
  if p_until is not null and p_action <> 'suspend_user' then
    raise exception 'Only a suspension can have an end date.';
  end if;
  select id into v_admin_id from public.users
    where user_id = (select auth.uid()) and ('admin' = any(roles) and private.has_admin_second_step()) and not is_suspended;
  if v_admin_id is null then raise exception 'Admin access required.'; end if;

  select * into v_report from public.user_reports where id = p_report_id for update;
  if not found or v_report.status <> 'open' then
    raise exception 'This report is no longer open.';
  end if;

  if p_action = 'hide_listing' then
    if v_report.target_type <> 'apartment' or v_report.apartment_id is null then
      raise exception 'This report is not about a listing.';
    end if;
    select * into v_apartment from public.apartments where id = v_report.apartment_id;
    if not found or v_apartment.deleted_at is not null then
      raise exception 'This listing no longer exists.';
    end if;
    if not v_apartment.is_hidden_by_admin then
      perform public.admin_set_apartment_visibility(v_report.apartment_id, true, p_note);
    end if;
    v_taken := 'listing_hidden';
  elsif p_action = 'suspend_user' then
    select * into v_target from public.users where id = v_report.reported_user_id;
    if not found then
      raise exception 'This account no longer exists.';
    end if;
    if not v_target.is_suspended then
      perform public.admin_set_user_access(v_report.reported_user_id, true, p_note, p_until);
    end if;
    v_taken := 'user_suspended';
  else
    perform public.create_notification(
      v_report.reported_user_id,
      'system',
      'Warning from the APT team',
      case when v_report.apartment_id is not null and v_report.target_type = 'apartment'
        then 'A report about your listing was reviewed: '
        else 'A report about your account was reviewed: '
      end || btrim(p_note),
      jsonb_build_object('event', 'report_warning', 'reportId', v_report.id)
    );
    perform app_private.queue_email(
      v_report.reported_user_id, 'warning',
      jsonb_build_object('note', btrim(p_note), 'aboutListing', v_report.target_type = 'apartment')
    );
    v_taken := 'warned';
  end if;

  update public.user_reports
  set status = 'resolved', action_taken = v_taken, resolution_note = btrim(p_note),
      resolved_by = v_admin_id, resolved_at = now()
  where id = p_report_id;

  insert into public.admin_audit_logs (admin_id, action, target_type, target_id, reason)
  values (
    v_admin_id, 'USER_REPORT_RESOLVED', 'user', v_report.reported_user_id,
    '[' || v_taken || '] ' || btrim(p_note)
  );

  perform app_private.notify_report_reviewed(p_report_id);
end;
$$;
