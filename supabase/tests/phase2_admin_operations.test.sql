-- Run after the Phase 2 migration, in an isolated test database or transaction.
begin;
select plan(24);

select ok(not has_column_privilege('authenticated', 'public.users', 'is_suspended', 'UPDATE'), 'clients cannot suspend directly');
select ok(not has_column_privilege('authenticated', 'public.apartments', 'is_hidden_by_admin', 'UPDATE'), 'clients cannot hide directly');
select ok(not has_table_privilege('authenticated', 'public.admin_audit_logs', 'INSERT'), 'clients cannot forge audit rows');
select ok(not has_function_privilege('authenticated', 'public.admin_set_user_access(uuid,uuid,boolean,text)', 'EXECUTE'), 'Auth access RPC is service-role only');
select ok(not has_function_privilege('anon', 'public.admin_set_apartment_visibility(uuid,boolean,text)', 'EXECUTE'), 'anonymous moderation is denied');
select ok(not has_function_privilege('anon', 'public.get_admin_analytics(date,date)', 'EXECUTE'), 'anonymous analytics is denied');

create temporary table phase2_fixture as
  select gen_random_uuid() admin_auth, gen_random_uuid() landlord_auth,
    gen_random_uuid() tenant_auth, gen_random_uuid() admin_id,
    gen_random_uuid() landlord_id, gen_random_uuid() tenant_id,
    gen_random_uuid() apartment_id;
grant select on phase2_fixture to anon, authenticated, service_role;
insert into auth.users(id) select admin_auth from phase2_fixture union all
  select landlord_auth from phase2_fixture union all
  select tenant_auth from phase2_fixture;
insert into public.users(id, user_id, role)
  select admin_id, admin_auth, 'tenant' from phase2_fixture union all
  select landlord_id, landlord_auth, 'landlord' from phase2_fixture union all
  select tenant_id, tenant_auth, 'tenant' from phase2_fixture;
update public.users set role = 'admin' where id = (select admin_id from phase2_fixture);
insert into public.apartments(
  id, landlord_id, name, description, monthly_rent, type,
  street_address, barangay, city, province, no_bedrooms, no_bathrooms, area_sqm
) select apartment_id, landlord_id, 'Fixture', 'Fixture', 10000, 'apartment',
  'Test', 'Test', 'Malabon', 'Metro Manila', 1, 1, 20 from phase2_fixture;
insert into public.apartment_images(apartment_id, url)
  select apartment_id, 'https://example.invalid/test-image' from phase2_fixture;

set local role anon;
select is((select count(*)::integer from public.apartments where id = (select apartment_id from phase2_fixture)), 1, 'visible listing is anonymously discoverable');
select is((select count(*)::integer from public.apartment_images where apartment_id = (select apartment_id from phase2_fixture)), 1, 'visible listing images are discoverable');
select ok((select public.get_search_sections('CAMANAVA', null, '{}'::jsonb, 8)::text like '%' || apartment_id::text || '%' from phase2_fixture), 'visible listing appears in search RPC');
reset role;

select set_config('request.jwt.claim.sub', (select admin_auth::text from phase2_fixture), true);
set local role authenticated;
select lives_ok('select public.admin_set_apartment_visibility((select apartment_id from phase2_fixture), true, ''Fixture moderation'')', 'admin may hide listing');
reset role;
select is((select count(*)::integer from public.admin_audit_logs where action = 'APARTMENT_HIDDEN' and target_id = (select apartment_id from phase2_fixture)), 1, 'hide is audited once');

set local role anon;
select is((select count(*)::integer from public.apartments where id = (select apartment_id from phase2_fixture)), 0, 'hidden listing absent anonymously');
select is((select count(*)::integer from public.apartment_images where apartment_id = (select apartment_id from phase2_fixture)), 0, 'hidden listing images absent anonymously');
select ok((select public.get_search_sections('CAMANAVA', null, '{}'::jsonb, 8)::text not like '%' || apartment_id::text || '%' from phase2_fixture), 'hidden listing absent from search RPC');
reset role;
select set_config('request.jwt.claim.sub', (select tenant_auth::text from phase2_fixture), true);
set local role authenticated;
select is((select count(*)::integer from public.apartments where id = (select apartment_id from phase2_fixture)), 0, 'hidden listing absent to unrelated tenant');
select throws_ok('select public.admin_set_apartment_visibility((select apartment_id from phase2_fixture), false, ''Forgery'')', 'P0001', 'Admin access required.', 'tenant cannot restore listing');
select throws_ok('select public.get_admin_analytics(current_date - 7, current_date)', 'P0001', 'Admin access required.', 'tenant cannot read aggregate metrics');
reset role;

select set_config('request.jwt.claim.sub', (select landlord_auth::text from phase2_fixture), true);
set local role authenticated;
select is((select count(*)::integer from public.apartments where id = (select apartment_id from phase2_fixture)), 1, 'owner can manage hidden listing');
reset role;

select set_config('request.jwt.claim.sub', (select admin_auth::text from phase2_fixture), true);
set local role authenticated;
select is((select count(*)::integer from public.apartments where id = (select apartment_id from phase2_fixture)), 1, 'admin can inspect hidden listing');
select throws_ok('select public.get_admin_analytics(current_date - 367, current_date)', 'P0001', 'Select a date range of at most 366 days.', 'analytics rejects unbounded range');
select is((public.get_admin_analytics(current_date - 7, current_date)->'apartments'->>'hidden')::integer, 1, 'admin analytics includes hidden count');
reset role;

select set_config('request.jwt.claim.role', 'service_role', true);
set local role service_role;
select lives_ok('select public.admin_set_user_access((select admin_auth from phase2_fixture), (select tenant_id from phase2_fixture), true, ''Fixture suspension'')', 'service transition suspends account');
reset role;
select is((select count(*)::integer from public.admin_audit_logs where action = 'USER_SUSPENDED' and target_id = (select tenant_id from phase2_fixture)), 1, 'suspension creates exactly one audit row');

select set_config('request.jwt.claim.sub', (select tenant_auth::text from phase2_fixture), true);
set local role authenticated;
select is((select count(*)::integer from public.users where id = (select tenant_id from phase2_fixture)), 0, 'previously issued JWT cannot read protected profile');
reset role;

do $$
declare diagnostic text;
begin
  for diagnostic in select * from finish() loop
    if diagnostic like '%failed%' or diagnostic like '%planned%' then
      raise exception 'Phase 2 assertion failure: %', diagnostic;
    end if;
  end loop;
end;
$$;
rollback;
