begin;

select plan(16);

select ok(not has_table_privilege('authenticated', 'public.users', 'UPDATE'), 'no broad authenticated user updates');
select ok(not has_table_privilege('anon', 'public.users', 'UPDATE'), 'no anonymous user updates');
select ok(not has_column_privilege('authenticated', 'public.users', 'role', 'UPDATE'), 'role is not client-editable');
select ok(not has_column_privilege('authenticated', 'public.users', 'account_status', 'UPDATE'), 'account status is not client-editable');
select ok(not has_column_privilege('authenticated', 'public.users', 'id', 'UPDATE'), 'internal ID is not client-editable');
select ok(not has_column_privilege('authenticated', 'public.users', 'user_id', 'UPDATE'), 'auth ID is not client-editable');
select ok(not has_column_privilege('authenticated', 'public.users', 'created_at', 'UPDATE'), 'creation time is not client-editable');
select ok(not has_column_privilege('authenticated', 'public.users', 'updated_at', 'UPDATE'), 'update time is stamped by the database');
select ok(has_column_privilege('authenticated', 'public.users', 'first_name', 'UPDATE'), 'profile editing still works');
select ok(has_column_privilege('authenticated', 'public.users', 'preferences', 'UPDATE'), 'tenant preferences still work');
select ok(not has_function_privilege('anon', 'public.set_onboarding_role(text)', 'EXECUTE'), 'anonymous users cannot select a role');
select ok(has_function_privilege('authenticated', 'public.set_onboarding_role(text)', 'EXECUTE'), 'signed-in users can request onboarding role selection');
select ok(exists (
  select 1 from pg_trigger
  where tgrelid = 'public.users'::regclass
    and tgname = 'guard_user_authorization_fields'
    and not tgisinternal
), 'database guard is installed');

set local role authenticated;
select throws_ok(
  'update public.users set role = ''admin''',
  '42501',
  'direct role updates are denied even to authenticated clients'
);
select throws_ok(
  'update public.users set account_status = ''verified''',
  '42501',
  'direct verification status updates are denied'
);
select throws_ok(
  'insert into public.users (role) values (''admin'')',
  'P0001',
  'client registration cannot insert an admin profile'
);
reset role;

select * from finish();
rollback;
