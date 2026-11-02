begin;

select plan(12);

-- Bank Transfer is a valid method (20261102120000)
select ok(
  (select pg_get_constraintdef(oid) like '%bank_transfer%' from pg_constraint
   where conrelid = 'public.payment'::regclass and conname = 'payment_method_check'),
  'payment accepts bank_transfer'
);
select ok(
  (select pg_get_constraintdef(oid) like '%bank_transfer%' from pg_constraint
   where conrelid = 'public.payment_method_preferences'::regclass
     and conname = 'payment_method_preferences_supported_methods_check'),
  'tenant payment preferences accept bank_transfer'
);

-- Settings table: names only, never empty, locked down
select ok(
  not exists (select 1 from information_schema.columns
              where table_schema = 'public' and table_name = 'landlord_payment_settings'
                and column_name not in ('landlord_id', 'accepted_methods', 'created_at', 'updated_at')),
  'landlord_payment_settings holds method names only (no account or credential columns)'
);
select ok(
  (select pg_get_constraintdef(oid) like '%cardinality(accepted_methods) >= 1%' from pg_constraint
   where conrelid = 'public.landlord_payment_settings'::regclass
     and conname = 'landlord_payment_settings_methods_check'),
  'an empty accepted list is refused'
);
select ok(
  (select relrowsecurity from pg_class where oid = 'public.landlord_payment_settings'::regclass),
  'row level security is on'
);
select ok(
  not has_table_privilege('anon', 'public.landlord_payment_settings', 'select'),
  'signed-out users cannot read the settings'
);
select ok(
  not has_table_privilege('authenticated', 'public.landlord_payment_settings', 'delete'),
  'clients cannot delete the settings'
);
select ok(
  not has_column_privilege('authenticated', 'public.landlord_payment_settings', 'created_at', 'update'),
  'clients can update only accepted_methods and updated_at'
);

-- Landlord-only policies and the verified-landlord gate
select ok(
  (select count(*) = 4 from pg_policies
   where schemaname = 'public' and tablename = 'landlord_payment_settings'),
  'select, insert, update and the active-accounts policies exist (no tenant policy)'
);
select ok(
  exists (select 1 from pg_trigger
          where tgrelid = 'public.landlord_payment_settings'::regclass
            and tgname = 'guard_verified_landlord_write' and not tgisinternal),
  'unverified landlords cannot change the settings'
);

-- Tenant read and payment enforcement
select ok(
  has_function_privilege('authenticated', 'public.get_landlord_accepted_methods(uuid)', 'execute')
    and not has_function_privilege('anon', 'public.get_landlord_accepted_methods(uuid)', 'execute'),
  'only signed-in users can ask which methods a landlord accepts'
);
select ok(
  exists (select 1 from pg_policies
          where schemaname = 'public' and tablename = 'payment'
            and policyname = 'Accepted payment methods only'
            and cmd = 'INSERT' and permissive = 'RESTRICTIVE'),
  'client payment inserts must use a method the landlord accepts'
);

select * from finish();
rollback;
