-- Phase 1 of the report flow: people can report an apartment, a landlord
-- profile or a tenant profile (not only someone they chatted with), and admins
-- can act on a report (warn, hide the listing, suspend the account) in one
-- audited step.
--
-- An apartment report names the listing in apartment_id and its owner in
-- reported_user_id, so the existing admin joins and account links keep working.

-- ---------------------------------------------------------------------------
-- 1. Table changes
-- ---------------------------------------------------------------------------
alter table public.user_reports
  add column if not exists target_type text not null default 'user',
  add column if not exists action_taken text not null default 'none';

alter table public.user_reports drop constraint if exists user_reports_target_type_check;
alter table public.user_reports add constraint user_reports_target_type_check
  check (target_type in ('user', 'apartment', 'landlord', 'tenant'));

alter table public.user_reports drop constraint if exists user_reports_action_taken_check;
alter table public.user_reports add constraint user_reports_action_taken_check
  check (action_taken in ('none', 'warned', 'listing_hidden', 'user_suspended'));

alter table public.user_reports drop constraint if exists user_reports_reason_check;
alter table public.user_reports add constraint user_reports_reason_check check (
  reason in (
    'spam', 'scam', 'harassment', 'inappropriate', 'fake_profile', 'other',
    'fake_listing', 'incorrect_info', 'unavailable', 'inappropriate_photos'
  )
);

-- One open report per reporter and target. The old index covered only chat
-- reports (reporter + user); a listing report must not block a profile report
-- about the same landlord, so the target type and listing are part of the key.
drop index if exists public.user_reports_one_open_per_pair;
create unique index if not exists user_reports_one_open_per_target
  on public.user_reports (
    reporter_id, reported_user_id, target_type,
    coalesce(apartment_id, '00000000-0000-0000-0000-000000000000'::uuid)
  )
  where status = 'open';

create index if not exists user_reports_target_type_status_idx
  on public.user_reports (target_type, status, created_at desc);

-- ---------------------------------------------------------------------------
-- 2. Shared checks
-- ---------------------------------------------------------------------------
-- At most 10 new reports per person per day, so reporting cannot be used to spam admins.
create or replace function app_private.assert_report_rate_limit(p_reporter_id uuid)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if (
    select count(*) from public.user_reports
    where reporter_id = p_reporter_id and created_at > now() - interval '1 day'
  ) >= 10 then
    raise exception 'You have sent many reports today. Please try again tomorrow.' using errcode = 'P0001';
  end if;
end;
$$;
revoke all on function app_private.assert_report_rate_limit(uuid) from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- 3. Report an apartment
-- ---------------------------------------------------------------------------
create or replace function public.report_apartment(
  p_apartment_id uuid,
  p_reason text,
  p_details text default null
)
returns void language plpgsql security definer set search_path = '' as $$
declare
  v_user_id uuid := app_private.current_active_user_id();
  v_details text := nullif(btrim(coalesce(p_details, '')), '');
  v_landlord_id uuid;
begin
  if v_user_id is null then
    raise exception 'not authenticated';
  end if;
  if p_reason not in (
    'scam', 'fake_listing', 'incorrect_info', 'unavailable', 'inappropriate_photos', 'other'
  ) then
    raise exception 'Choose a reason for your report.' using errcode = '22023';
  end if;
  if p_reason = 'other' and v_details is null then
    raise exception 'Tell us what happened.' using errcode = '22023';
  end if;
  if char_length(coalesce(v_details, '')) > 1000 then
    raise exception 'Keep the details under 1000 characters.' using errcode = '22023';
  end if;

  select a.landlord_id into v_landlord_id
  from public.apartments a
  where a.id = p_apartment_id and a.deleted_at is null and not a.is_hidden_by_admin;
  if v_landlord_id is null then
    raise exception 'This listing is not available to report.' using errcode = '22023';
  end if;
  if v_landlord_id = v_user_id then
    raise exception 'You cannot report your own listing.' using errcode = '22023';
  end if;

  perform app_private.assert_report_rate_limit(v_user_id);

  begin
    insert into public.user_reports (
      reporter_id, reported_user_id, apartment_id, target_type, reason, details
    ) values (
      v_user_id, v_landlord_id, p_apartment_id, 'apartment', p_reason, v_details
    );
  exception when unique_violation then
    raise exception 'You already reported this listing. Our team is reviewing it.' using errcode = 'P0001';
  end;
end;
$$;
revoke all on function public.report_apartment(uuid, text, text) from public, anon;
grant execute on function public.report_apartment(uuid, text, text) to authenticated;

-- ---------------------------------------------------------------------------
-- 4. Report a landlord or tenant profile (no prior chat needed)
-- ---------------------------------------------------------------------------
create or replace function public.report_profile(
  p_reported_user_id uuid,
  p_target_type text,
  p_reason text,
  p_details text default null
)
returns void language plpgsql security definer set search_path = '' as $$
declare
  v_user_id uuid := app_private.current_active_user_id();
  v_details text := nullif(btrim(coalesce(p_details, '')), '');
  v_roles text[];
begin
  if v_user_id is null then
    raise exception 'not authenticated';
  end if;
  if p_target_type not in ('landlord', 'tenant') then
    raise exception 'Invalid report target.' using errcode = '22023';
  end if;
  if p_reason not in ('spam', 'scam', 'harassment', 'inappropriate', 'fake_profile', 'other') then
    raise exception 'Choose a reason for your report.' using errcode = '22023';
  end if;
  if p_reason = 'other' and v_details is null then
    raise exception 'Tell us what happened.' using errcode = '22023';
  end if;
  if char_length(coalesce(v_details, '')) > 1000 then
    raise exception 'Keep the details under 1000 characters.' using errcode = '22023';
  end if;

  select roles into v_roles from public.users where id = p_reported_user_id;
  if p_reported_user_id is null or p_reported_user_id = v_user_id
      or v_roles is null or 'admin' = any(v_roles)
      or not (p_target_type = any(v_roles)) then
    raise exception 'This profile is not available to report.' using errcode = '22023';
  end if;

  perform app_private.assert_report_rate_limit(v_user_id);

  begin
    insert into public.user_reports (reporter_id, reported_user_id, target_type, reason, details)
    values (v_user_id, p_reported_user_id, p_target_type, p_reason, v_details);
  exception when unique_violation then
    raise exception 'You already reported this person. Our team is reviewing it.' using errcode = 'P0001';
  end;
end;
$$;
revoke all on function public.report_profile(uuid, text, text, text) from public, anon;
grant execute on function public.report_profile(uuid, text, text, text) to authenticated;

-- ---------------------------------------------------------------------------
-- 5. Admin: act on a report and close it in one transaction
-- ---------------------------------------------------------------------------
-- warn: notifies the reported person. hide_listing: hides the reported listing.
-- suspend_user: suspends the reported account. Each reuses the audited admin
-- RPCs, so their own rules (not an admin, tenant/landlord only) still apply,
-- and the report is closed with what was done (action_taken).
create or replace function public.admin_act_on_report(
  p_report_id uuid,
  p_action text,
  p_note text
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
      perform public.admin_set_user_access(v_report.reported_user_id, true, p_note);
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
revoke all on function public.admin_act_on_report(uuid, text, text) from public, anon;
grant execute on function public.admin_act_on_report(uuid, text, text) to authenticated;
