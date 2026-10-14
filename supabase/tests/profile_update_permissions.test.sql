begin;

select plan(7);

select ok(
  not has_table_privilege('authenticated', 'public.users', 'UPDATE'),
  'profile edits use column grants, never table-wide UPDATE'
);

select ok(
  (select bool_and(has_column_privilege('authenticated', 'public.users', column_name, 'UPDATE'))
   from unnest(array[
     'first_name', 'last_name', 'middle_name', 'suffix', 'gender', 'mobile_number',
     'birth_date', 'street_address', 'barangay', 'city', 'province', 'postal_code',
     'avatar_url', 'background_url', 'preferences', 'updated_at'
   ]) as columns(column_name)),
  'all intended profile and onboarding fields remain editable'
);

select ok(
  not exists (
    select 1 from pg_attribute
    where attrelid = 'public.users'::regclass and attnum > 0 and not attisdropped
      and attname <> all(array[
        'first_name', 'last_name', 'middle_name', 'suffix', 'gender', 'mobile_number',
        'birth_date', 'street_address', 'barangay', 'city', 'province', 'postal_code',
        'avatar_url', 'background_url', 'preferences', 'updated_at'
      ])
      and has_column_privilege('authenticated', 'public.users', attname, 'UPDATE')
  ),
  'email, identities, roles, status and access fields stay server-managed'
);

select ok(
  not exists (
    select 1 from pg_attribute
    where attrelid = 'public.users'::regclass and attnum > 0 and not attisdropped
      and has_column_privilege('anon', 'public.users', attname, 'UPDATE')
  ),
  'anonymous clients cannot update any profile column'
);

select ok(
  (select relrowsecurity from pg_class where oid = 'public.users'::regclass),
  'restoring profile grants does not bypass row-level security'
);

select ok(exists (
  select 1 from pg_trigger where tgrelid = 'public.users'::regclass
    and tgname = 'guard_user_authorization_fields' and not tgisinternal
), 'the authorization and access guard remains installed');

select ok(exists (
  select 1 from pg_trigger where tgrelid = 'public.users'::regclass
    and tgname = 'guard_user_email_fields' and not tgisinternal
), 'the Auth-managed email guard remains installed');

select * from finish();
rollback;
