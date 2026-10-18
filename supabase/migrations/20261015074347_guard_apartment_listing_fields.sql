-- Listing creation and pricing are protected in the database, not just the
-- web and mobile forms.
--
-- 1. Server-managed columns (verification, moderation, ratings, counters,
--    timestamps) can no longer be set by a client INSERT. Before this, a
--    landlord could insert `is_verified = true` (skipping the admin review
--    queue) or seed fake ratings straight through PostgREST.
-- 2. New listings always start unverified and available. Verification lives
--    in `is_verified` + `apartment_verifications`; `status` is occupancy only.
--    The legacy `unverified` status was never cleared on approval, so it is
--    normalized here.
-- 3. Pricing follows one rule on every client: monthly rent of at least
--    PHP 1,000, a security deposit of none, 1 or 2 months, and advance rent
--    of none or 1 month. Rows priced before this rule stay as they are until
--    their pricing is edited.
-- 4. Listing photos in storage: landlord-only uploads, owner-only deletes.

-- 1. Column-scoped INSERT grant (mirrors the existing column-scoped UPDATE grant).
revoke insert on public.apartments from public, anon, authenticated;
grant insert (
  landlord_id, name, description, monthly_rent, security_deposit, advance_rent,
  rent_due_day, type, street_address, barangay, city, province, zip_code,
  no_bedrooms, no_bathrooms, area_sqm, max_occupants, furnished_type,
  floor_level, lease_duration, latitude, longitude, amenities,
  lease_agreement_url, status
) on public.apartments to authenticated;

-- 2. New client listings: unverified, visible, not moderated.
create or replace function public.guard_new_apartment_listing()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if current_user = 'authenticated' then
    -- `status` stays in the grant so older app builds that still send it keep
    -- working; the value itself is server-decided.
    new.status := 'available';
    new.is_verified := false;
  end if;
  return new;
end;
$$;

revoke all on function public.guard_new_apartment_listing() from public, anon, authenticated;

drop trigger if exists guard_new_apartment_listing on public.apartments;
create trigger guard_new_apartment_listing
  before insert on public.apartments
  for each row execute function public.guard_new_apartment_listing();

-- `unverified` is not an occupancy state; landlords may not set it either.
create or replace function public.guard_apartment_status_update()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if current_user = 'authenticated'
    and new.status = 'unverified'
    and new.status is distinct from old.status then
    raise exception 'Listing verification is managed by APT review.';
  end if;
  return new;
end;
$$;

revoke all on function public.guard_apartment_status_update() from public, anon, authenticated;

drop trigger if exists guard_apartment_status_update on public.apartments;
create trigger guard_apartment_status_update
  before update of status on public.apartments
  for each row execute function public.guard_apartment_status_update();

update public.apartments
set status = 'available', updated_at = now()
where status = 'unverified';

-- 3. Pricing rule. Keep in sync with `@repo/constants` (apartment pricing).
create or replace function public.guard_apartment_pricing()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  v_deposit numeric := coalesce(new.security_deposit, 0);
  v_advance numeric := coalesce(new.advance_rent, 0);
begin
  -- Unrelated edits to a listing priced before this rule are not blocked.
  if tg_op = 'UPDATE'
    and new.monthly_rent is not distinct from old.monthly_rent
    and new.security_deposit is not distinct from old.security_deposit
    and new.advance_rent is not distinct from old.advance_rent then
    return new;
  end if;

  if new.monthly_rent is null or new.monthly_rent < 1000 then
    raise exception 'Monthly rent must be at least ₱1,000.';
  end if;

  if v_deposit not in (0, new.monthly_rent, new.monthly_rent * 2) then
    raise exception 'Security deposit must be none, 1 month, or 2 months of rent.';
  end if;

  if v_advance not in (0, new.monthly_rent) then
    raise exception 'Advance rent must be none or 1 month of rent.';
  end if;

  return new;
end;
$$;

revoke all on function public.guard_apartment_pricing() from public, anon, authenticated;

drop trigger if exists guard_apartment_pricing on public.apartments;
create trigger guard_apartment_pricing
  before insert or update of monthly_rent, security_deposit, advance_rent on public.apartments
  for each row execute function public.guard_apartment_pricing();

-- 4. Listing photo storage. Any signed-in user could delete any listing
--    photo and any account could upload into the bucket. Photos are now
--    uploaded by landlords only and deleted only by the account that
--    uploaded them. Reads stay public (permanent CDN URLs).
drop policy if exists "Landlords can upload apartment images" on storage.objects;
create policy "Landlords can upload apartment images" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'apartment-images'
    and exists (
      select 1 from public.users
      where users.user_id = (select auth.uid())
        and 'landlord' = any (users.roles)
    )
  );

drop policy if exists "Landlords can delete apartment images" on storage.objects;
create policy "Landlords can delete apartment images" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'apartment-images'
    and owner_id = (select auth.uid())::text
  );
