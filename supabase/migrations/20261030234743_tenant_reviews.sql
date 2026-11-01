-- Tenant reviews: a landlord rates a tenant once their lease is over.
--
-- One review per tenancy (tenancy_id is unique) so a re-let unit never
-- inherits an older rating. A landlord can rate once the tenancy has ended or
-- its lease end date has passed, and can edit that single review afterwards.
--
-- Clients never write the table: the only write path is the caller-bound
-- submit_tenant_review() RPC, which resolves landlord_id and tenant_id from
-- the tenancy so they can never be forged. Reads are limited to the landlord
-- who wrote the review, the tenant it is about, landlords who have a rental
-- application or tenancy with that tenant, and admins.

-- 1. Table -----------------------------------------------------------------
create table public.tenant_reviews (
  id uuid primary key default gen_random_uuid(),
  tenancy_id uuid not null unique references public.tenancies (id) on delete cascade,
  landlord_id uuid not null references public.users (id),
  tenant_id uuid not null references public.users (id),
  rating smallint not null check (rating between 1 and 5),
  comment text check (comment is null or char_length(comment) <= 1000),
  created_at timestamptz not null default now(),
  updated_at timestamptz,
  check (landlord_id <> tenant_id)
);

create index tenant_reviews_tenant_created_idx
  on public.tenant_reviews (tenant_id, created_at desc);
create index tenant_reviews_landlord_idx
  on public.tenant_reviews (landlord_id);

alter table public.tenant_reviews enable row level security;

revoke all on table public.tenant_reviews from anon, authenticated;
grant select on table public.tenant_reviews to authenticated;

-- 2. Read policies ---------------------------------------------------------
-- A verified landlord with an application or tenancy for this tenant at one of
-- their own listings may read it, matching who can open the tenant's profile.
-- Unverified landlords read nothing on the landlord side (verified_landlord_gate).
create or replace function app_private.landlord_has_tenant_relationship(p_tenant_id uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select app_private.unverified_landlord_id() is null and (exists (
    select 1 from public.tenancies t
    where t.tenant_id = p_tenant_id
      and t.landlord_id = (select u.id from public.users u where u.user_id = (select auth.uid()))
  ) or exists (
    select 1
    from public.rental_application ra
    join public.apartments a on a.id = ra.apartment_id
    where ra.tenant_id = p_tenant_id
      and a.landlord_id = (select u.id from public.users u where u.user_id = (select auth.uid()))
  ));
$$;
revoke all on function app_private.landlord_has_tenant_relationship(uuid) from public, anon;
grant execute on function app_private.landlord_has_tenant_relationship(uuid) to authenticated;

create policy "Landlords read reviews they wrote" on public.tenant_reviews
  for select to authenticated
  using (landlord_id = (select id from public.users where user_id = (select auth.uid())));

create policy "Tenants read reviews about them" on public.tenant_reviews
  for select to authenticated
  using (tenant_id = (select id from public.users where user_id = (select auth.uid())));

create policy "Related landlords read tenant reviews" on public.tenant_reviews
  for select to authenticated
  using ((select app_private.landlord_has_tenant_relationship(tenant_id)));

create policy "Admins read tenant reviews" on public.tenant_reviews
  for select to authenticated
  using ((select private.is_admin()));

create policy "Active accounts only" on public.tenant_reviews as restrictive
  for all to authenticated
  using ((select app_private.is_active_user()))
  with check ((select app_private.is_active_user()));

-- Unverified landlords cannot read the landlord side, like every other
-- landlord table (verified_landlord_gate).
create policy "Verified landlords only" on public.tenant_reviews as restrictive
  for select to authenticated
  using (not coalesce(landlord_id = (select app_private.unverified_landlord_id()), false));

-- 3. Write path ------------------------------------------------------------
create or replace function public.submit_tenant_review(
  p_tenancy_id uuid,
  p_rating integer,
  p_comment text default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_caller_id uuid;
  v_tenancy public.tenancies%rowtype;
  v_comment text := nullif(btrim(coalesce(p_comment, '')), '');
  v_review_id uuid;
begin
  v_caller_id := app_private.current_active_user_id();
  if v_caller_id is null then
    raise exception 'Your session is no longer active.';
  end if;

  if app_private.unverified_landlord_id() is not null then
    raise exception 'Verify your account to use landlord features.' using errcode = '42501';
  end if;

  select * into v_tenancy from public.tenancies where id = p_tenancy_id;
  if not found or v_tenancy.landlord_id is distinct from v_caller_id then
    raise exception 'Only the landlord of this tenancy can rate the tenant.';
  end if;

  if not exists (
    select 1 from public.users u where u.id = v_caller_id and 'landlord' = any(u.roles)
  ) then
    raise exception 'Only landlords can rate tenants.';
  end if;

  if v_tenancy.tenant_id is null or v_tenancy.tenant_id = v_caller_id then
    raise exception 'You cannot rate yourself.';
  end if;

  if v_tenancy.status is distinct from 'ended'
    and (v_tenancy.lease_end is null or v_tenancy.lease_end > current_date) then
    raise exception 'You can rate a tenant once the lease has ended.' using errcode = '23514';
  end if;

  if p_rating is null or p_rating < 1 or p_rating > 5 then
    raise exception 'Choose a rating from 1 to 5.' using errcode = '23514';
  end if;

  if v_comment is not null and char_length(v_comment) > 1000 then
    raise exception 'Keep your comment under 1,000 characters.' using errcode = '23514';
  end if;

  insert into public.tenant_reviews (tenancy_id, landlord_id, tenant_id, rating, comment)
  values (p_tenancy_id, v_caller_id, v_tenancy.tenant_id, p_rating, v_comment)
  on conflict (tenancy_id) do update
    set rating = excluded.rating,
        comment = excluded.comment,
        updated_at = now()
  returning id into v_review_id;

  return v_review_id;
end;
$$;

revoke all on function public.submit_tenant_review(uuid, integer, text) from public, anon;
grant execute on function public.submit_tenant_review(uuid, integer, text) to authenticated;
