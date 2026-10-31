-- Tenant reviews follow-up (after 20261030234743_tenant_reviews.sql).
--
-- 1. Only a finished tenancy (status = 'ended') can be rated. The first version
--    also accepted any tenancy whose lease_end had passed, which let a landlord
--    rate a cancelled, never-started or still-occupied tenancy.
-- 2. get_tenant_reviews() returns a tenant's ratings together with the author's
--    name and the stay context. The apartment and lease dates live on a tenancy
--    that other landlords cannot read, so the table embed came back empty for
--    ratings written by someone else.
-- 3. Admins can hide a rating (admin_set_tenant_review_hidden). A hidden rating
--    disappears for everyone but admins and no longer counts toward the average.

-- 1. Moderation columns -----------------------------------------------------
alter table public.tenant_reviews
  add column is_hidden_by_admin boolean not null default false,
  add column hidden_at timestamptz,
  add column hidden_by uuid references public.users (id),
  add column hidden_reason text check (hidden_reason is null or char_length(hidden_reason) <= 500);

create policy "Hidden ratings are admin only" on public.tenant_reviews as restrictive
  for select to authenticated
  using (not is_hidden_by_admin or (select private.is_admin()));

-- 2. Rating is allowed for ended tenancies only ------------------------------
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
  v_hidden boolean;
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

  if v_tenancy.status is distinct from 'ended' then
    raise exception 'You can rate a tenant once the lease has ended.' using errcode = '23514';
  end if;

  if p_rating is null or p_rating < 1 or p_rating > 5 then
    raise exception 'Choose a rating from 1 to 5.' using errcode = '23514';
  end if;

  if v_comment is not null and char_length(v_comment) > 1000 then
    raise exception 'Keep your comment under 1,000 characters.' using errcode = '23514';
  end if;

  select r.is_hidden_by_admin into v_hidden
  from public.tenant_reviews r where r.tenancy_id = p_tenancy_id;
  if coalesce(v_hidden, false) then
    raise exception 'This rating was removed by an administrator.' using errcode = '42501';
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

-- 3. Read path with author and stay context ----------------------------------
-- Same audience as the table policies: the tenant, the author, a verified
-- landlord with an application or tenancy for the tenant, and admins. The
-- author's name and the apartment name and lease dates are exposed only through
-- this function, never the tenancy row itself.
create or replace function public.get_tenant_reviews(p_tenant_id uuid)
returns table (
  id uuid,
  tenancy_id uuid,
  landlord_id uuid,
  rating smallint,
  comment text,
  created_at timestamptz,
  updated_at timestamptz,
  landlord_first_name text,
  landlord_last_name text,
  landlord_avatar_url text,
  apartment_name text,
  lease_start date,
  lease_end date,
  is_mine boolean
)
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_caller_id uuid := app_private.current_active_user_id();
  v_unverified uuid := app_private.unverified_landlord_id();
  v_is_admin boolean := coalesce((select private.is_admin()), false);
  v_can_read_all boolean;
begin
  if v_caller_id is null or p_tenant_id is null then
    return;
  end if;

  v_can_read_all := v_caller_id = p_tenant_id
    or v_is_admin
    or app_private.landlord_has_tenant_relationship(p_tenant_id);

  return query
  select r.id, r.tenancy_id, r.landlord_id, r.rating, r.comment, r.created_at, r.updated_at,
         u.first_name, u.last_name, u.avatar_url,
         a.name, t.lease_start, t.lease_end,
         r.landlord_id = v_caller_id
  from public.tenant_reviews r
  join public.users u on u.id = r.landlord_id
  left join public.tenancies t on t.id = r.tenancy_id
  left join public.apartments a on a.id = t.apartment_id
  where r.tenant_id = p_tenant_id
    and (v_can_read_all or r.landlord_id = v_caller_id)
    and r.landlord_id is distinct from v_unverified
    and (v_is_admin or not r.is_hidden_by_admin)
  order by r.created_at desc
  limit 50;
end;
$$;

revoke all on function public.get_tenant_reviews(uuid) from public, anon;
grant execute on function public.get_tenant_reviews(uuid) to authenticated;

-- 4. Admin moderation ---------------------------------------------------------
create or replace function public.admin_set_tenant_review_hidden(
  p_review_id uuid,
  p_hide boolean,
  p_reason text default null
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_admin_id uuid;
  v_review public.tenant_reviews%rowtype;
  v_reason text := nullif(btrim(coalesce(p_reason, '')), '');
begin
  if not coalesce((select private.is_admin()), false) then
    raise exception 'Admin access required.';
  end if;
  select u.id into v_admin_id from public.users u
  where u.user_id = (select auth.uid()) and 'admin' = any(u.roles) and not u.is_suspended;
  if v_admin_id is null then
    raise exception 'Admin access required.';
  end if;

  if p_hide and (v_reason is null or char_length(v_reason) < 3 or char_length(v_reason) > 500) then
    raise exception 'A reason between 3 and 500 characters is required.';
  end if;

  select * into v_review from public.tenant_reviews where id = p_review_id for update;
  if not found or v_review.is_hidden_by_admin = p_hide then
    raise exception 'Invalid rating visibility transition.';
  end if;

  update public.tenant_reviews set
    is_hidden_by_admin = p_hide,
    hidden_at = case when p_hide then now() else null end,
    hidden_by = case when p_hide then v_admin_id else null end,
    hidden_reason = case when p_hide then v_reason else null end
  where id = p_review_id;
end;
$$;

revoke all on function public.admin_set_tenant_review_hidden(uuid, boolean, text) from public, anon;
grant execute on function public.admin_set_tenant_review_hidden(uuid, boolean, text) to authenticated;
