-- Follow-ups from the second review of the report flow:
--   * Reports list open reports first (status_rank), so one waiting for a decision
--     is never buried under closed ones.
--   * admin_resolve_user_report refuses review requests (they are answered with
--     Restore listing / Keep hidden).
--   * get_listing_review_state ignores a request made before the listing was
--     last hidden, so an old "declined" message never shows on a new hide.
--   * One helper, app_private.require_admin(), holds the admin + second-step
--     check, so the admin functions no longer each copy it.
--   * The edge function base URL comes from the app.edge_functions_url setting
--     (falls back to the hosted project), so another environment can point
--     email-notify at its own project.

alter table public.user_reports
  add column if not exists status_rank smallint
  generated always as (case when status = 'open' then 0 else 1 end) stored;
create index if not exists user_reports_status_rank_created_at_idx
  on public.user_reports (status_rank, created_at desc);

create or replace function app_private.require_admin()
returns uuid language plpgsql stable security definer set search_path = '' as $$
declare v_admin_id uuid;
begin
  select id into v_admin_id from public.users
  where user_id = (select auth.uid())
    and ('admin' = any(roles) and private.has_admin_second_step()) and not is_suspended;
  if v_admin_id is null then raise exception 'Admin access required.'; end if;
  return v_admin_id;
end;
$$;
revoke all on function app_private.require_admin() from public, anon, authenticated;

create or replace function app_private.edge_function_url(p_name text)
returns text language sql stable set search_path = '' as $$
  select coalesce(
    nullif(current_setting('app.edge_functions_url', true), ''),
    'https://ezxirkpgfpripjydcqnt.supabase.co/functions/v1'
  ) || '/' || p_name;
$$;
revoke all on function app_private.edge_function_url(text) from public, anon, authenticated;

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
      url := app_private.edge_function_url('email-notify'),
      headers := jsonb_build_object('Content-Type', 'application/json'),
      body := jsonb_build_object('id', v_id)
    );
  end if;
end;
$$;

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
      url := app_private.edge_function_url('email-notify'),
      headers := jsonb_build_object('Content-Type', 'application/json'),
      body := jsonb_build_object('id', v_row.id)
    );
    v_count := v_count + 1;
  end loop;
  return v_count;
end;
$$;

create or replace function public.get_listing_review_state(p_apartment_id uuid)
returns jsonb language plpgsql stable security definer set search_path = '' as $$
declare
  v_user_id uuid := app_private.current_active_user_id();
  v_apartment public.apartments%rowtype;
  v_request public.user_reports%rowtype;
begin
  if v_user_id is null then return null; end if;
  select * into v_apartment from public.apartments where id = p_apartment_id;
  if not found or v_apartment.landlord_id <> v_user_id then return null; end if;

  select * into v_request from public.user_reports
  where apartment_id = p_apartment_id and target_type = 'review_request' and reporter_id = v_user_id
    -- Only a request made since the listing was last hidden is about this hide.
    and (v_apartment.hidden_at is null or created_at >= v_apartment.hidden_at)
  order by created_at desc limit 1;

  return jsonb_build_object(
    'hidden', v_apartment.is_hidden_by_admin,
    'reason', case when v_apartment.is_hidden_by_admin then v_apartment.hidden_reason end,
    'hiddenAt', case when v_apartment.is_hidden_by_admin then v_apartment.hidden_at end,
    'request', case when v_request.id is null then null else jsonb_build_object(
      'status', v_request.status,
      'note', v_request.details,
      'decisionNote', v_request.resolution_note,
      'createdAt', v_request.created_at,
      'resolvedAt', v_request.resolved_at
    ) end
  );
end;
$$;

