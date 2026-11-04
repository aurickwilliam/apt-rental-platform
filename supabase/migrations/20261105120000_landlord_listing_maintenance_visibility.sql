-- Reuse the existing under_maintenance status: Browse and search RPCs already
-- include only available/unverified apartments. No occupancy, deletion or admin
-- moderation columns are repurposed. Existing apartment RLS/column grants and
-- verified-landlord guards continue to authorize the owner's status update.

create or replace function public.guard_apartment_maintenance_status()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if new.status is not distinct from old.status then return new; end if;
  if new.status = 'under_maintenance' or old.status = 'under_maintenance' then
    if not ((old.status = 'available' and new.status = 'under_maintenance')
      or (old.status = 'under_maintenance' and new.status = 'available')) then
      raise exception 'Only available properties can be hidden. Show the listing before changing its occupancy.'
        using errcode = '23514';
    end if;
    if exists (select 1 from public.tenancies t where t.apartment_id = new.id and t.status = 'active') then
      raise exception 'This property has an active tenancy. Its listing visibility cannot be changed.'
        using errcode = '23514';
    end if;
  end if;
  return new;
end;
$$;
revoke all on function public.guard_apartment_maintenance_status() from public, anon, authenticated;

create trigger guard_apartment_maintenance_status
  before update of status on public.apartments
  for each row execute function public.guard_apartment_maintenance_status();

-- Lock the same apartment row the visibility UPDATE locks. An application,
-- visit, or active tenancy cannot race a hide; approval of an existing pending
-- application cannot create a tenancy for a paused listing either. These guards
-- also run inside definer functions (which bypass insert RLS).
create or replace function public.guard_transaction_maintenance_listing()
returns trigger language plpgsql security definer set search_path = '' as $$
declare
  v_status text;
begin
  if tg_table_name = 'tenancies' and new.status is distinct from 'active' then return new; end if;
  select a.status into v_status from public.apartments a
    where a.id = new.apartment_id for update;
  if v_status = 'under_maintenance' then
    raise exception 'This listing is temporarily hidden for renovation or maintenance. Try again when the landlord shows it.'
      using errcode = '23514';
  end if;
  return new;
end;
$$;
revoke all on function public.guard_transaction_maintenance_listing() from public, anon, authenticated;

create trigger guard_application_maintenance_listing
  before insert on public.rental_application
  for each row execute function public.guard_transaction_maintenance_listing();
create trigger guard_visit_maintenance_listing
  before insert on public.visit_request
  for each row execute function public.guard_transaction_maintenance_listing();
create trigger guard_tenancy_maintenance_listing
  before insert or update of apartment_id, status on public.tenancies
  for each row execute function public.guard_transaction_maintenance_listing();
