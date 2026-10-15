-- Defense-critical fix: let tenant+landlord (dual-role) accounts keep rental
-- preferences. The previous definition rejected ANY row containing
-- 'landlord' with non-null preferences, so grant_user_role('landlord')
-- failed with SQLSTATE 23514 for every tenant who completed personalization.
-- No user data is read, rewritten, or deleted here; only the CHECK rule is
-- redefined. Landlord-only accounts must still hold NULL preferences.
--
-- Safety: the DO block below aborts the migration (rolling back, changing
-- nothing) when its verified assumptions do not hold — a missing expected
-- constraint, or existing landlord-only rows that already hold preferences
-- (which the new rule would reject). Resolve such rows manually and retry.

do $$
declare
  v_count integer;
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'preferences_only_for_tenants'
      and conrelid = 'public.users'::regclass
  ) then
    raise exception 'Expected constraint preferences_only_for_tenants on public.users is missing; audit before migrating.';
  end if;

  select count(*) into v_count
  from public.users
  where 'landlord' = any (roles)
    and not ('tenant' = any (roles))
    and preferences is not null;
  if v_count > 0 then
    raise exception 'Cannot redefine preferences_only_for_tenants: % landlord-only row(s) already hold preferences. Resolve manually before migrating.', v_count;
  end if;
end;
$$;

alter table public.users
  drop constraint preferences_only_for_tenants;

alter table public.users
  add constraint preferences_only_for_tenants
  check (
    not (
      'landlord' = any (roles)
      and not ('tenant' = any (roles))
    )
    or preferences is null
  );
