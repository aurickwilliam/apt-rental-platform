-- Admin data needs a verified second step (aal2), not just the admin role.
-- Run in an isolated test database or transaction (rolls back).
begin;
select plan(9);

create temporary table second_step_fixture as
  select gen_random_uuid() admin_auth, gen_random_uuid() tenant_auth;
grant select on second_step_fixture to anon, authenticated, service_role;

insert into auth.users(id)
  select admin_auth from second_step_fixture union all
  select tenant_auth from second_step_fixture;

update public.users set roles = '{admin,tenant}', account_status = 'verified',
  mobile_number = '+639171234570'
  where user_id = (select admin_auth from second_step_fixture);
update public.users set roles = '{tenant}', account_status = 'verified',
  mobile_number = '+639171234571'
  where user_id = (select tenant_auth from second_step_fixture);

-- A. Password-only session (aal1): the admin role alone is not enough.
select set_config('request.jwt.claim.sub', (select admin_auth::text from second_step_fixture), true);
select set_config('request.jwt.claims', json_build_object('sub', (select admin_auth from second_step_fixture), 'role', 'authenticated', 'aal', 'aal1')::text, true);
set local role authenticated;
select ok(not private.is_admin(), 'aal1 admin is not treated as admin');
select throws_ok($$select * from public.get_admin_listing_status()$$, 'P0001', 'Admin access required.', 'aal1 admin cannot call admin RPCs');
select is((select count(*)::integer from public.admin_audit_logs), 0, 'aal1 admin cannot read audit logs');
reset role;

-- B. Verified second step (aal2): admin access works.
select set_config('request.jwt.claims', json_build_object('sub', (select admin_auth from second_step_fixture), 'role', 'authenticated', 'aal', 'aal2')::text, true);
set local role authenticated;
select ok(private.is_admin(), 'aal2 admin is treated as admin');
select lives_ok($$select * from public.get_admin_listing_status()$$, 'aal2 admin can call admin RPCs');
reset role;

-- C. No aal claim at all never counts as the second step.
select set_config('request.jwt.claims', json_build_object('sub', (select admin_auth from second_step_fixture), 'role', 'authenticated')::text, true);
set local role authenticated;
select ok(not private.is_admin(), 'a token without an aal claim is not admin');
reset role;

-- D. A non-admin is refused at any level.
select set_config('request.jwt.claim.sub', (select tenant_auth::text from second_step_fixture), true);
select set_config('request.jwt.claims', json_build_object('sub', (select tenant_auth from second_step_fixture), 'role', 'authenticated', 'aal', 'aal2')::text, true);
set local role authenticated;
select ok(not private.is_admin(), 'a tenant at aal2 is not admin');
select throws_ok($$select * from public.get_admin_listing_status()$$, 'P0001', 'Admin access required.', 'a tenant cannot call admin RPCs');
reset role;

-- E. The target-account check in admin_set_user_access is unchanged.
select ok(pg_get_functiondef('public.admin_set_user_access(uuid,boolean,text)'::regprocedure) ~ 'any\(v_target\.roles\)', 'admins stay protected as suspension targets');

do $$
declare diagnostic text;
begin
  for diagnostic in select * from finish() loop
    if diagnostic like '%failed%' or diagnostic like '%planned%' then
      raise exception 'Admin second-step assertion failure: %', diagnostic;
    end if;
  end loop;
end;
$$;
rollback;
