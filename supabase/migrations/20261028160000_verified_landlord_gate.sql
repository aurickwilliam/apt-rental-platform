-- Landlord-side features require a verified account.
--
-- An account that holds the `landlord` role and is not `verified` (unverified,
-- pending or rejected) cannot create or change listings, photos, applications,
-- visit requests, tenancies, maintenance requests, payments, finance records or
-- landlord chat messages, and cannot read the landlord-only records of those
-- tables. The rule is scoped to rows where the caller IS the landlord: a dual
-- role account keeps its tenant-side access, and nobody else is affected.
--
-- Public reads of apartments are deliberately unchanged (listing visibility is
-- a separate decision). Service-role code paths (webhooks, edge functions, the
-- demo importer) carry no end-user identity and are never blocked here; code
-- running as service role on a landlord's behalf must check status itself.

create schema if not exists app_private;
revoke all on schema app_private from public, anon;
grant usage on schema app_private to authenticated;

-- Internal id of the caller when they are a landlord who is not verified;
-- null for everyone else (verified, other roles, service role, signed out).
create or replace function app_private.unverified_landlord_id()
returns uuid language sql stable security definer set search_path = '' as $$
  select u.id from public.users u
  where u.user_id = (select auth.uid())
    and 'landlord' = any(u.roles)
    and u.account_status is distinct from 'verified'
    and coalesce((select auth.jwt()->>'role'), '') <> 'service_role';
$$;
revoke all on function app_private.unverified_landlord_id() from public, anon;
grant execute on function app_private.unverified_landlord_id() to authenticated;

-- Reads an apartment's owner without the caller's RLS, so a hidden or
-- restricted apartment row can never make the check pass by accident.
create or replace function app_private.apartment_landlord_id(p_apartment_id uuid)
returns uuid language sql stable security definer set search_path = '' as $$
  select a.landlord_id from public.apartments a where a.id = p_apartment_id;
$$;
revoke all on function app_private.apartment_landlord_id(uuid) from public, anon;
grant execute on function app_private.apartment_landlord_id(uuid) to authenticated;

create or replace function app_private.row_landlord_id(p_row jsonb, p_source text)
returns uuid language sql stable set search_path = '' as $$
  select case when p_source = 'apartment'
    then app_private.apartment_landlord_id(nullif(p_row->>'apartment_id', '')::uuid)
    else nullif(p_row->>p_source, '')::uuid end;
$$;
revoke all on function app_private.row_landlord_id(jsonb, text) from public, anon;
grant execute on function app_private.row_landlord_id(jsonb, text) to authenticated;

-- Writes: fires inside SECURITY DEFINER RPCs too, because the caller's identity
-- comes from the JWT, not from the executing role. TG_ARGV[0] names where the
-- row's landlord comes from: a column name, or 'apartment' for rows that hang
-- off an apartment.
create or replace function app_private.guard_verified_landlord_write()
returns trigger language plpgsql set search_path = '' as $$
declare
  v_blocked uuid := app_private.unverified_landlord_id();
begin
  if v_blocked is not null then
    if tg_op in ('UPDATE', 'DELETE')
      and app_private.row_landlord_id(to_jsonb(old), tg_argv[0]) = v_blocked then
      raise exception 'Verify your account to use landlord features.' using errcode = '42501';
    end if;
    if tg_op in ('INSERT', 'UPDATE')
      and app_private.row_landlord_id(to_jsonb(new), tg_argv[0]) = v_blocked then
      raise exception 'Verify your account to use landlord features.' using errcode = '42501';
    end if;
  end if;
  return case when tg_op = 'DELETE' then old else new end;
end;
$$;
revoke all on function app_private.guard_verified_landlord_write() from public, anon, authenticated;

-- Chat: an unverified landlord-only account cannot send at all; a dual role
-- account cannot send about its own apartments (tenant-side chats still work).
create or replace function app_private.guard_verified_landlord_chat()
returns trigger language plpgsql set search_path = '' as $$
declare
  v_blocked uuid := app_private.unverified_landlord_id();
begin
  if v_blocked is not null and new.sender_id = v_blocked and (
    not exists (select 1 from public.users u where u.id = v_blocked and 'tenant' = any(u.roles))
    or app_private.apartment_landlord_id(new.apartment_id) = v_blocked
  ) then
    raise exception 'Verify your account to use landlord features.' using errcode = '42501';
  end if;
  return new;
