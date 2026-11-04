-- Report flow: reporting a listing or a profile, admin actions, review requests,
-- temporary suspension and the queued emails.
-- Covers 20261104144836 .. 20261104230000 (report_apartment, report_profile,
-- admin_act_on_report, admin_resolve_user_report, request_listing_review,
-- get_listing_review_state, admin_set_user_access, lift_expired_suspensions,
-- queue_email, retry_pending_emails, require_admin).
--
-- Run in an isolated test database or transaction (rolls back). Requires pgtap.
-- Never run this against production records: it inserts fixture users, a listing,
-- reports and notifications. Push delivery is suppressed for the transaction.
begin;
set local app.suppress_push_delivery = 'true';
select plan(51);

create temporary table rf as
  select gen_random_uuid() admin_auth, gen_random_uuid() landlord_auth,
    gen_random_uuid() tenant_auth, gen_random_uuid() apartment_id;
grant select on rf to anon, authenticated, service_role;

insert into auth.users(id)
  select admin_auth from rf union all
  select landlord_auth from rf union all
  select tenant_auth from rf;

-- Sign-up only creates a profile row for Google accounts, so the fixtures add theirs.
-- Registration inserts are limited to unverified tenants; roles and status are set after.
delete from public.users where user_id in
  (select admin_auth from rf union all select landlord_auth from rf union all select tenant_auth from rf);
insert into public.users(user_id, first_name, last_name, mobile_number, preferences)
  select admin_auth, 'Ada', 'Admin', '09171234701', '{}'::jsonb from rf union all
  select landlord_auth, 'Lee', 'Landlord', '09171234702', '{}'::jsonb from rf union all
  select tenant_auth, 'Tia', 'Tenant', '09171234703',
    '{"selectedCities": ["Caloocan"], "budgetMin": 5000, "budgetMax": 14999, "bedroomCount": "1-2 Bedrooms"}'::jsonb from rf;
update public.users set roles = '{admin}', account_status = 'verified', preferences = null
  where user_id = (select admin_auth from rf);
update public.users set roles = '{landlord}', account_status = 'verified', preferences = null
  where user_id = (select landlord_auth from rf);
update public.users set account_status = 'verified' where user_id = (select tenant_auth from rf);
create temporary table rf_ids as
  select (select id from public.users where user_id = admin_auth) admin_id,
    (select id from public.users where user_id = landlord_auth) landlord_id,
    (select id from public.users where user_id = tenant_auth) tenant_id,
    apartment_id
  from rf;
grant select on rf_ids to anon, authenticated, service_role;

insert into public.apartments(
  id, landlord_id, name, description, monthly_rent, type,
  street_address, barangay, city, province, no_bedrooms, no_bathrooms, area_sqm,
  latitude, longitude
) select apartment_id, landlord_id, 'Fixture Flat', 'Fixture', 10000, 'apartment',
  'Test', 'Test', 'Malabon', 'Metro Manila', 1, 1, 20, 14.6689, 120.9542 from rf_ids;

-- Acts as one of the fixture accounts; admins also carry the second-step claim.
create function pg_temp.act_as(p_auth uuid, p_aal text default 'aal1') returns void language plpgsql as $$
begin
  perform set_config('request.jwt.claim.sub', p_auth::text, true);
  perform set_config('request.jwt.claims',
    json_build_object('sub', p_auth, 'role', 'authenticated', 'aal', p_aal)::text, true);
end;
$$;

-- Every lookup below is scoped to the fixture accounts and listing, so the file
-- also behaves in a database that already holds reports and emails.
create function pg_temp.report_id(p_reason text) returns uuid language sql as $$
  select id from public.user_reports
  where reason = p_reason and reporter_id = (select tenant_id from rf_ids)
    and reported_user_id = (select landlord_id from rf_ids)
  order by created_at desc limit 1;
$$;
create function pg_temp.request_id() returns uuid language sql as $$
  select id from public.user_reports
  where target_type = 'review_request' and apartment_id = (select apartment_id from rf_ids)
  order by created_at desc limit 1;
