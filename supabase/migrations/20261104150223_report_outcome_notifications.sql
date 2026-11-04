-- Phase 2 of the report flow: tell people what happened.
--   * the landlord, when a listing is hidden or restored
--   * the person, when their account is suspended, reactivated or a temporary
--     suspension ends on its own
--   * the reporter, when an admin has reviewed their report (the outcome is
--     never revealed to them)
--
-- Notifications are written inside the audited admin functions, never by new
-- triggers, so the demo-population trigger audit is untouched. None of these
-- rows carries a `screen`: the audience rules map screen 'apartment' to the
-- tenant portal, so a landlord notice names its audience in the payload.
--
-- This migration also restores the admin second-step check on
-- admin_set_user_access(), which 20261104145438 redefined without it (every
-- admin_* function must call private.has_admin_second_step()).

-- ---------------------------------------------------------------------------
-- 1. Hide / restore a listing -> notify the landlord
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
  end if;
end;
$$;

-- ---------------------------------------------------------------------------
-- 2. Suspend / reactivate -> notify the account
--    (push still reaches a suspended device; the row is readable once the
--    suspension ends)
-- ---------------------------------------------------------------------------
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

  -- Force a fresh sign-in so every device sees the suspension notice. Already
  -- issued tokens are denied protected data by the restrictive RLS policies.
  if p_suspend then
    delete from auth.sessions where user_id = v_target.user_id;
  end if;
end;
$$;
revoke all on function public.admin_set_user_access(uuid, boolean, text, timestamptz) from public, anon;
grant execute on function public.admin_set_user_access(uuid, boolean, text, timestamptz) to authenticated;

-- A temporary suspension that ran out lifts itself; tell the person.
create or replace function app_private.lift_expired_suspensions()
returns integer language plpgsql security definer set search_path = '' as $$
declare v_id uuid; v_count integer := 0;
begin
  for v_id in
    update public.users
    set is_suspended = false, suspended_at = null, suspended_by = null,
        suspension_reason = null, suspended_until = null, updated_at = now()
    where is_suspended and suspended_until is not null and suspended_until <= now()
    returning id
  loop
    v_count := v_count + 1;
    perform public.create_notification(
      v_id, 'system', 'Suspension ended',
      'Your suspension has ended. You can use APT as usual.',
      jsonb_build_object('event', 'account_reactivated')
    );
  end loop;
  return v_count;
end;
$$;
revoke all on function app_private.lift_expired_suspensions() from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- 3. Reporter: "we reviewed your report"
-- ---------------------------------------------------------------------------
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
end;
$$;
revoke all on function app_private.notify_report_reviewed(uuid) from public, anon, authenticated;

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
  select id into v_admin_id from public.users
    where user_id = (select auth.uid()) and ('admin' = any(roles) and private.has_admin_second_step()) and not is_suspended;
  if v_admin_id is null then raise exception 'Admin access required.'; end if;

  select * into v_report from public.user_reports where id = p_report_id for update;
  if not found or v_report.status <> 'open' then
    raise exception 'This report is no longer open.';
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

-- admin_act_on_report: same as before, plus the reporter notice at the end.
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
    if v_report.apartment_id is null then
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
      case when v_report.apartment_id is not null
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
