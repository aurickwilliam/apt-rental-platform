-- Email for everyday account activity: rent dues and overdues, payments,
-- verification (pending, approved, rejected), tenant applications and
-- maintenance requests.
--
-- The audited notify_* functions and create_notification() stay untouched. One
-- trigger on public.notifications turns the listed notification titles into
-- outbox rows, so an email can only follow a notification the database already
-- produced. Verification "pending" has no notification for the person who
-- submitted, so three small triggers queue that email from the source tables.
--
-- Rules for every email here:
--   * The per-type switches in notification_preferences apply. A missing row means on.
--     push_enabled and notifications_enabled are other channels and do not apply.
--   * Suspended accounts get none of these. Moderation emails are queued elsewhere.
--   * Operator runs that suppress delivery, demo population included, queue nothing:
--     a queued row would be sent later by the retry job.
--   * A failure here never rolls back the payment, review or request that caused it.
--
-- Release order: deploy the email-notify function first, because it rejects
-- templates it does not know.

alter table public.email_outbox drop constraint email_outbox_template_check;
alter table public.email_outbox add constraint email_outbox_template_check check (template in (
  'listing_hidden', 'listing_restored', 'listing_review_declined', 'account_suspended',
  'account_reactivated', 'warning', 'report_reviewed', 'lease_renewal_update',
  'rent_reminder', 'payment_update', 'verification_update', 'application_update', 'maintenance_update'
));

-- Landlords are emailed about overdue rent only; the "due soon" and "due today"
-- reminders stay in-app for them, because they repeat for every unit each month.
create function app_private.notification_email_template(p_title text)
returns text language sql immutable set search_path = '' as $$
  select case p_title
    when 'Rent Due Soon' then 'rent_reminder'
    when 'Rent Due Today' then 'rent_reminder'
    when 'Rent Past Due' then 'rent_reminder'
    when 'Tenant Rent Overdue' then 'rent_reminder'
    when 'Payment Successful' then 'payment_update'
    when 'Payment Received' then 'payment_update'
    when 'Cash Payment Received' then 'payment_update'
    when 'Account verification approved' then 'verification_update'
    when 'Account verification rejected' then 'verification_update'
    when 'Passport document verified' then 'verification_update'
    when 'Passport document rejected' then 'verification_update'
    when 'Apartment verification approved' then 'verification_update'
    when 'Apartment verification rejected' then 'verification_update'
    when 'New Application' then 'application_update'
    when 'Application Approved' then 'application_update'
    when 'Application Rejected' then 'application_update'
    when 'New Maintenance Request' then 'maintenance_update'
    when 'Maintenance In Progress' then 'maintenance_update'
    when 'Maintenance Resolved' then 'maintenance_update'
    when 'Maintenance Cancelled' then 'maintenance_update'
    when 'Maintenance Update' then 'maintenance_update'
  end
$$;
revoke all on function app_private.notification_email_template(text) from public, anon, authenticated;

create function app_private.activity_email_allowed(p_user_id uuid, p_type text)
returns boolean language plpgsql stable security definer set search_path = '' as $$
declare v_allowed boolean;
begin
  if session_user = 'postgres'
    and current_setting('app.suppress_push_delivery', true) = 'true' then
    return false;
  end if;

  select not u.is_suspended and coalesce(
    case p_type
      when 'payment' then p.payment
      when 'maintenance' then p.maintenance
      when 'apartment' then p.apartment
      when 'system' then p.system
    end, true)
  into v_allowed
  from public.users u
  left join public.notification_preferences p on p.user_id = u.id
  where u.id = p_user_id;

  return coalesce(v_allowed, false);
end;
$$;
revoke all on function app_private.activity_email_allowed(uuid, text) from public, anon, authenticated;

create function app_private.email_on_notification()
returns trigger language plpgsql security definer set search_path = '' as $$
declare
  v_template text := app_private.notification_email_template(new.title);
  v_params jsonb;
  v_tenant_id uuid;
  v_apartment_name text;