$$;
create function pg_temp.request_outcome() returns text language sql as $$
  select status || ':' || action_taken from public.user_reports where id = pg_temp.request_id();
$$;

-- ---------------------------------------------------------------------------
-- Privileges
-- ---------------------------------------------------------------------------
select ok(has_function_privilege('authenticated', 'public.report_apartment(uuid,text,text)', 'EXECUTE'), 'signed-in users can report a listing');
select ok(not has_function_privilege('anon', 'public.report_apartment(uuid,text,text)', 'EXECUTE'), 'anonymous visitors cannot report');
select ok(not has_function_privilege('authenticated', 'app_private.queue_email(uuid,text,jsonb)', 'EXECUTE'), 'clients cannot queue emails');
select ok(not has_function_privilege('authenticated', 'app_private.require_admin()', 'EXECUTE'), 'clients cannot call the admin helper');
select ok(not has_table_privilege('authenticated', 'public.email_outbox', 'SELECT'), 'clients cannot read the email outbox');
select is(app_private.edge_function_url('email-notify') ~ '/email-notify$', true, 'edge function URL ends with the function name');

-- ---------------------------------------------------------------------------
-- Reporting a listing and a profile
-- ---------------------------------------------------------------------------
select pg_temp.act_as((select tenant_auth from rf));
set local role authenticated;
select lives_ok($$select public.report_apartment((select apartment_id from rf_ids), 'incorrect_info', 'Wrong rent')$$, 'a tenant reports a listing');
select throws_ok($$select public.report_apartment((select apartment_id from rf_ids), 'scam', null)$$, 'P0001',
  'You already reported this listing. Our team is reviewing it.', 'a second open report on the same listing is refused');
select lives_ok($$select public.report_profile((select landlord_id from rf_ids), 'landlord', 'scam', 'Asked for money')$$, 'a tenant reports a landlord profile');
select throws_ok($$select public.report_profile((select landlord_id from rf_ids), 'tenant', 'scam', null)$$, '22023',
  'This profile is not available to report.', 'a profile cannot be reported as a role it does not hold');
select throws_ok($$select public.report_profile((select admin_id from rf_ids), 'landlord', 'scam', null)$$, '22023',
  'This profile is not available to report.', 'an admin cannot be reported');
reset role;

select pg_temp.act_as((select landlord_auth from rf));
set local role authenticated;
select throws_ok($$select public.report_apartment((select apartment_id from rf_ids), 'scam', null)$$, '22023',
  'You cannot report your own listing.', 'a landlord cannot report their own listing');
reset role;

select is((select target_type from public.user_reports where id = pg_temp.report_id('incorrect_info')), 'apartment', 'a listing report is typed apartment');
select is((select reported_user_id from public.user_reports where id = pg_temp.report_id('incorrect_info')), (select landlord_id from rf_ids), 'a listing report names the owner');
select is((select status_rank from public.user_reports where id = pg_temp.report_id('incorrect_info')), 0::smallint, 'an open report ranks first');

-- ---------------------------------------------------------------------------
-- Admin actions
-- ---------------------------------------------------------------------------
select pg_temp.act_as((select admin_auth from rf), 'aal2');
set local role authenticated;
select throws_ok($$select public.admin_act_on_report(pg_temp.report_id('scam'), 'hide_listing', 'No listing here')$$,
  'P0001', 'This report is not about a listing.', 'hide listing is refused on a profile report');
select throws_ok($$select public.admin_act_on_report(pg_temp.report_id('scam'), 'restore_listing', 'Nope')$$,
  'P0001', 'This action does not apply to this report.', 'restore listing is refused on an ordinary report');
select lives_ok($$select public.admin_act_on_report(pg_temp.report_id('incorrect_info'), 'hide_listing', 'Rent does not match')$$,
  'an admin hides the reported listing');
reset role;

