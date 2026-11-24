-- Release gate: apply this migration before deploying web builds that rely on it.
-- Additive authorization only. No backfill, row deletion, grant or policy change.
begin;

create or replace function app_private.guard_maintenance_tenancy()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_tenant uuid;
  v_tenancy public.tenancies%rowtype;
  v_matches integer := 0;
begin
  -- Existing trusted operator/import/payment paths are not client journeys.
  if (select auth.uid()) is null
    or coalesce((select auth.jwt()->>'role'), '') = 'service_role' then
    return new;
  end if;

  if tg_op = 'UPDATE' then
    if row(new.tenant_id, new.apartment_id, new.landlord_id, new.tenancy_id)
      is distinct from row(old.tenant_id, old.apartment_id, old.landlord_id, old.tenancy_id) then
      raise exception 'A maintenance request cannot move to another rental.' using errcode = '42501';
    end if;
    return new; -- Historical requests remain readable and manageable.
  end if;

  select u.id into v_tenant from public.users u
    where u.user_id = (select auth.uid()) and 'tenant' = any(u.roles)
      and not coalesce(u.is_suspended, false);
  if v_tenant is null or new.tenant_id is distinct from v_tenant then
    raise exception 'You can only report maintenance for your own active rental.' using errcode = '42501';
  end if;

  -- Old web/mobile clients omit tenancy_id. Resolve only an unambiguous
  -- active tenancy for their apartment, never an unrelated or ended lease.
  -- SHARE serializes this check with a concurrent tenancy status change.
  for v_tenancy in
    select t.* from public.tenancies t
    join public.apartments a on a.id = t.apartment_id and a.landlord_id = t.landlord_id
    where t.tenant_id = v_tenant and t.apartment_id = new.apartment_id
      and t.landlord_id <> v_tenant
      and t.status = 'active'
      and (new.tenancy_id is null or t.id = new.tenancy_id)
    order by t.lease_start, t.id
    for share of t
  loop
    v_matches := v_matches + 1;
    if v_matches > 1 then
      raise exception 'Choose the rental for this maintenance request.' using errcode = '42501';
    end if;
    if new.landlord_id is not null and new.landlord_id is distinct from v_tenancy.landlord_id then
      raise exception 'This maintenance request does not match your rental landlord.' using errcode = '42501';
    end if;
    new.tenancy_id := v_tenancy.id;
    new.landlord_id := v_tenancy.landlord_id;
  end loop;
  if v_matches = 0 then
    raise exception 'You need a current active tenancy for this apartment to request maintenance.' using errcode = '42501';
  end if;
  return new;
end;
$$;

revoke all on function app_private.guard_maintenance_tenancy() from public, anon, authenticated;

-- Runs before aa_guard_maintenance_fee, whose legacy inference is preserved
-- for trusted imports but cannot choose an unrelated tenancy for a client.
create trigger a_guard_maintenance_tenancy
before insert or update of tenant_id, apartment_id, landlord_id, tenancy_id
on public.maintenance_request
for each row execute function app_private.guard_maintenance_tenancy();

commit;
