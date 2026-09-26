begin;

select plan(11);

select has_table('public', 'apartment_verifications', 'apartment verification table exists');
select has_table('public', 'admin_audit_logs', 'admin audit table exists');
select ok(has_table_privilege('authenticated', 'public.apartment_verifications', 'SELECT'), 'authenticated users can read only through RLS');
select ok(has_table_privilege('authenticated', 'public.apartment_verifications', 'INSERT'), 'landlords can submit through RLS');
select ok(has_column_privilege('authenticated', 'public.apartment_verifications', 'status', 'UPDATE'), 'review status is writable through RLS');
select ok(not has_column_privilege('authenticated', 'public.apartment_verifications', 'reviewed_by', 'UPDATE'), 'reviewer identity is trigger-managed');
select ok(not has_column_privilege('authenticated', 'public.apartment_verifications', 'landlord_id', 'UPDATE'), 'ownership is not client-editable');
select ok(not has_table_privilege('authenticated', 'public.admin_audit_logs', 'INSERT'), 'clients cannot forge audit rows');
select ok(has_table_privilege('authenticated', 'public.admin_audit_logs', 'SELECT'), 'audit reads are RLS-scoped');
select ok(exists (select 1 from pg_trigger where tgrelid = 'public.apartment_verifications'::regclass and tgname = 'sync_apartment_verification_review' and not tgisinternal), 'apartment review sync trigger is installed');
select ok(
  (select with_check ~ 'a\\.landlord_id = apartment_verifications\\.landlord_id'
   from pg_policies
   where schemaname = 'public'
     and tablename = 'apartment_verifications'
     and policyname = 'Landlords submit own apartment verifications'),
  'landlord submissions must own the apartment'
);

select * from finish();
rollback;