end;
$$;
revoke all on function app_private.guard_verified_landlord_chat() from public, anon, authenticated;

do $$
declare
  v_spec text[];
begin
  foreach v_spec slice 1 in array array[
    array['apartments', 'landlord_id'],
    array['apartment_images', 'apartment'],
    array['rental_application', 'apartment'],
    array['visit_request', 'landlord_id'],
    array['tenancies', 'landlord_id'],
    array['maintenance_request', 'landlord_id'],
    array['payment', 'landlord_id'],
    array['landlord_expenses', 'landlord_id'],
    array['landlord_budgets', 'landlord_id'],
    array['landlord_finance_reviews', 'landlord_id']
  ] loop
    execute format('drop trigger if exists guard_verified_landlord_write on public.%I', v_spec[1]);
    execute format(
      'create trigger guard_verified_landlord_write before insert or update or delete on public.%I '
      'for each row execute function app_private.guard_verified_landlord_write(%L)',
      v_spec[1], v_spec[2]);
  end loop;
end;
$$;

drop trigger if exists guard_verified_landlord_chat on public.chat;
create trigger guard_verified_landlord_chat
  before insert on public.chat
  for each row execute function app_private.guard_verified_landlord_chat();

-- Reads: restrictive policies compose with the existing ones and only ever
-- remove the landlord's own side of the rows.
do $$
declare
  v_spec text[];
  v_expr text;
begin
  foreach v_spec slice 1 in array array[
    array['visit_request', 'landlord_id'],
    array['tenancies', 'landlord_id'],
    array['maintenance_request', 'landlord_id'],
    array['payment', 'landlord_id'],
    array['landlord_expenses', 'landlord_id'],
    array['landlord_budgets', 'landlord_id'],
    array['landlord_finance_reviews', 'landlord_id'],
    array['rental_application', 'apartment']
  ] loop
    v_expr := case when v_spec[2] = 'apartment'
      then 'not coalesce(app_private.apartment_landlord_id(apartment_id) = (select app_private.unverified_landlord_id()), false)'
      else format('not coalesce(%I = (select app_private.unverified_landlord_id()), false)', v_spec[2]) end;
    execute format('drop policy if exists "Verified landlords only" on public.%I', v_spec[1]);
    execute format(
      'create policy "Verified landlords only" on public.%I as restrictive for select to authenticated using (%s)',
      v_spec[1], v_expr);
  end loop;
end;
$$;

-- Storage: listing photos and signed leases are landlord-side files.
do $$
begin
  if to_regclass('storage.objects') is null then
    return;
  end if;
  drop policy if exists "Verified landlords only (insert)" on storage.objects;
  create policy "Verified landlords only (insert)" on storage.objects as restrictive
    for insert to authenticated
    with check (bucket_id not in ('apartment-images', 'signed-leases')
      or (select app_private.unverified_landlord_id()) is null);
  drop policy if exists "Verified landlords only (update)" on storage.objects;
  create policy "Verified landlords only (update)" on storage.objects as restrictive
    for update to authenticated
    using (bucket_id not in ('apartment-images', 'signed-leases')
      or (select app_private.unverified_landlord_id()) is null);
  drop policy if exists "Verified landlords only (delete)" on storage.objects;
  create policy "Verified landlords only (delete)" on storage.objects as restrictive
    for delete to authenticated
    using (bucket_id not in ('apartment-images', 'signed-leases')
      or (select app_private.unverified_landlord_id()) is null);
end;
$$;

-- Register the new trigger functions with the demo-population safety audit
-- (rental_inventory() hashes every function body, so saved previews become
-- stale and must be regenerated).
do $$
declare reviewed record;
begin
  if to_regclass('demo_population.audited_functions') is not null then
    for reviewed in
      select p.oid, n.nspname || '.' || p.proname as name
      from pg_proc p join pg_namespace n on n.oid = p.pronamespace
      where n.nspname = 'app_private' and p.proname in (
        'guard_verified_landlord_write', 'guard_verified_landlord_chat')
    loop
      insert into demo_population.audited_functions(name, hash)
        values (reviewed.name, md5(pg_get_functiondef(reviewed.oid)))
        on conflict (name) do update set hash = excluded.hash;
    end loop;
  end if;
end;
$$;
