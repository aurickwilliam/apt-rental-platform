-- A rental application can carry a copy of the details behind the tenant's saved
-- preferences (pets, parking and vehicles, smoking, a household member with a
-- disability), taken when they apply, so the landlord sees what the tenant
-- declared at that moment. The yes/no answers stay in has_pets, has_smoker and
-- need_parking; this adds the details and the disability answer.
--
-- Shape (version 1), written by @repo/utils buildApplicationPreferenceSnapshot:
--   { "version": 1,
--     "pets": { "has": bool, "kinds": [text], "count": int, "names": text },
--     "parking": { "needed": bool, "spots": int, "vehicles": [text] },
--     "smoker": bool, "householdDisability": bool }
--
-- Only a column and a check: no trigger is added or changed (the demo-population
-- audit hashes the application triggers). Clients can already insert on
-- rental_application and a tenant can only cancel their pending application, so
-- the snapshot is as fixed as the other answers; the landlord policies that read
-- an application read it too.

alter table public.rental_application
  add column if not exists tenant_preferences jsonb;

alter table public.rental_application
  drop constraint if exists rental_application_tenant_preferences_shape;

alter table public.rental_application
  add constraint rental_application_tenant_preferences_shape
  check (
    tenant_preferences is null
    or (
      jsonb_typeof(tenant_preferences) = 'object'
      and jsonb_typeof(tenant_preferences -> 'pets') = 'object'
      and jsonb_typeof(tenant_preferences -> 'parking') = 'object'
      and pg_column_size(tenant_preferences) <= 2000
    )
  );

comment on column public.rental_application.tenant_preferences is
  'Copy of the tenant''s pet, parking, smoking and household-disability details at submit time (see migration 20261104000000). Null when the tenant had no saved preferences.';