begin
  if v_template is null then return new; end if;

  -- A tenant who cancels their own request does not need an email about it.
  if new.title = 'Maintenance Cancelled' and new.user_id = (
    select u.id from public.users u where u.user_id = (select auth.uid())
  ) then
    return new;
  end if;

  if app_private.activity_email_allowed(new.user_id, new.type) then
    v_params := jsonb_build_object('title', new.title, 'body', new.message);
    -- A rejection's notification message is the reviewer's reason.
    if v_template = 'verification_update' and new.title like '% rejected' then
      v_params := v_params || jsonb_build_object('reason', new.message);
    end if;
    perform app_private.queue_email(new.user_id, v_template, v_params);
  end if;

  -- The applicant has no notification for a new application: send a receipt.
  if new.title = 'New Application' then
    select ra.tenant_id, a.name into v_tenant_id, v_apartment_name
    from public.rental_application ra
    join public.apartments a on a.id = ra.apartment_id
    where ra.id = (new.data->>'applicationId')::uuid;

    if v_tenant_id is not null and app_private.activity_email_allowed(v_tenant_id, new.type) then
      perform app_private.queue_email(v_tenant_id, 'application_update', jsonb_build_object(
        'title', 'Application submitted',
        'body', 'We sent your application for ' || coalesce(v_apartment_name, 'the apartment')
          || ' to the landlord. It is now pending their review.'
      ));
    end if;
  end if;

  return new;
exception when others then
  -- SQLSTATE only: the message could carry a recipient's details.
  raise warning 'Activity email not queued (%)', sqlstate;
  return new;
end;
$$;
revoke all on function app_private.email_on_notification() from public, anon, authenticated;

create trigger email_on_notification
  after insert on public.notifications
  for each row execute function app_private.email_on_notification();

create function app_private.email_verification_pending()
returns trigger language plpgsql security definer set search_path = '' as $$
declare
  v_user_id uuid;
  v_title text;
  v_body text;
  v_apartment_name text;
begin
  if tg_table_name = 'user_verifications' then
    v_user_id := new.user_id;
    v_title := 'Account verification pending';
    v_body := 'We received your ID documents. Our team will review them and email you the result.';
  elsif tg_table_name = 'passport_documents' then
    v_user_id := new.user_id;
    v_title := 'Passport document pending';
    v_body := 'We received your document. Our team will review it and email you the result.';
  else
    select a.name into v_apartment_name from public.apartments a where a.id = new.apartment_id;
    v_user_id := new.landlord_id;
    v_title := 'Apartment verification pending';
    v_body := 'We received ' || coalesce(v_apartment_name, 'your apartment')
      || ' for verification. Our team will review it and email you the result.';
  end if;

  if app_private.activity_email_allowed(v_user_id, 'system') then
    perform app_private.queue_email(v_user_id, 'verification_update',
      jsonb_build_object('title', v_title, 'body', v_body));
  end if;
  return new;
exception when others then
  raise warning 'Verification email not queued (%)', sqlstate;
  return new;
end;
$$;
revoke all on function app_private.email_verification_pending() from public, anon, authenticated;

create trigger email_verification_pending
  after insert on public.user_verifications
  for each row when (new.status = 'pending')
  execute function app_private.email_verification_pending();

create trigger email_verification_pending
  after insert on public.apartment_verifications
  for each row when (new.status = 'pending')
  execute function app_private.email_verification_pending();

create trigger email_verification_pending
  after update of review_status on public.passport_documents
  for each row when (new.review_status = 'pending' and old.review_status is distinct from new.review_status)
  execute function app_private.email_verification_pending();

-- public.notifications is covered by the demo-population trigger audit, which
-- refuses to run while a trigger function there has not been reviewed.
do $$
begin
  if to_regclass('demo_population.audited_functions') is not null then
    insert into demo_population.audited_functions (name, hash)
    values (
      'app_private.email_on_notification',
      md5(pg_get_functiondef('app_private.email_on_notification()'::regprocedure))
    )
    on conflict (name) do update set hash = excluded.hash;
  end if;
end;
$$;
