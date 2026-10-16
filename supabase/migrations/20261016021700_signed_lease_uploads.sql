-- Signed lease agreements: one executed contract per tenancy.
--
-- Approval (handle_application_approved) creates the tenancy; the signed
-- lease lives on that row because both the landlord (My Properties) and the
-- tenant (My Rental) already load it. The unsigned TEMPLATE stays on
-- apartments.lease_agreement_url; the executed contract is personal data, so
-- it gets its own private bucket with tenancy-scoped policies and a single
-- RPC write path (register_push_token-style):

-- 1. Columns ---------------------------------------------------------------
alter table public.tenancies
  add column signed_lease_path text,
  add column signed_lease_uploaded_at timestamptz,
  add column signed_lease_uploaded_by uuid references public.users (id),
  add column tenant_acknowledged_at timestamptz;

-- 2. Bucket ----------------------------------------------------------------
-- Path format: {tenancy_id}/{timestamp}.{ext}. PDF scans and photos only.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'signed-leases',
  'signed-leases',
  false,
  10485760,
  array['application/pdf', 'image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do nothing;

-- 3. Storage helpers -------------------------------------------------------
-- The tenancy folder is compared as text so a malformed path can never raise
-- a cast error inside a policy. Landlord+active gates uploads and deletes;
-- landlord-or-tenant (no status filter) keeps historical reads available.

create or replace function private.signed_lease_landlord_can_upload(object_name text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.tenancies t
    where t.id::text = split_part(object_name, '/', 1)
      and split_part(object_name, '/', 2) <> ''
      and t.status = 'active'
      and t.landlord_id = (select u.id from public.users u where u.user_id = auth.uid())
  );
$$;

revoke all on function private.signed_lease_landlord_can_upload(text) from public, anon;
grant execute on function private.signed_lease_landlord_can_upload(text) to authenticated;

create or replace function private.signed_lease_member_can_read(object_name text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.tenancies t
    where t.id::text = split_part(object_name, '/', 1)
      and split_part(object_name, '/', 2) <> ''
      and (
        t.landlord_id = (select u.id from public.users u where u.user_id = auth.uid())
        or t.tenant_id = (select u.id from public.users u where u.user_id = auth.uid())
      )
  );
$$;

revoke all on function private.signed_lease_member_can_read(text) from public, anon;
grant execute on function private.signed_lease_member_can_read(text) to authenticated;

-- 4. Storage policies ------------------------------------------------------

create policy "Landlords can upload signed leases"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'signed-leases'
    and (select private.signed_lease_landlord_can_upload(name))
  );

create policy "Landlords and tenants can read signed leases"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'signed-leases'
    and (select private.signed_lease_member_can_read(name))
  );

create policy "Landlords can delete signed leases"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'signed-leases'
    and (select private.signed_lease_landlord_can_upload(name))
  );

-- 5. Write path ------------------------------------------------------------
-- Validates the caller, the tenancy and the uploaded object, then fills the
-- three columns. Replacing the file (path change) resets the tenant's
-- acknowledgement so it always refers to the current document.

create or replace function public.set_tenancy_signed_lease(p_tenancy_id uuid, p_path text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_caller_id uuid;
  v_tenancy public.tenancies%rowtype;
begin
  v_caller_id := app_private.current_active_user_id();
  if v_caller_id is null then
    raise exception 'Your session is no longer active.';
  end if;

  select * into v_tenancy from public.tenancies where id = p_tenancy_id;
  if not found then
    raise exception 'Tenancy not found.';
  end if;
  if v_tenancy.landlord_id is distinct from v_caller_id then
    raise exception 'Only the landlord can save a signed lease.';
  end if;
  if v_tenancy.status <> 'active' then
    raise exception 'The signed lease can only be saved while the tenancy is active.';
  end if;
  if p_path is null
     or split_part(p_path, '/', 1) <> p_tenancy_id::text
     or split_part(p_path, '/', 2) = ''
  then
    raise exception 'The lease file must be uploaded to this tenancy''s folder.';
  end if;
  if not exists (
    select 1 from storage.objects o
    where o.bucket_id = 'signed-leases' and o.name = p_path
  ) then
    raise exception 'Upload the lease file before saving.';
  end if;

  update public.tenancies
  set signed_lease_path = p_path,
      signed_lease_uploaded_at = now(),
      signed_lease_uploaded_by = v_caller_id,
      tenant_acknowledged_at = case
        when signed_lease_path is distinct from p_path then null
        else tenant_acknowledged_at
      end
  where id = p_tenancy_id;
end;
$$;

revoke all on function public.set_tenancy_signed_lease(uuid, text) from public, anon;
grant execute on function public.set_tenancy_signed_lease(uuid, text) to authenticated;

-- 6. Tenant acknowledgement -------------------------------------------------
-- Tenants cannot update tenancies rows (landlord-only UPDATE policy), so the
-- confirmation goes through this caller-bound RPC. Idempotent.

create or replace function public.acknowledge_signed_lease(p_tenancy_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_caller_id uuid;
  v_tenancy public.tenancies%rowtype;
begin
  v_caller_id := app_private.current_active_user_id();
  if v_caller_id is null then
    raise exception 'Your session is no longer active.';
  end if;

  select * into v_tenancy from public.tenancies where id = p_tenancy_id;
  if not found or v_tenancy.tenant_id is distinct from v_caller_id then
    raise exception 'Only the tenant of this tenancy can confirm the lease.';
  end if;
  if v_tenancy.signed_lease_path is null then
    raise exception 'There is no signed lease to confirm yet.';
  end if;

  update public.tenancies
  set tenant_acknowledged_at = coalesce(tenant_acknowledged_at, now())
  where id = p_tenancy_id;
end;
$$;

revoke all on function public.acknowledge_signed_lease(uuid) from public, anon;
grant execute on function public.acknowledge_signed_lease(uuid) to authenticated;

-- 7. Guard ------------------------------------------------------------------
-- authenticated has table-wide UPDATE on tenancies (plus the landlord RLS
-- policy), so without this guard a client could write the lease columns
-- directly and skip the RPC validation. SECURITY DEFINER callers (the two
-- RPCs) and server-side roles keep working; only direct client writes of
-- these four columns are rejected.

create or replace function public.guard_tenancy_signed_lease_fields()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if current_user = 'authenticated' and (
    new.signed_lease_path is distinct from old.signed_lease_path
    or new.signed_lease_uploaded_at is distinct from old.signed_lease_uploaded_at
    or new.signed_lease_uploaded_by is distinct from old.signed_lease_uploaded_by
    or new.tenant_acknowledged_at is distinct from old.tenant_acknowledged_at
  ) then
    raise exception 'Signed lease details are updated through the signed lease actions.'
      using errcode = 'P0001';
  end if;
  return new;
end;
$$;

revoke all on function public.guard_tenancy_signed_lease_fields() from public, anon, authenticated;

drop trigger if exists guard_tenancy_signed_lease_fields on public.tenancies;
create trigger guard_tenancy_signed_lease_fields
  before update on public.tenancies
  for each row
  execute function public.guard_tenancy_signed_lease_fields();
