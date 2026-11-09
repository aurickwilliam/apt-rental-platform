-- Temporary suspensions. An admin suspends an account permanently (no end date)
-- or until a date; a temporary one lifts itself when the date passes.
--
-- suspended_until is null while a suspension is permanent. Clients never write
-- it: the profile UPDATE grant is column-scoped, and only the audited RPC below
-- and the expiry job change it.

alter table public.users add column if not exists suspended_until timestamptz;

-- ---------------------------------------------------------------------------
-- 1. Access checks treat an expired suspension as lifted straight away; the
--    job below then clears the flag itself for the policies that read it.
-- ---------------------------------------------------------------------------
create or replace function app_private.is_active_user()
returns boolean language sql stable security definer set search_path = '' as $$
  select auth.uid() is not null and not exists (
    select 1 from public.users
    where user_id = auth.uid() and is_suspended
      and (suspended_until is null or suspended_until > now())
  );
$$;

create or replace function public.get_my_suspension_status()
returns jsonb language sql stable security definer set search_path = '' as $$
  select coalesce(
    (select jsonb_build_object(
        'suspended', u.is_suspended and (u.suspended_until is null or u.suspended_until > now()),
        'reason', u.suspension_reason,
        'until', u.suspended_until)
     from public.users u where u.user_id = (select auth.uid())),
    jsonb_build_object('suspended', false, 'reason', null, 'until', null)
  );
$$;

-- ---------------------------------------------------------------------------
-- 2. Suspend with an optional end date
-- ---------------------------------------------------------------------------
drop function if exists public.admin_set_user_access(uuid, boolean, text);

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
    where user_id = (select auth.uid()) and 'admin' = any(roles) and not is_suspended;
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
  -- Force a fresh sign-in so every device sees the suspension notice. Already
  -- issued tokens are denied protected data by the restrictive RLS policies.
  if p_suspend then
    delete from auth.sessions where user_id = v_target.user_id;
  end if;
end;
$$;
revoke all on function public.admin_set_user_access(uuid, boolean, text, timestamptz) from public, anon;
grant execute on function public.admin_set_user_access(uuid, boolean, text, timestamptz) to authenticated;

-- ---------------------------------------------------------------------------
-- 3. Report action: suspend for a number of days (null = permanent)
-- ---------------------------------------------------------------------------
-- Same body as 20261104144836, with an optional end date passed to the
-- suspension RPC and a note of how long it lasts.
drop function if exists public.admin_act_on_report(uuid, text, text);

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
  if not (select private.is_admin()) then
    raise exception 'Admin access required.';
  end if;
  select id into v_admin_id from public.users
    where user_id = (select auth.uid()) and 'admin' = any(roles) and not is_suspended;
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
    if v_report.reported_user_id is null then
      raise exception 'This account no longer exists.';
    end if;
    perform public.create_notification(
      v_report.reported_user_id,
      'system',
      'Warning from the APT team',
      case when v_report.apartment_id is not null
        then 'A report about your listing was reviewed: '
        else 'A report about your account was reviewed: '
      end || btrim(p_note),
      jsonb_build_object('reportId', v_report.id)
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
end;
$$;
revoke all on function public.admin_act_on_report(uuid, text, text, timestamptz) from public, anon;
grant execute on function public.admin_act_on_report(uuid, text, text, timestamptz) to authenticated;

-- ---------------------------------------------------------------------------
-- 4. Lift suspensions whose end date has passed (every minute)
-- ---------------------------------------------------------------------------
create or replace function app_private.lift_expired_suspensions()
returns integer language plpgsql security definer set search_path = '' as $$
declare v_count integer;
begin
  update public.users
  set is_suspended = false, suspended_at = null, suspended_by = null,
      suspension_reason = null, suspended_until = null, updated_at = now()
  where is_suspended and suspended_until is not null and suspended_until <= now();
  get diagnostics v_count = row_count;
  return v_count;
end;
$$;
revoke all on function app_private.lift_expired_suspensions() from public, anon, authenticated;

do $$
begin
  if exists (select 1 from cron.job where jobname = 'lift-expired-suspensions') then
    perform cron.unschedule('lift-expired-suspensions');
  end if;
  perform cron.schedule(
    'lift-expired-suspensions', '* * * * *', 'select app_private.lift_expired_suspensions()'
  );
end;
$$;
