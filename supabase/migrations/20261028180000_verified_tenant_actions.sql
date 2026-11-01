-- Tenant-side actions require a verified account too.
--
-- An account that holds the `tenant` role and is not `verified` (unverified,
-- pending or rejected) may browse, edit its profile, verify and use favorites,
-- and nothing else: no new visit requests, chat messages, maintenance
-- requests, payments or reviews. (Applications already require a verified
-- account, see guard_rental_application_insert.) Only new rows are blocked, so
-- cancelling or reading something that already exists never gets stuck.
-- Service-role code paths carry no end-user identity and are not blocked.

create or replace function app_private.unverified_tenant_id()
returns uuid language sql stable security definer set search_path = '' as $$
  select u.id from public.users u
  where u.user_id = (select auth.uid())
    and 'tenant' = any(u.roles)
    and u.account_status is distinct from 'verified'
    and coalesce((select auth.jwt()->>'role'), '') <> 'service_role';
$$;
revoke all on function app_private.unverified_tenant_id() from public, anon;
grant execute on function app_private.unverified_tenant_id() to authenticated;

-- TG_ARGV[0] names the column holding the acting tenant.
create or replace function app_private.guard_verified_tenant_insert()
returns trigger language plpgsql set search_path = '' as $$
declare
  v_blocked uuid := app_private.unverified_tenant_id();
begin
  if v_blocked is not null and nullif(to_jsonb(new)->>tg_argv[0], '')::uuid = v_blocked then
    raise exception 'Verify your account to use this feature.' using errcode = '42501';
  end if;
  return new;
end;
$$;
revoke all on function app_private.guard_verified_tenant_insert() from public, anon, authenticated;

do $$
declare
  v_spec text[];
begin
  foreach v_spec slice 1 in array array[
    array['visit_request', 'tenant_id'],
    array['maintenance_request', 'tenant_id'],
    array['payment', 'tenant_id'],
    array['reviews', 'tenant_id'],
    array['chat', 'sender_id']
  ] loop
    execute format('drop trigger if exists guard_verified_tenant_insert on public.%I', v_spec[1]);
    execute format(
      'create trigger guard_verified_tenant_insert before insert on public.%I '
      'for each row execute function app_private.guard_verified_tenant_insert(%L)',
      v_spec[1], v_spec[2]);
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
      where n.nspname = 'app_private' and p.proname = 'guard_verified_tenant_insert'
    loop
      insert into demo_population.audited_functions(name, hash)
        values (reviewed.name, md5(pg_get_functiondef(reviewed.oid)))
        on conflict (name) do update set hash = excluded.hash;
    end loop;
  end if;
end;
$$;
