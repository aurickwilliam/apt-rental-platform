-- Review requests: a landlord whose listing an admin hid can say it was fixed
-- and ask for a review. The request is a user_reports row of type
-- 'review_request' (reporter and reported are both the landlord), so it shows in
-- the admin Reports page next to the other reports. An admin answers it with
-- "restore listing" or "keep hidden"; the landlord is told either way.

-- ---------------------------------------------------------------------------
-- 1. Table changes
-- ---------------------------------------------------------------------------
alter table public.user_reports drop constraint if exists user_reports_not_self;
alter table public.user_reports add constraint user_reports_not_self
  check (reporter_id <> reported_user_id or target_type = 'review_request');

alter table public.user_reports drop constraint if exists user_reports_target_type_check;
alter table public.user_reports add constraint user_reports_target_type_check
  check (target_type in ('user', 'apartment', 'landlord', 'tenant', 'review_request'));

alter table public.user_reports drop constraint if exists user_reports_reason_check;
alter table public.user_reports add constraint user_reports_reason_check check (
  reason in (
    'spam', 'scam', 'harassment', 'inappropriate', 'fake_profile', 'other',
    'fake_listing', 'incorrect_info', 'unavailable', 'inappropriate_photos',
    'review_request'
  )
);

alter table public.user_reports drop constraint if exists user_reports_action_taken_check;
alter table public.user_reports add constraint user_reports_action_taken_check
  check (action_taken in (
    'none', 'warned', 'listing_hidden', 'user_suspended', 'listing_restored', 'listing_kept_hidden'
  ));

alter table public.email_outbox drop constraint if exists email_outbox_template_check;
alter table public.email_outbox add constraint email_outbox_template_check check (
  template in (
    'listing_hidden', 'listing_restored', 'listing_review_declined', 'account_suspended',
    'account_reactivated', 'warning', 'report_reviewed'
  )
);

-- ---------------------------------------------------------------------------
-- 2. The landlord asks for a review
-- ---------------------------------------------------------------------------
create or replace function public.request_listing_review(p_apartment_id uuid, p_note text)
returns void language plpgsql security definer set search_path = '' as $$
declare
  v_user_id uuid := app_private.current_active_user_id();
  v_note text := nullif(btrim(coalesce(p_note, '')), '');
  v_apartment public.apartments%rowtype;
  v_request_id uuid;
  v_admin record;
begin
  if v_user_id is null then
    raise exception 'not authenticated';
  end if;
  if v_note is null or char_length(v_note) < 3 then
    raise exception 'Tell us what you fixed.' using errcode = '22023';
  end if;
  if char_length(v_note) > 1000 then
    raise exception 'Keep the note under 1000 characters.' using errcode = '22023';
  end if;

  select * into v_apartment from public.apartments where id = p_apartment_id;
  if not found or v_apartment.deleted_at is not null or v_apartment.landlord_id <> v_user_id then
    raise exception 'This listing is not available.' using errcode = '22023';
  end if;
  if not v_apartment.is_hidden_by_admin then
    raise exception 'This listing is not hidden.' using errcode = '22023';
  end if;

  perform app_private.assert_report_rate_limit(v_user_id);

  begin
    insert into public.user_reports (
      reporter_id, reported_user_id, apartment_id, target_type, reason, details
    ) values (
      v_user_id, v_user_id, p_apartment_id, 'review_request', 'review_request', v_note
    ) returning id into v_request_id;
  exception when unique_violation then
    raise exception 'You already asked for a review. Our team will answer soon.' using errcode = 'P0001';
  end;

  for v_admin in
    select id from public.users where 'admin' = any(roles) and not is_suspended
  loop
    perform public.create_notification(
      v_admin.id, 'system', 'Listing review requested',
      'A landlord asked for a review of "' || coalesce(v_apartment.name, 'a hidden listing') || '".',
      jsonb_build_object('audience', 'admin', 'event', 'listing_review_requested',
        'reportId', v_request_id, 'apartmentId', p_apartment_id)
    );
  end loop;
end;
$$;
revoke all on function public.request_listing_review(uuid, text) from public, anon;
grant execute on function public.request_listing_review(uuid, text) to authenticated;

-- ---------------------------------------------------------------------------
-- 3. What the landlord sees about a hidden listing
-- ---------------------------------------------------------------------------
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
revoke all on function public.get_listing_review_state(uuid) from public, anon;
grant execute on function public.get_listing_review_state(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- 4. Admin functions: restoring answers an open request; two new report actions
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
  select id into v_admin_id from public.users
    where user_id = (select auth.uid()) and ('admin' = any(roles) and private.has_admin_second_step()) and not is_suspended;
  if v_admin_id is null then raise exception 'Admin access required.'; end if;

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
