-- A listing with a running tenancy cannot be deleted.
--
-- Found on 2026-10-31 (docs/audits/property-listings-audit-2026-10-31.md, O.3): a
-- landlord soft-deleted a listing whose tenancy was still active, and the tenant's
-- My Rental kept showing an active lease on a deleted unit. Tenants keep seeing a
-- running tenancy by design, so the fix is to refuse the delete until the tenancy
-- has been ended (the normal vacate flow), not to hide the lease.
--
-- The guard looks at real tenancies, not apartments.status: the status flag can
-- drift, and the web table and details-sheet deletes never checked it at all.
--
-- It fires only when `deleted_at` goes from null to a value. Restoring a listing,
-- editing other columns and deleting a listing whose tenancies have all ended are
-- unaffected. Every caller is covered (an unchecked soft delete leaves the same
-- dangling lease whoever runs it); a deliberate operator clean-up opts in for its
-- own transaction only:
--
--   set local app.allow_delete_with_active_tenancy = 'on';

create or replace function public.guard_apartment_delete_with_active_tenancy()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if new.deleted_at is null or old.deleted_at is not null then
    return new;
  end if;

  if coalesce(current_setting('app.allow_delete_with_active_tenancy', true), '') = 'on' then
    return new;
  end if;

  if exists (
    select 1 from public.tenancies t
    where t.apartment_id = new.id and t.status = 'active'
  ) then
    raise exception 'End the active tenancy before deleting this property.' using errcode = '23514';
  end if;

  return new;
end;
$$;
revoke all on function public.guard_apartment_delete_with_active_tenancy() from public, anon, authenticated;

drop trigger if exists guard_apartment_delete_with_active_tenancy on public.apartments;
create trigger guard_apartment_delete_with_active_tenancy
  before update of deleted_at on public.apartments
  for each row execute function public.guard_apartment_delete_with_active_tenancy();
