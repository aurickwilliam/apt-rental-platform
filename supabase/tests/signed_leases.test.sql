begin;

select plan(17);

-- Signed lease columns (20261016021700)
select ok(
  (select count(*) = 4 from information_schema.columns
   where table_schema = 'public' and table_name = 'tenancies'
     and column_name in ('signed_lease_path', 'signed_lease_uploaded_at', 'signed_lease_uploaded_by', 'tenant_acknowledged_at')),
  'tenancies carries the signed lease fields'
);
select ok(
  (select bool_and(is_nullable = 'YES') from information_schema.columns
   where table_schema = 'public' and table_name = 'tenancies'
     and column_name in ('signed_lease_path', 'signed_lease_uploaded_at', 'signed_lease_uploaded_by', 'tenant_acknowledged_at')),
  'the new columns are nullable, so existing tenancy writes keep working'
);

-- Private bucket
select ok(
  (select public = false and file_size_limit = 10485760 from storage.buckets where id = 'signed-leases'),
  'signed-leases is a private 10 MB bucket'
);
select ok(
  (select allowed_mime_types @> array['application/pdf', 'image/jpeg', 'image/png', 'image/webp']::text[]
     and array_length(allowed_mime_types, 1) = 4 from storage.buckets where id = 'signed-leases'),
  'signed-leases accepts only PDF and web images'
);

-- Storage policies
select ok(
  exists (select 1 from pg_policies where schemaname = 'storage' and tablename = 'objects'
          and policyname = 'Landlords can upload signed leases' and cmd = 'INSERT'),
  'landlords can upload signed leases'
);
select ok(
  exists (select 1 from pg_policies where schemaname = 'storage' and tablename = 'objects'
          and policyname = 'Landlords and tenants can read signed leases' and cmd = 'SELECT'),
  'landlords and tenants can read signed leases'
);
select ok(
  exists (select 1 from pg_policies where schemaname = 'storage' and tablename = 'objects'
          and policyname = 'Landlords can delete signed leases' and cmd = 'DELETE'),
  'landlords can delete signed leases'
);
select ok(
  (select bool_and(qual ~ 'signed-leases' or with_check ~ 'signed-leases' from pg_policies
   where schemaname = 'storage' and tablename = 'objects' and policyname ilike '%signed lease%')),
  'every signed lease policy is scoped to the bucket'
);

-- Storage helpers
select ok(
  (select bool_and(prosecdef) from pg_proc p join pg_namespace n on n.oid = p.pronamespace
   where n.nspname = 'private' and p.proname in ('signed_lease_landlord_can_upload', 'signed_lease_member_can_read')),
  'lease folder helpers run as definer'
);
select ok(
  has_function_privilege('authenticated', 'private.signed_lease_landlord_can_upload(text)', 'EXECUTE')
  and has_function_privilege('authenticated', 'private.signed_lease_member_can_read(text)', 'EXECUTE'),
  'policies can execute the folder helpers'
);
select ok(
  not has_function_privilege('anon', 'private.signed_lease_landlord_can_upload(text)', 'EXECUTE')
  and not has_function_privilege('anon', 'private.signed_lease_member_can_read(text)', 'EXECUTE'),
  'anonymous users cannot call the folder helpers'
);

-- Write path
select ok(
  (select bool_and(prosecdef and proconfig @> array['search_path=""'])
   from pg_proc p join pg_namespace n on n.oid = p.pronamespace
   where n.nspname = 'public' and p.proname in ('set_tenancy_signed_lease', 'acknowledge_signed_lease')),
  'both lease RPCs are defender-rights with an empty search path'
);
select ok(
  has_function_privilege('authenticated', 'public.set_tenancy_signed_lease(uuid,text)', 'EXECUTE')
  and has_function_privilege('authenticated', 'public.acknowledge_signed_lease(uuid)', 'EXECUTE'),
  'signed-in users can execute the lease RPCs'
);
select ok(
  not has_function_privilege('anon', 'public.set_tenancy_signed_lease(uuid,text)', 'EXECUTE')
  and not has_function_privilege('anon', 'public.acknowledge_signed_lease(uuid)', 'EXECUTE'),
  'anonymous users cannot call the lease RPCs'
);

-- Guard
select ok(
  exists (select 1 from pg_trigger where tgrelid = 'public.tenancies'::regclass
          and tgname = 'guard_tenancy_signed_lease_fields' and not tgisinternal),
  'direct writes to the signed lease columns are guarded'
);
select ok(
  not has_function_privilege('authenticated', 'public.guard_tenancy_signed_lease_fields()', 'EXECUTE'),
  'the lease guard is not callable by clients'
);
select ok(
  (select pg_get_functiondef(p.oid) ~ 'current_user = ''authenticated''' from pg_proc p join pg_namespace n on n.oid = p.pronamespace
   where n.nspname = 'public' and p.proname = 'guard_tenancy_signed_lease_fields'),
  'the guard only blocks client (authenticated) writes so the definer RPCs keep working'
);

select * from finish();
rollback;