create or replace function public.admin_set_apartment_visibility(
  p_apartment_id uuid, p_hide boolean, p_reason text
) returns void language plpgsql security definer set search_path = '' as $$
declare v_admin_id uuid; v_apartment public.apartments%rowtype;
begin
  if p_reason is null or length(btrim(p_reason)) < 3 or length(p_reason) > 500 then
    raise exception 'A reason between 3 and 500 characters is required.';
  end if;
  v_admin_id := app_private.require_admin();

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

  -- A restored listing answers any review request still open for it.
  if not p_hide then
    update public.user_reports
    set status = 'resolved', action_taken = 'listing_restored',
        resolution_note = 'Listing restored by an admin.',
        resolved_by = v_admin_id, resolved_at = now()
    where apartment_id = p_apartment_id and target_type = 'review_request' and status = 'open';
  end if;

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
    else
      perform app_private.queue_email(
        v_apartment.landlord_id, 'listing_restored',
        jsonb_build_object('apartmentName', coalesce(v_apartment.name, 'Your listing'))
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
  v_admin_id := app_private.require_admin();
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
  else
    perform app_private.queue_email(p_target_id, 'account_reactivated', '{}'::jsonb);
  end if;

  -- Force a fresh sign-in so every device sees the suspension notice. Already
  -- issued tokens are denied protected data by the restrictive RLS policies.
  if p_suspend then
    delete from auth.sessions where user_id = v_target.user_id;
  end if;
end;
$$;

create or replace function public.admin_resolve_user_report(
  p_report_id uuid, p_status text, p_note text
) returns void language plpgsql security definer set search_path = '' as $$
declare
  v_admin_id uuid;
  v_report public.user_reports%rowtype;
begin
  if p_note is null or length(btrim(p_note)) < 3 or length(p_note) > 500 then
    raise exception 'A note between 3 and 500 characters is required.';
  end if;
  if p_status not in ('resolved', 'dismissed') then
    raise exception 'Invalid report decision.';
  end if;
  v_admin_id := app_private.require_admin();

  select * into v_report from public.user_reports where id = p_report_id for update;
  if not found or v_report.status <> 'open' then
    raise exception 'This report is no longer open.';
  end if;
  -- Review requests are answered with Restore listing or Keep hidden (admin_act_on_report).
  if v_report.target_type = 'review_request' then
    raise exception 'Answer a review request with Restore listing or Keep hidden.';
  end if;

  update public.user_reports
  set status = p_status, resolution_note = btrim(p_note),
      resolved_by = v_admin_id, resolved_at = now()
  where id = p_report_id;

  insert into public.admin_audit_logs (admin_id, action, target_type, target_id, reason)
  values (
    v_admin_id,
    case when p_status = 'resolved' then 'USER_REPORT_RESOLVED' else 'USER_REPORT_DISMISSED' end,
    'user', v_report.reported_user_id, btrim(p_note)
  );

  perform app_private.notify_report_reviewed(p_report_id);
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
  if p_action not in ('warn', 'hide_listing', 'suspend_user', 'restore_listing', 'keep_hidden') then
    raise exception 'Invalid report action.';
  end if;
  if p_until is not null and p_action <> 'suspend_user' then
    raise exception 'Only a suspension can have an end date.';
  end if;
  v_admin_id := app_private.require_admin();

  select * into v_report from public.user_reports where id = p_report_id for update;
  if not found or v_report.status <> 'open' then
    raise exception 'This report is no longer open.';
  end if;

  -- A review request is answered only by restoring or keeping the listing hidden.
  if (v_report.target_type = 'review_request') <> (p_action in ('restore_listing', 'keep_hidden')) then
    raise exception 'This action does not apply to this report.';
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
  elsif p_action = 'restore_listing' then
    select * into v_apartment from public.apartments where id = v_report.apartment_id;
    if not found or v_apartment.deleted_at is not null then
      raise exception 'This listing no longer exists.';
    end if;
    if v_apartment.is_hidden_by_admin then
      perform public.admin_set_apartment_visibility(v_report.apartment_id, false, p_note);
    end if;
    v_taken := 'listing_restored';
  elsif p_action = 'keep_hidden' then
    select * into v_apartment from public.apartments where id = v_report.apartment_id;
    perform public.create_notification(
      v_report.reporter_id, 'system', 'Review request declined',
      'We reviewed your request for "' || coalesce(v_apartment.name, 'your listing') || '" and are keeping it hidden: ' || btrim(p_note),
      jsonb_build_object('audience', 'landlord', 'event', 'listing_review_declined',
        'apartmentId', v_report.apartment_id)
    );
    perform app_private.queue_email(
      v_report.reporter_id, 'listing_review_declined',
      jsonb_build_object('apartmentName', coalesce(v_apartment.name, 'Your listing'), 'note', btrim(p_note))
    );
    v_taken := 'listing_kept_hidden';
  elsif p_action = 'suspend_user' then
    select * into v_target from public.users where id = v_report.reported_user_id;
    if not found then
      raise exception 'This account no longer exists.';
    end if;
    if not v_target.is_suspended then
      perform public.admin_set_user_access(v_report.reported_user_id, true, p_note, p_until);
    end if;
    v_taken := 'user_suspended';
  else -- warn
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
  set status = case when p_action = 'keep_hidden' then 'dismissed' else 'resolved' end,
      action_taken = v_taken, resolution_note = btrim(p_note),
      resolved_by = v_admin_id, resolved_at = now()
  where id = p_report_id;

  insert into public.admin_audit_logs (admin_id, action, target_type, target_id, reason)
  values (
    v_admin_id, 'USER_REPORT_RESOLVED', 'user', v_report.reported_user_id,
    '[' || v_taken || '] ' || btrim(p_note)
  );

  -- A review request already got its own answer above (or the restore notice).
  if v_report.target_type <> 'review_request' then
    perform app_private.notify_report_reviewed(p_report_id);
  end if;
end;
$$;