select is((select is_hidden_by_admin from public.apartments where id = (select apartment_id from rf_ids)), true, 'the listing is hidden');
select is((select status || ':' || action_taken from public.user_reports where id = pg_temp.report_id('incorrect_info')), 'resolved:listing_hidden', 'the report is closed with what was done');
select is((select count(*)::int from public.notifications where user_id = (select landlord_id from rf_ids) and title = 'Listing hidden'), 1, 'the landlord is notified');
select is((select count(*)::int from public.email_outbox where user_id = (select landlord_id from rf_ids) and template = 'listing_hidden'), 1, 'the landlord email is queued');
select is((select count(*)::int from public.email_outbox where user_id = (select tenant_id from rf_ids) and template = 'report_reviewed'), 1, 'the reporter gets a generic reviewed email');
select is((select count(*)::int from public.admin_audit_logs where action = 'USER_REPORT_RESOLVED' and reason like '[listing_hidden]%' and target_id = (select landlord_id from rf_ids)), 1, 'the action is audited');

select pg_temp.act_as((select tenant_auth from rf));
set local role authenticated;
select throws_ok($$select public.admin_act_on_report(pg_temp.report_id('scam'), 'warn', 'Hello')$$,
  'P0001', 'Admin access required.', 'a non-admin cannot act on a report');
reset role;

select pg_temp.act_as((select admin_auth from rf), 'aal1');
set local role authenticated;
select throws_ok($$select public.admin_act_on_report(pg_temp.report_id('scam'), 'warn', 'Hello')$$,
  'P0001', 'Admin access required.', 'an admin without the second step cannot act');
reset role;

-- ---------------------------------------------------------------------------
-- Review requests
-- ---------------------------------------------------------------------------
select pg_temp.act_as((select landlord_auth from rf));
set local role authenticated;
select is((public.get_listing_review_state((select apartment_id from rf_ids))->>'hidden')::boolean, true, 'the landlord sees the listing is hidden');
select throws_ok($$select public.request_listing_review((select apartment_id from rf_ids), ' ')$$, '22023', 'Tell us what you fixed.', 'an empty note is refused');
select lives_ok($$select public.request_listing_review((select apartment_id from rf_ids), 'Corrected the rent')$$, 'the landlord asks for a review');
select throws_ok($$select public.request_listing_review((select apartment_id from rf_ids), 'again')$$, 'P0001',
  'You already asked for a review. Our team will answer soon.', 'only one request can be open');
select is(public.get_listing_review_state((select apartment_id from rf_ids))->'request'->>'status', 'open', 'the request shows as open');
reset role;
select is((select count(*)::int from public.notifications where user_id = (select admin_id from rf_ids) and title = 'Listing review requested'), 1, 'admins are told');

select pg_temp.act_as((select admin_auth from rf), 'aal2');
set local role authenticated;
select throws_ok($$select public.admin_resolve_user_report(pg_temp.request_id(), 'resolved', 'Done')$$,
  'P0001', 'Answer a review request with Restore listing or Keep hidden.', 'resolve is refused on a review request');
select throws_ok($$select public.admin_act_on_report(pg_temp.request_id(), 'warn', 'Hello')$$,
  'P0001', 'This action does not apply to this report.', 'warn is refused on a review request');
select lives_ok($$select public.admin_act_on_report(pg_temp.request_id(), 'keep_hidden', 'Photos still look wrong')$$,
  'an admin keeps the listing hidden');
reset role;
select is(pg_temp.request_outcome(), 'dismissed:listing_kept_hidden', 'the declined request is dismissed');
select is((select count(*)::int from public.email_outbox where user_id = (select landlord_id from rf_ids) and template = 'listing_review_declined'), 1, 'the landlord gets the decline email');
-- Everything in this file runs in one transaction, so now() never moves; space the requests out in time.
update public.user_reports set created_at = now() - interval '2 days'
  where target_type = 'review_request' and apartment_id = (select apartment_id from rf_ids);

