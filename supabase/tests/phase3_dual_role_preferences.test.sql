-- Dual-role preference preservation for grant_user_role().
-- Covers the defense-critical fix redefining preferences_only_for_tenants:
-- tenant+landlord accounts keep rental preferences; landlord-only accounts
-- still require NULL preferences.
-- Run in an isolated test database or transaction (rolls back).
begin;
select plan(25);

create temporary table dual_role_fixture as
  select gen_random_uuid() tenant_auth, gen_random_uuid() tenant_nomobile_auth,
    gen_random_uuid() tenant_bare_auth, gen_random_uuid() landlord_auth,
    gen_random_uuid() landlord2_auth, gen_random_uuid() admin_auth;
grant select on dual_role_fixture to anon, authenticated, service_role;

insert into auth.users(id)
  select tenant_auth from dual_role_fixture union all
  select tenant_nomobile_auth from dual_role_fixture union all
  select tenant_bare_auth from dual_role_fixture union all
  select landlord_auth from dual_role_fixture union all
  select landlord2_auth from dual_role_fixture union all
  select admin_auth from dual_role_fixture;

-- handle_new_user auto-created tenant rows; shape them into fixtures.
update public.users set roles = '{tenant}', account_status = 'verified',
  mobile_number = '+639171234567',
  preferences = '{"selectedCities": ["Caloocan"], "budgetMin": 5000, "budgetMax": 14999, "bedroomCount": "1-2 Bedrooms"}'::jsonb
  where user_id = (select tenant_auth from dual_role_fixture);
update public.users set roles = '{tenant}', account_status = 'verified',
  mobile_number = null, preferences = null
  where user_id = (select tenant_nomobile_auth from dual_role_fixture);
update public.users set roles = '{tenant}', account_status = 'verified',
  mobile_number = '+639171234568', preferences = null
  where user_id = (select tenant_bare_auth from dual_role_fixture);
update public.users set roles = '{landlord}', account_status = 'verified',
  mobile_number = '+639171234569', preferences = null
  where user_id = (select landlord_auth from dual_role_fixture);
update public.users set roles = '{admin}', account_status = 'verified',
  mobile_number = '+639171234570', preferences = null
  where user_id = (select admin_auth from dual_role_fixture);

-- A. Tenant with saved preferences adds landlord access.
select set_config('request.jwt.claim.sub', (select tenant_auth::text from dual_role_fixture), true);
set local role authenticated;
select lives_ok($$select public.grant_user_role('landlord')$$, 'tenant with saved preferences can add landlord access');
select is(roles, '{tenant,landlord}'::text[], 'roles contain both tenant and landlord')
  from public.users where user_id = (select tenant_auth from dual_role_fixture);
select is(preferences, '{"selectedCities": ["Caloocan"], "budgetMin": 5000, "budgetMax": 14999, "bedroomCount": "1-2 Bedrooms"}'::jsonb, 'preferences preserved exactly')
  from public.users where user_id = (select tenant_auth from dual_role_fixture);
select is(mobile_number, '+639171234567', 'mobile number unchanged by the grant')
  from public.users where user_id = (select tenant_auth from dual_role_fixture);
select is(account_status, 'verified', 'account status unchanged by the grant')
  from public.users where user_id = (select tenant_auth from dual_role_fixture);
reset role;

-- B. Tenant without preferences adds landlord access.
select set_config('request.jwt.claim.sub', (select tenant_bare_auth::text from dual_role_fixture), true);
set local role authenticated;
select lives_ok($$select public.grant_user_role('landlord')$$, 'tenant without preferences can add landlord access');
select ok((select preferences is null from public.users where user_id = (select tenant_bare_auth from dual_role_fixture)), 'preferences remain null');
reset role;

