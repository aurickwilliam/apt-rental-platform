-- Sync apartment availability when its last active tenancy ends.
--
-- Root cause (Kaunlaran Affordable Studio 04e00c46…): apartments.status stayed
-- 'occupied' with zero active tenancies rows, so handle_application_approved()
-- raised 'Apartment is already occupied' for the legitimate pending
-- application. Tenancy deletes / status moves had no trigger to flip the
-- apartment back, and the mobile vacate path used a non-canonical 'inactive'
-- status via two separate client writes.
--
-- This migration:
--   1. Adds sync_apartment_availability_on_tenancy_end(), fired AFTER UPDATE
--      OF status and AFTER DELETE on tenancies. When a tenancy leaves
--      'active' (to 'ended' or any other non-active value, or deleted) and no
--      other active tenancy remains for the apartment, an 'occupied'
--      apartment flips to 'available'. Other statuses
--      (under_maintenance / unverified) are never touched.
--   2. Backfills existing orphans (currently only Kaunlaran) with the same
--      guard, so the pending application becomes approvable again.

create or replace function public.sync_apartment_availability_on_tenancy_end()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_apartment_id uuid;
begin
  if TG_OP = 'DELETE' then
    if OLD.status is distinct from 'active' then
      return OLD;
    end if;
    v_apartment_id := OLD.apartment_id;
  else
    if OLD.status is distinct from 'active' or NEW.status = 'active' then
      return NEW;
    end if;
    v_apartment_id := NEW.apartment_id;
  end if;

  if not exists (
    select 1
    from public.tenancies t
    where t.apartment_id = v_apartment_id
      and t.status = 'active'
  ) then
    update public.apartments
    set status = 'available',
        updated_at = now()
    where id = v_apartment_id
      and status = 'occupied'
      and deleted_at is null;
  end if;

  if TG_OP = 'DELETE' then
    return OLD;
  end if;
  return NEW;
end;
$$;

drop trigger if exists sync_apartment_available_on_tenancy_update on public.tenancies;
create trigger sync_apartment_available_on_tenancy_update
  after update of status on public.tenancies
  for each row
  execute function public.sync_apartment_availability_on_tenancy_end();

drop trigger if exists sync_apartment_available_on_tenancy_delete on public.tenancies;
create trigger sync_apartment_available_on_tenancy_delete
  after delete on public.tenancies
  for each row
  execute function public.sync_apartment_availability_on_tenancy_end();

-- Backfill orphans: occupied apartments with no active tenancy go available.
-- Currently a single row (Kaunlaran Affordable Studio); guarded so occupied
-- units with a live tenancy are untouched.
update public.apartments
set status = 'available',
    updated_at = now()
where status = 'occupied'
  and deleted_at is null
  and not exists (
    select 1
    from public.tenancies t
    where t.apartment_id = apartments.id
      and t.status = 'active'
  );
