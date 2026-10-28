-- A running tenancy never gets stuck on verification.
--
-- The verified-account gates (20261028160000, 20261028180000) stop an
-- unverified landlord or tenant from starting anything new. They must not
-- strand people who are already in a tenancy if an account is later moved back
-- to unverified or rejected: the tenant must still be able to pay rent and
-- report maintenance, and the landlord must still be able to confirm cash,
-- answer maintenance and wind the tenancy up.
--
-- So while a tenancy is active, the gates step aside for that tenancy's own
-- rows only: its payments and maintenance requests (both parties) and the
-- tenancy row itself (landlord). Everything else stays closed: new listings,
-- applications, visit requests, new tenancies, finance records, chat.

create or replace function app_private.landlord_has_active_tenancy(p_landlord_id uuid, p_tenancy_id uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.tenancies t
    where t.id = p_tenancy_id and t.landlord_id = p_landlord_id and t.status = 'active'
  );
$$;
revoke all on function app_private.landlord_has_active_tenancy(uuid, uuid) from public, anon;
grant execute on function app_private.landlord_has_active_tenancy(uuid, uuid) to authenticated;

create or replace function app_private.tenant_has_active_tenancy(p_tenant_id uuid, p_tenancy_id uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.tenancies t
    where t.id = p_tenancy_id and t.tenant_id = p_tenant_id and t.status = 'active'
  );
$$;
revoke all on function app_private.tenant_has_active_tenancy(uuid, uuid) from public, anon;
grant execute on function app_private.tenant_has_active_tenancy(uuid, uuid) to authenticated;

-- Landlord writes. TG_ARGV[0] names where the row's landlord comes from;
-- TG_ARGV[1] (optional) is 'tenancy' (the row carries a tenancy_id) or 'self'
-- (the row is the tenancy: only an existing active one may change).
create or replace function app_private.guard_verified_landlord_write()
returns trigger language plpgsql set search_path = '' as $$
declare
  v_blocked uuid := app_private.unverified_landlord_id();
begin
  if v_blocked is not null then
    if tg_op in ('UPDATE', 'DELETE')
      and app_private.row_landlord_id(to_jsonb(old), tg_argv[0]) = v_blocked
      and not (case tg_argv[1]
        when 'tenancy' then app_private.landlord_has_active_tenancy(v_blocked, nullif(to_jsonb(old)->>'tenancy_id', '')::uuid)
        when 'self' then app_private.landlord_has_active_tenancy(v_blocked, nullif(to_jsonb(old)->>'id', '')::uuid)
        else false end) then
      raise exception 'Verify your account to use landlord features.' using errcode = '42501';
    end if;
    if tg_op in ('INSERT', 'UPDATE')
      and app_private.row_landlord_id(to_jsonb(new), tg_argv[0]) = v_blocked
      and not (tg_op = 'UPDATE' and case tg_argv[1]
        when 'tenancy' then app_private.landlord_has_active_tenancy(v_blocked, nullif(to_jsonb(new)->>'tenancy_id', '')::uuid)
        when 'self' then app_private.landlord_has_active_tenancy(v_blocked, nullif(to_jsonb(new)->>'id', '')::uuid)
        else false end) then
      raise exception 'Verify your account to use landlord features.' using errcode = '42501';
    end if;
  end if;
  return case when tg_op = 'DELETE' then old else new end;
end;
$$;
revoke all on function app_private.guard_verified_landlord_write() from public, anon, authenticated;

do $$
declare
  v_spec text[];
begin
  foreach v_spec slice 1 in array array[
    array['tenancies', 'self'],
    array['payment', 'tenancy'],
    array['maintenance_request', 'tenancy']
  ] loop
    execute format('drop trigger if exists guard_verified_landlord_write on public.%I', v_spec[1]);
    execute format(
      'create trigger guard_verified_landlord_write before insert or update or delete on public.%I '
      'for each row execute function app_private.guard_verified_landlord_write(%L, %L)',
      v_spec[1], 'landlord_id', v_spec[2]);
  end loop;
end;
$$;

-- Landlord reads of those same rows. The tenancy row itself stays readable:
-- Postgres also checks a restrictive SELECT policy against the updated row, so
-- hiding ended tenancies would stop the landlord from ending one. Writes to it
-- are still refused by the trigger above once it is no longer active.
drop policy if exists "Verified landlords only" on public.tenancies;

drop policy if exists "Verified landlords only" on public.payment;
create policy "Verified landlords only" on public.payment as restrictive for select to authenticated
  using (not coalesce(landlord_id = (select app_private.unverified_landlord_id()), false)
    or app_private.landlord_has_active_tenancy(landlord_id, tenancy_id));

drop policy if exists "Verified landlords only" on public.maintenance_request;
create policy "Verified landlords only" on public.maintenance_request as restrictive for select to authenticated
  using (not coalesce(landlord_id = (select app_private.unverified_landlord_id()), false)
    or app_private.landlord_has_active_tenancy(landlord_id, tenancy_id));

-- Tenant inserts. TG_ARGV[0] names the acting tenant column; TG_ARGV[1]
-- (optional) 'tenancy' lets the insert through when that tenant has the
-- referenced tenancy active (payments and maintenance requests only).
create or replace function app_private.guard_verified_tenant_insert()
returns trigger language plpgsql set search_path = '' as $$
declare
  v_blocked uuid := app_private.unverified_tenant_id();
begin
  if v_blocked is not null and nullif(to_jsonb(new)->>tg_argv[0], '')::uuid = v_blocked
    and not (coalesce(tg_argv[1], '') = 'tenancy'
      and app_private.tenant_has_active_tenancy(v_blocked, nullif(to_jsonb(new)->>'tenancy_id', '')::uuid)) then
    raise exception 'Verify your account to use this feature.' using errcode = '42501';
  end if;
  return new;
end;
$$;
revoke all on function app_private.guard_verified_tenant_insert() from public, anon, authenticated;

do $$
declare
  v_table text;
begin
  foreach v_table in array array['payment', 'maintenance_request'] loop
    execute format('drop trigger if exists guard_verified_tenant_insert on public.%I', v_table);
    execute format(
      'create trigger guard_verified_tenant_insert before insert on public.%I '
      'for each row execute function app_private.guard_verified_tenant_insert(%L, %L)',
      v_table, 'tenant_id', 'tenancy');
  end loop;
end;
$$;

do $$
declare reviewed record;
begin
  if to_regclass('demo_population.audited_functions') is not null then
    for reviewed in
      select p.oid, n.nspname || '.' || p.proname as name
      from pg_proc p join pg_namespace n on n.oid = p.pronamespace
      where n.nspname = 'app_private' and p.proname in (
        'guard_verified_landlord_write', 'guard_verified_tenant_insert')
    loop
      insert into demo_population.audited_functions(name, hash)
        values (reviewed.name, md5(pg_get_functiondef(reviewed.oid)))
        on conflict (name) do update set hash = excluded.hash;
    end loop;
  end if;
end;
$$;
