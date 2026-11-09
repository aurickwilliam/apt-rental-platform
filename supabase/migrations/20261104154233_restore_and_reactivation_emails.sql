-- Email for the two reversals: a restored listing and a reactivated account
-- (by an admin, or when a temporary suspension ends on its own).

alter table public.email_outbox drop constraint if exists email_outbox_template_check;
alter table public.email_outbox add constraint email_outbox_template_check check (
  template in (
    'listing_hidden', 'listing_restored', 'account_suspended', 'account_reactivated',
    'warning', 'report_reviewed'
  )
);

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
    perform app_private.queue_email(v_row.id, 'account_reactivated', '{"automatic": true}'::jsonb);
  end loop;
  return v_count;
end;
$$;
revoke all on function app_private.lift_expired_suspensions(uuid) from public, anon, authenticated;
