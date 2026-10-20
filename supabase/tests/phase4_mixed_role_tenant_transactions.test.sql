-- Mixed admin/tenant profiles may create tenant-side records, with the same
-- tenant-level validation as anyone else, while gaining nothing from admin.
-- Covers 20261017070948_allow_mixed_role_tenant_transactions:
--   * the tenant-membership trigger requires the tenant role and no longer
--     cancels it with admin (parity with mixed landlord finances)
--   * the rental-application guards no longer bypass admin+tenant applicants,
--     so verification, document rules and the post-submit freeze apply
-- Run in an isolated test database or transaction (rolls back).
begin;
select plan(15);

create temporary table phase4_fixture as
  select gen_random_uuid() tenant_admin_id, gen_random_uuid() tenant_admin_auth,
    gen_random_uuid() tenant_only_id, gen_random_uuid() tenant_only_auth,
    gen_random_uuid() admin_only_id, gen_random_uuid() admin_only_auth,
    gen_random_uuid() owner_id, gen_random_uuid() owner_auth,
    gen_random_uuid() landlord_only_id, gen_random_uuid() landlord_only_auth,
    gen_random_uuid() apt_id;
grant select on phase4_fixture to anon, authenticated, service_role;

insert into auth.users(id)
  select tenant_admin_auth from phase4_fixture union all
  select tenant_only_auth from phase4_fixture union all
  select admin_only_auth from phase4_fixture union all
  select owner_auth from phase4_fixture union all
  select landlord_only_auth from phase4_fixture;

-- handle_new_user may have auto-created profile rows; shape them either way.
-- Roles are added later because registration INSERT stays tenant/landlord-only.
insert into public.users (id, user_id, roles, account_status)
  select tenant_admin_id, tenant_admin_auth, '{tenant}'::text[], 'verified' from phase4_fixture union all
  select tenant_only_id, tenant_only_auth, '{tenant}'::text[], 'verified' from phase4_fixture union all
  select admin_only_id, admin_only_auth, '{tenant}'::text[], 'verified' from phase4_fixture union all
  select owner_id, owner_auth, '{landlord}'::text[], 'verified' from phase4_fixture union all
  select landlord_only_id, landlord_only_auth, '{landlord}'::text[], 'verified' from phase4_fixture
on conflict (user_id) do update
  set id = excluded.id, roles = excluded.roles, account_status = excluded.account_status;

update public.users set roles = '{tenant,admin}'::text[]
  where id = (select tenant_admin_id from phase4_fixture);
update public.users set roles = '{admin}'::text[]
  where id = (select admin_only_id from phase4_fixture);

-- Pin inside the Caloocan boundary (private.camanava_city_boundaries).
insert into public.apartments (id, landlord_id, name, description, monthly_rent, type,
  street_address, barangay, city, province, latitude, longitude, status, no_bedrooms,
  no_bathrooms, area_sqm, is_verified, rent_due_day, is_hidden_by_admin)
  select apt_id, owner_id, 'Phase4 Test Unit', 'Fixture unit', 12000, 'Apartment',
    '1 Test Street', 'Barangay 1', 'Caloocan', 'Metro Manila', 14.7478621715, 121.04306224066,
    'available', 1, 1, 30, false, 5, false
  from phase4_fixture;

-- Definitions: the admin veto and bypasses are gone, the tenant checks stay.
select ok(
  (select position('admin' in pg_get_functiondef('public.require_tenant_membership_for_new_transaction()'::regprocedure)) = 0),
  'tenant membership trigger no longer vetoes admin roles');

select ok(
  (select pg_get_functiondef('public.require_tenant_membership_for_new_transaction()'::regprocedure) like '%''tenant'' = any%'),
  'tenant membership trigger still requires a tenant role');

select ok(
  (select position('admin' in pg_get_functiondef('public.guard_rental_application_insert()'::regprocedure)) = 0),
  'application insert guard no longer bypasses admins');

select ok(
  (select position('admin' in pg_get_functiondef('public.guard_rental_application_update()'::regprocedure)) = 0),
  'application update guard no longer bypasses admins');

select is(
  (select count(*)::int from pg_trigger where not tgisinternal and tgname in (
    'zzz_require_tenant_application', 'zzz_require_tenant_visit', 'zzz_require_tenant_favorite',
    'zzz_require_tenant_tenancy', 'zzz_require_tenant_payment', 'zzz_require_tenant_review')),
  6, 'all six tenant membership triggers stay installed');

-- Admin+tenant keeps tenant-level access.
select set_config('request.jwt.claim.sub', (select tenant_admin_auth::text from phase4_fixture), true);
set local role authenticated;

