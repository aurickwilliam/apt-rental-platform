-- A tenant with an active rental cannot submit a new rental application.
-- Additive only: a separate trigger, so guard_rental_application_insert (which
-- the demo-population importer fingerprints) stays untouched. Existing
-- applications are never rewritten, and cancelling or reading them is unchanged.
begin;

create or replace function app_private.guard_application_active_tenancy()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  -- Trusted operator/import/service paths are not client journeys.
  if (select auth.uid()) is null
    or coalesce((select auth.jwt()->>'role'), '') = 'service_role' then
    return new;
  end if;

  if exists (
    select 1 from public.tenancies t
    where t.tenant_id = new.tenant_id and t.status = 'active'
  ) then
    raise exception 'You already have an active rental. You can apply for another apartment once it ends.'
      using errcode = '23514';
  end if;

  return new;
end;
$$;

revoke all on function app_private.guard_application_active_tenancy() from public, anon, authenticated;

drop trigger if exists guard_application_active_tenancy on public.rental_application;
create trigger guard_application_active_tenancy
before insert on public.rental_application
for each row execute function app_private.guard_application_active_tenancy();

commit;
