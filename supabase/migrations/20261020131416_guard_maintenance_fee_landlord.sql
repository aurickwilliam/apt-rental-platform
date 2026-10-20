-- The landlord-only waive RPC is not a boundary while `authenticated` holds
-- UPDATE on maintenance_request: a tenant could write off their own fee with a
-- direct table update. Enforce the same rule in the guard trigger, and stop a
-- tenant from zeroing or inventing a fee amount. Payment-owned pending -> paid
-- stays unchanged so the legacy receipt path can still settle.
create or replace function app_private.guard_maintenance_fee()
returns trigger language plpgsql security definer set search_path = '' as $$
declare
  v_is_landlord boolean;
begin
  if tg_op = 'INSERT' then
    if new.tenancy_id is null then
      select coalesce(
        (select t.id from public.tenancies t
          where t.apartment_id = new.apartment_id and t.tenant_id = new.tenant_id
            and t.lease_start <= (new.created_at at time zone 'Asia/Manila')::date
            and (t.lease_end is null or t.lease_end >= (new.created_at at time zone 'Asia/Manila')::date)
          order by t.lease_start desc, t.created_at desc
          limit 1),
        (select t.id from public.tenancies t
          where t.apartment_id = new.apartment_id and t.tenant_id = new.tenant_id
            and t.lease_start <= (new.created_at at time zone 'Asia/Manila')::date
          order by t.lease_start desc, t.created_at desc
          limit 1),
        (select t.id from public.tenancies t
          where t.apartment_id = new.apartment_id and t.tenant_id = new.tenant_id
            and t.status = 'active'
          order by t.lease_start desc, t.created_at desc
          limit 1))
      into new.tenancy_id;
    end if;
    return new;
  end if;

  if new.tenancy_id is distinct from old.tenancy_id then
    raise exception 'A maintenance fee cannot move to another rental.';
  end if;

  v_is_landlord := exists (
    select 1 from public.apartments a join public.users u on u.id = a.landlord_id
    where a.id = new.apartment_id and u.user_id = (select auth.uid())
  );

  -- Direct client writes may change the fee only as its landlord. A null uid
  -- is the direct-postgres operator path; service_role is the payment trigger.
  if coalesce((select auth.jwt()->>'role'), '') <> 'service_role'
    and (select auth.uid()) is not null and not v_is_landlord then
    if new.fee_amount is distinct from old.fee_amount then
      raise exception 'Only the landlord can change this maintenance fee.';
    end if;
    if new.fee_status is distinct from old.fee_status and new.fee_status = 'waived' then
      raise exception 'Only the landlord can waive this fee.';
    end if;
  end if;

  if new.fee_status is distinct from old.fee_status then
    if old.fee_status is null then
      if new.fee_status is distinct from 'pending' then
        raise exception 'A new maintenance fee must start as pending.';
      end if;
    elsif old.fee_status = 'pending' then
      if new.fee_status not in ('paid', 'waived') then
        raise exception 'A pending maintenance fee can only be paid or waived.';
      end if;
    else
      raise exception 'A settled maintenance fee cannot change status.';
    end if;
  end if;
  return new;
end;
$$;

revoke all on function app_private.guard_maintenance_fee() from public, anon, authenticated;

do $$
declare reviewed record;
begin
  if to_regclass('demo_population.audited_functions') is not null then
    for reviewed in
      select p.oid, n.nspname || '.' || p.proname as name
      from pg_proc p join pg_namespace n on n.oid = p.pronamespace
      where n.nspname = 'app_private' and p.proname = 'guard_maintenance_fee'
    loop
      insert into demo_population.audited_functions(name, hash)
        values (reviewed.name, md5(pg_get_functiondef(reviewed.oid)))
        on conflict (name) do update set hash = excluded.hash;
    end loop;
  end if;
end;
$$;