select lives_ok($$insert into public.favorites (tenant_id, apartment_id)
    select tenant_admin_id, apt_id from phase4_fixture$$,
  'admin+tenant can create a favorite');

select is(
  (select count(*)::int from public.favorites where tenant_id = (select tenant_admin_id from phase4_fixture)),
  1, 'the admin+tenant favorite was stored');

-- Admin-only profiles still have no consumer access.
select set_config('request.jwt.claim.sub', (select admin_only_auth::text from phase4_fixture), true);

select throws_ok($$insert into public.favorites (tenant_id, apartment_id)
    select admin_only_id, apt_id from phase4_fixture$$,
  '23514', 'A current tenant role is required for new tenant transactions.',
  'admin-only profile cannot create tenant transactions');

-- Tenant-only accounts keep their access; landlord-only accounts do not gain it.
select set_config('request.jwt.claim.sub', (select tenant_only_auth::text from phase4_fixture), true);

select lives_ok($$insert into public.favorites (tenant_id, apartment_id)
    select tenant_only_id, apt_id from phase4_fixture$$,
  'tenant-only account can create a favorite');

select is(
  (select count(*)::int from public.favorites where tenant_id = (select tenant_only_id from phase4_fixture)),
  1, 'the tenant-only favorite was stored');

select set_config('request.jwt.claim.sub', (select landlord_only_auth::text from phase4_fixture), true);

select throws_ok($$insert into public.favorites (tenant_id, apartment_id)
    select landlord_only_id, apt_id from phase4_fixture$$,
  '23514', 'A current tenant role is required for new tenant transactions.',
  'landlord-only profile cannot create tenant transactions');

-- Application validation applies to admin+tenant applicants.
reset role;
update public.users set account_status = 'unverified'
  where id = (select tenant_admin_id from phase4_fixture);
select set_config('request.jwt.claim.sub', (select tenant_admin_auth::text from phase4_fixture), true);
set local role authenticated;

select throws_ok($$insert into public.rental_application (tenant_id, apartment_id, occupation,
    employer_name, monthly_income, employment_type, move_in_date, no_occupants, has_pets,
    has_smoker, need_parking, gov_id_url, proof_of_billing_url)
  select tenant_admin_id, apt_id, 'Tester', 'ACME', 50000, 'Employed', current_date + 30,
    1, false, false, false, 'phase4/id.png', 'phase4/bill.png' from phase4_fixture$$,
  '23514', 'Verify your account before applying.',
  'unverified admin+tenant applicant is refused');

reset role;
update public.users set account_status = 'verified'
  where id = (select tenant_admin_id from phase4_fixture);
select set_config('request.jwt.claim.sub', (select tenant_admin_auth::text from phase4_fixture), true);
set local role authenticated;

select throws_ok($$insert into public.rental_application (tenant_id, apartment_id, occupation,
    employer_name, monthly_income, employment_type, move_in_date, no_occupants, has_pets,
    has_smoker, need_parking, gov_id_url, proof_of_billing_url)
  select tenant_admin_id, apt_id, 'Tester', 'ACME', 50000, 'Employed', current_date + 30,
    1, false, false, false, 'phase4/id.png', 'phase4/bill.png' from phase4_fixture$$,
  '23514', 'Proof of income is required for your employment type.',
  'admin+tenant applicant follows the same document rules');

-- Post-submit freeze, then a plain cancel as the positive control.
reset role;
select set_config('request.jwt.claim.sub', '', true);
insert into public.rental_application (tenant_id, apartment_id, occupation, employer_name,
  monthly_income, employment_type, move_in_date, no_occupants, has_pets, has_smoker,
  need_parking, gov_id_url, proof_of_billing_url, proof_of_income_url, status)
  select tenant_admin_id, apt_id, 'Tester', 'ACME', 50000, 'Employed', current_date + 30,
    1, false, false, false, 'phase4/id.png', 'phase4/bill.png', 'phase4/income.png', 'pending'
  from phase4_fixture;

select set_config('request.jwt.claim.sub', (select tenant_admin_auth::text from phase4_fixture), true);
set local role authenticated;

select throws_ok($$update public.rental_application set gov_id_url = 'phase4/other.png'
    where tenant_id = (select tenant_admin_id from phase4_fixture)$$,
  '23514', 'Application documents cannot be changed after submitting.',
  'documents freeze applies to admin+tenant applicants');

select lives_ok($$update public.rental_application set status = 'cancelled'
    where tenant_id = (select tenant_admin_id from phase4_fixture)$$,
  'admin+tenant can still cancel a pending application');

reset role;

select * from finish();
rollback;