-- C. Landlord-only accounts still cannot hold tenant preferences.
select throws_ok($$update public.users set preferences = '{"selectedCities": ["Malabon"]}'::jsonb where user_id = (select landlord_auth from dual_role_fixture)$$, '23514', 'landlord-only update with preferences still rejected');
select throws_ok($$update public.users set roles = '{landlord}', preferences = '{"selectedCities": ["Malabon"]}'::jsonb where user_id = (select landlord2_auth from dual_role_fixture)$$, '23514', 'landlord-only insert with preferences still rejected');

-- D. Landlord adds tenant access, then saves preferences.
select set_config('request.jwt.claim.sub', (select landlord_auth::text from dual_role_fixture), true);
set local role authenticated;
select lives_ok($$select public.grant_user_role('tenant')$$, 'landlord can add tenant access');
select is(roles, '{landlord,tenant}'::text[], 'landlord retains access and gains tenant')
  from public.users where user_id = (select landlord_auth from dual_role_fixture);
select lives_ok($$update public.users set preferences = '{"selectedCities": ["Navotas"]}'::jsonb where user_id = (select landlord_auth from dual_role_fixture)$$, 'dual-role account can save tenant preferences');
select is(preferences, '{"selectedCities": ["Navotas"]}'::jsonb, 'dual-role preferences stored')
  from public.users where user_id = (select landlord_auth from dual_role_fixture);
reset role;

-- E. Duplicate role addition stays successful and idempotent.
select set_config('request.jwt.claim.sub', (select tenant_auth::text from dual_role_fixture), true);
set local role authenticated;
select lives_ok($$select public.grant_user_role('landlord')$$, 'duplicate role grant stays successful');
select is(roles, '{tenant,landlord}'::text[], 'duplicate grant adds no duplicate entries')
  from public.users where user_id = (select tenant_auth from dual_role_fixture);
reset role;

-- F. Unauthorized role addition stays blocked.
select ok(has_function_privilege('anon', 'public.grant_user_role(text)', 'EXECUTE'), 'RPC is reachable but guarded, even anonymously');
select ok(has_function_privilege('authenticated', 'public.grant_user_role(text)', 'EXECUTE'), 'tenants can invoke the grant RPC');
select set_config('request.jwt.claim.sub', (select admin_auth::text from dual_role_fixture), true);
set local role authenticated;
select lives_ok($$select public.grant_user_role('tenant')$$, 'admin with a complete profile can add tenant access');
select ok('tenant' = any(roles) and 'admin' = any(roles), 'admin keeps admin and gains tenant')
  from public.users where user_id = (select admin_auth from dual_role_fixture);
select throws_ok($$select public.grant_user_role('admin')$$, 'P0001', 'Invalid role grant.', 'admin can never be self-granted');
select set_config('request.jwt.claim.sub', (select tenant_bare_auth::text from dual_role_fixture), true);
select throws_ok($$select public.grant_user_role('owner')$$, 'P0001', 'Invalid role grant.', 'invalid role rejected');
select set_config('request.jwt.claim.sub', gen_random_uuid()::text, true);
select throws_ok($$select public.grant_user_role('landlord')$$, 'P0001', 'Profile not found.', 'unknown profile rejected');
reset role;

-- G. Missing mobile number still blocks the grant without side effects.
select set_config('request.jwt.claim.sub', (select tenant_nomobile_auth::text from dual_role_fixture), true);
set local role authenticated;
select throws_ok($$select public.grant_user_role('landlord')$$, 'P0001', 'Complete your profile before adding a role.', 'missing mobile number still blocks');
select is(roles, '{tenant}'::text[], 'failed attempt leaves roles unchanged')
  from public.users where user_id = (select tenant_nomobile_auth from dual_role_fixture);
select ok((select preferences is null from public.users where user_id = (select tenant_nomobile_auth from dual_role_fixture)), 'failed attempt leaves preferences unchanged');
reset role;

do $$
declare diagnostic text;
begin
  for diagnostic in select * from finish() loop
    if diagnostic like '%failed%' or diagnostic like '%planned%' then
      raise exception 'Dual-role assertion failure: %', diagnostic;
    end if;
  end loop;
end;
$$;
rollback;
