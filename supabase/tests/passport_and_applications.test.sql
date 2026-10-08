begin;

select plan(17);

-- Passport document integrity (20261008000000)
select ok(exists (select 1 from pg_trigger where tgrelid = 'public.passport_documents'::regclass and tgname = 'guard_passport_document_insert' and not tgisinternal), 'passport inserts cannot create verified/primary rows');
select ok(exists (select 1 from pg_trigger where tgrelid = 'public.passport_documents'::regclass and tgname = 'guard_passport_document_delete' and not tgisinternal), 'primary and under-review passport documents cannot be deleted by owners');
select ok(exists (select 1 from pg_trigger where tgrelid = 'public.passport_documents'::regclass and tgname = 'sync_passport_document_review' and not tgisinternal), 'passport review sync (and content lock) trigger is installed');

-- Rental application integrity (20261008030000)
select ok(exists (select 1 from pg_trigger where tgrelid = 'public.rental_application'::regclass and tgname = 'guard_rental_application_insert' and not tgisinternal), 'applications are validated on insert');
select ok(exists (select 1 from pg_trigger where tgrelid = 'public.rental_application'::regclass and tgname = 'guard_rental_application_update' and not tgisinternal), 'application documents are frozen after submitting');
select ok(not has_function_privilege('authenticated', 'public.guard_rental_application_insert()', 'EXECUTE'), 'application insert guard is not callable by clients');
select ok(not has_function_privilege('authenticated', 'private.application_document_problem(uuid,text,text,boolean)', 'EXECUTE'), 'document validation helper is not callable by clients');

-- Landlord access to the applicant's verified ID (20261008010000 / 20261008020000)
select ok(exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'rental_application' and column_name = 'gov_id_back_url'), 'applications can carry the ID back');
select ok(exists (select 1 from pg_policies where schemaname = 'storage' and tablename = 'objects' and policyname = 'Landlords can view applicant verified ID'), 'landlords can read the referenced ID front/back');
select ok(not exists (select 1 from pg_policies where schemaname = 'storage' and tablename = 'objects' and policyname = 'Landlords can view applicant verified ID front'), 'the front-only landlord policy was replaced');
select ok(has_function_privilege('authenticated', 'private.landlord_can_read_applicant_id(text)', 'EXECUTE'), 'the landlord ID policy helper is executable by policies');
select ok(not has_function_privilege('anon', 'private.landlord_can_read_applicant_id(text)', 'EXECUTE'), 'anonymous users cannot call the landlord ID helper');
select ok(
  (select qual ~ 'user-verification' from pg_policies where schemaname = 'storage' and tablename = 'objects' and policyname = 'Landlords can view applicant verified ID'),
  'the landlord ID policy is scoped to the verification bucket'
);
select ok(
  (select prosecdef from pg_proc p join pg_namespace n on n.oid = p.pronamespace where n.nspname = 'private' and p.proname = 'landlord_can_read_applicant_id'),
  'landlord ID helper runs as definer so it can read verification rows'
);

-- Notifications (20261008040000)
select ok(exists (select 1 from pg_trigger where tgrelid = 'public.rental_application'::regclass and tgname = 'notify_application_submitted' and not tgisinternal), 'landlords are notified of new applications');
select ok(not has_function_privilege('authenticated', 'public.notify_application_submitted()', 'EXECUTE'), 'the application notification trigger is not callable by clients');
select ok(
  (select pg_get_functiondef(p.oid) ~ 'passportReview' from pg_proc p join pg_namespace n on n.oid = p.pronamespace where n.nspname = 'public' and p.proname = 'notify_passport_document_submitted'),
  'admin passport notifications use their own screen key'
);

select * from finish();
rollback;
