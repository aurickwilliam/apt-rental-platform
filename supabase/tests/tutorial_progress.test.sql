begin;

select plan(7);

select ok(
  (select relrowsecurity from pg_class where oid = 'public.tutorial_progress'::regclass),
  'row level security is on'
);
select ok(
  not has_table_privilege('anon', 'public.tutorial_progress', 'select'),
  'signed-out users cannot read tutorial progress'
);
select ok(
  not has_table_privilege('authenticated', 'public.tutorial_progress', 'delete'),
  'clients cannot delete tutorial progress'
);
select ok(
  (select pg_get_constraintdef(oid) like '%tenant%landlord%' from pg_constraint
   where conrelid = 'public.tutorial_progress'::regclass and contype = 'c'
     and pg_get_constraintdef(oid) like '%portal%'),
  'only the tenant and landlord portals are valid'
);
select ok(
  (select count(*) = 1 from pg_constraint
   where conrelid = 'public.tutorial_progress'::regclass and contype = 'p'
     and array_length(conkey, 1) = 2),
  'one row per user and portal (composite primary key)'
);
select ok(
  exists (select 1 from pg_policies where tablename = 'tutorial_progress'
          and policyname = 'Active accounts only' and permissive = 'RESTRICTIVE'),
  'suspended accounts are closed out by the restrictive policy'
);
select ok(
  exists (select 1 from pg_policies where tablename = 'tutorial_progress'
          and policyname = 'Users insert own tutorial progress'
          and with_check like '%roles%'),
  'a row can only be created for a portal the user holds'
);
select * from finish();
rollback;
