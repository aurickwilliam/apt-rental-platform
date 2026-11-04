-- Follow-ups from the review of the report flow:
--   1. Hide listing is only allowed on reports filed about an apartment (a chat
--      report's apartment_id is just the conversation's context).
--   2. A chat report is again unique per (reporter, reported user), whatever the
--      conversation's apartment.
--   3. An expired temporary suspension is lifted at read time as well as by the
--      cron job, so the person is never past the suspended page yet still
--      blocked by policies that read users.is_suspended.
--   4. An automatic lift is audited (attributed to the admin who suspended).

-- ---------------------------------------------------------------------------
-- 2. Unique open reports
-- ---------------------------------------------------------------------------
drop index if exists public.user_reports_one_open_per_target;

-- Listing and profile reports: one per reporter and target (the listing for apartments).
create unique index user_reports_one_open_per_target
  on public.user_reports (
    reporter_id, reported_user_id, target_type,
    coalesce(apartment_id, '00000000-0000-0000-0000-000000000000'::uuid)
  )
  where status = 'open' and target_type <> 'user';

-- Chat reports: one per reporter and person, as before.
create unique index user_reports_one_open_per_chat_target
  on public.user_reports (reporter_id, reported_user_id)
  where status = 'open' and target_type = 'user';

-- ---------------------------------------------------------------------------
-- 3 + 4. Lift expired suspensions (all of them, or one person) with an audit row
-- ---------------------------------------------------------------------------
drop function if exists app_private.lift_expired_suspensions();

create or replace function app_private.lift_expired_suspensions(p_user_id uuid default null)
returns integer language plpgsql security definer set search_path = '' as $$
declare v_row record; v_count integer := 0;
begin
  for v_row in
    select id, suspended_by from public.users
    where is_suspended and suspended_until is not null and suspended_until <= now()
      and (p_user_id is null or id = p_user_id)
    for update
  loop
    update public.users
    set is_suspended = false, suspended_at = null, suspended_by = null,
        suspension_reason = null, suspended_until = null, updated_at = now()
    where id = v_row.id;
    v_count := v_count + 1;

    -- admin_id is required, so the row is attributed to the admin who set the
    -- suspension; the reason says it ended by itself.
    if v_row.suspended_by is not null then
      insert into public.admin_audit_logs(admin_id, action, target_type, target_id, reason)
      values (v_row.suspended_by, 'USER_REACTIVATED', 'user', v_row.id,
        'Suspension ended automatically');
    end if;

    perform public.create_notification(
      v_row.id, 'system', 'Suspension ended',
      'Your suspension has ended. You can use APT as usual.',
      jsonb_build_object('event', 'account_reactivated')
    );
  end loop;
  return v_count;
end;
$$;
revoke all on function app_private.lift_expired_suspensions(uuid) from public, anon, authenticated;

-- Reading your own status lifts an expired suspension first, so it never
-- depends on the cron job having run.
create or replace function public.get_my_suspension_status()
returns jsonb language plpgsql security definer set search_path = '' as $$
declare v_id uuid; v_result jsonb;
begin
  select id into v_id from public.users where user_id = (select auth.uid());
  if v_id is null then
    return jsonb_build_object('suspended', false, 'reason', null, 'until', null);
  end if;
  perform app_private.lift_expired_suspensions(v_id);
  select jsonb_build_object(
      'suspended', u.is_suspended and (u.suspended_until is null or u.suspended_until > now()),
      'reason', u.suspension_reason,
      'until', u.suspended_until)
    into v_result
  from public.users u where u.id = v_id;
  return v_result;
end;
$$;

-- ---------------------------------------------------------------------------
-- 1. Hide listing only for apartment reports
-- ---------------------------------------------------------------------------
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