-- A new request is answered by restoring the listing directly; a later hide ignores the old request.
select pg_temp.act_as((select landlord_auth from rf));
set local role authenticated;
select lives_ok($$select public.request_listing_review((select apartment_id from rf_ids), 'Replaced the photos')$$, 'a new request is allowed after a decline');
reset role;
select pg_temp.act_as((select admin_auth from rf), 'aal2');
set local role authenticated;
select lives_ok($$select public.admin_set_apartment_visibility((select apartment_id from rf_ids), false, 'Looks fine now')$$, 'an admin restores the listing directly');
reset role;
select is((select action_taken from public.user_reports where id = pg_temp.request_id()), 'listing_restored', 'restoring closes the open request');
update public.user_reports set created_at = now() - interval '1 minute'
  where target_type = 'review_request' and apartment_id = (select apartment_id from rf_ids);
select pg_temp.act_as((select admin_auth from rf), 'aal2');
set local role authenticated;
select lives_ok($$select public.admin_set_apartment_visibility((select apartment_id from rf_ids), true, 'Hidden again')$$, 'the listing is hidden again');
reset role;
select pg_temp.act_as((select landlord_auth from rf));
set local role authenticated;
select is(public.get_listing_review_state((select apartment_id from rf_ids))->'request', 'null'::jsonb, 'an old request is not shown on a new hide');
reset role;

-- ---------------------------------------------------------------------------
-- Temporary suspension
-- ---------------------------------------------------------------------------
select pg_temp.act_as((select admin_auth from rf), 'aal2');
set local role authenticated;
select lives_ok($$select public.admin_set_user_access((select tenant_id from rf_ids), true, 'Spam', now() + interval '7 days')$$, 'an admin suspends an account for 7 days');
reset role;
select is((select count(*)::int from public.email_outbox where user_id = (select tenant_id from rf_ids) and template = 'account_suspended'), 1, 'the suspension email is queued');

update public.users set suspended_until = now() - interval '1 minute' where id = (select tenant_id from rf_ids);
select pg_temp.act_as((select tenant_auth from rf));
set local role authenticated;
select is((public.get_my_suspension_status()->>'suspended')::boolean, false, 'an expired suspension reads as lifted');
reset role;
select is((select is_suspended from public.users where id = (select tenant_id from rf_ids)), false, 'reading the status lifts it');
select is((select count(*)::int from public.admin_audit_logs where reason = 'Suspension ended automatically' and target_id = (select tenant_id from rf_ids)), 1, 'the automatic lift is audited');
select is((select count(*)::int from public.email_outbox where user_id = (select tenant_id from rf_ids) and template = 'account_reactivated'), 1, 'the reactivation email is queued');

-- ---------------------------------------------------------------------------
-- Email retry only covers rows that are unsent, recent and not used up
-- ---------------------------------------------------------------------------
update public.email_outbox set created_at = now() - interval '5 minutes'
  where user_id in (select landlord_id from rf_ids union all select tenant_id from rf_ids);
select is(app_private.retry_pending_emails() >= 1, true, 'the retry job picks up unsent rows');
update public.email_outbox set attempts = 3
  where user_id in (select landlord_id from rf_ids union all select tenant_id from rf_ids);
select is(
  app_private.retry_pending_emails(),
  (select count(*)::int from public.email_outbox
   where sent_at is null and attempts < 3
     and created_at < now() - interval '2 minutes' and created_at > now() - interval '1 day'),
  'rows with no attempts left are not retried');

-- ---------------------------------------------------------------------------
-- Daily report limit
-- ---------------------------------------------------------------------------
insert into public.user_reports(reporter_id, reported_user_id, target_type, reason, status)
  select f.tenant_id, f.landlord_id, 'landlord', 'spam', 'dismissed'
  from rf_ids f, generate_series(1, 10);
select pg_temp.act_as((select tenant_auth from rf));
set local role authenticated;
select throws_ok($$select public.report_profile((select landlord_id from rf_ids), 'landlord', 'harassment', null)$$, 'P0001',
  'You have sent many reports today. Please try again tomorrow.', 'more than 10 reports a day are refused');
reset role;

do $$
declare diagnostic text;
begin
  for diagnostic in select * from finish() loop
    if diagnostic like '%failed%' or diagnostic like '%planned%' then
      raise exception 'Report flow assertion failure: %', diagnostic;
    end if;
  end loop;
end;
$$;
rollback;
