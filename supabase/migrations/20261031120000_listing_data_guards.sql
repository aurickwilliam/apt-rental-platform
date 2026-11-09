-- Listing data guards, from the 2026-10-31 property listings audit
-- (docs/audits/property-listings-audit-2026-10-31.md, section E).
--
-- Three triggers on future writes plus one read-only view. Nothing here rewrites,
-- validates or rejects an existing row: every guard fires only when the guarded
-- column is written, so the 68 audited listings stay exactly as they are.

-- ---------------------------------------------------------------------------
-- 1. Amenities: only known ids, no duplicates.
--
-- The list is the mobile amenity catalog (apps/mobile/constants/perks.ts), which
-- is a superset of the web catalog (apps/web/app/components/inputs/perks.ts).
-- Adding an amenity to either picker needs a new migration that extends this
-- list; apps/web/lib/amenity-catalog-sync.test.mjs fails when they drift.
-- Conflicting pairs (Smoking vs Non-Smoking, No Cooking vs a kitchen item) stay a
-- picker rule (`AMENITY_CONFLICTS`): older rows hold both, so the database does
-- not repeat it.

create or replace function public.guard_apartment_amenities()
returns trigger language plpgsql set search_path = '' as $$
declare
  v_catalog constant text[] := array[
    'ac', 'all_female', 'backup_power', 'balcony', 'bath', 'bed', 'bidet', 'cabletv', 'cctv',
    'ceiling_fan', 'childfriendly', 'cleaning', 'concierge', 'cooking_utensils', 'covered_parking',
    'curfew', 'dining_table', 'double_bed', 'dryer', 'electricfan', 'electricity', 'elevator',
    'fast_internet', 'fenced', 'fire_escape', 'fireextinguisher', 'fridge', 'function_hall',
    'furniture', 'game_room', 'garbage_collection', 'garden', 'gated', 'generator', 'gym',
    'hotwater', 'intercom', 'kettle', 'kitchen', 'lamp', 'laundry_area', 'lobby', 'lounge', 'mail',
    'maintenance', 'microwave', 'motorbikeparking', 'moving_in', 'near_hospital', 'near_mall',
    'near_school', 'near_transport', 'no_cooking', 'nonsmoking', 'oven', 'parking', 'parkroad',
    'pest_control', 'petfriendly', 'pool', 'rice_cooker', 'rooftop', 'security', 'smartlock',
    'smokealarm', 'smoking', 'solar', 'soundproof', 'storage', 'stove', 'study_room', 'terrace',
    'toaster', 'toilet', 'tv', 'vending_machine', 'wardrobe', 'washer', 'water', 'water_dispenser',
    'wheelchair', 'wifi', 'work_desk'
  ];
  v_unknown text;
begin
  if new.amenities is null then
    return new;
  end if;

  select a into v_unknown
  from unnest(new.amenities) as a
  where a is null or not (a = any (v_catalog))
  limit 1;
  if found then
    raise exception 'Unknown amenity: %.', coalesce(v_unknown, 'null') using errcode = '23514';
  end if;

  if cardinality(new.amenities) <> (select count(distinct a) from unnest(new.amenities) as a) then
    raise exception 'A listing cannot list the same amenity twice.' using errcode = '23514';
  end if;

  return new;
end;
$$;
revoke all on function public.guard_apartment_amenities() from public, anon, authenticated;

drop trigger if exists guard_apartment_amenities on public.apartments;
create trigger guard_apartment_amenities
  before insert or update of amenities on public.apartments
  for each row execute function public.guard_apartment_amenities();

-- ---------------------------------------------------------------------------
-- 2. The Verified flag moves to true only through the verification review.
--
-- Clients hold no write grant on apartments.is_verified, so this guards the
-- privileged paths (operator SQL, seed scripts, new functions). The review itself
-- is unchanged: sync_apartment_verification_review sets the flag while the
-- verification row is still `pending` (its own BEFORE UPDATE), so a pending or
-- approved row is what this accepts. A deliberate bulk change, such as seeding
-- demo listings, opts in for its own transaction only:
--
--   set local app.allow_unreviewed_verified = 'on';
--
-- Rows that are already verified, and any change to false, are never blocked.

create or replace function public.guard_apartment_verified_flag()
returns trigger language plpgsql set search_path = '' as $$
begin
  if new.is_verified is not true or (tg_op = 'UPDATE' and old.is_verified is true) then
    return new;
  end if;

  -- Client inserts are already forced to false by guard_new_apartment_listing.
  if tg_op = 'INSERT' and current_user = 'authenticated' then
    return new;
  end if;

  if coalesce(current_setting('app.allow_unreviewed_verified', true), '') = 'on' then
    return new;
  end if;

  if tg_op = 'UPDATE' and exists (
    select 1 from public.apartment_verifications v
    where v.apartment_id = new.id and v.status in ('pending', 'approved')
  ) then
    return new;
  end if;

  raise exception 'A listing can only be marked verified through the verification review.'
    using errcode = '42501';
end;
$$;
revoke all on function public.guard_apartment_verified_flag() from public, anon, authenticated;

drop trigger if exists guard_apartment_verified_flag on public.apartments;
create trigger guard_apartment_verified_flag
  before insert or update of is_verified on public.apartments
  for each row execute function public.guard_apartment_verified_flag();

-- ---------------------------------------------------------------------------
-- 3. Landlord-added listing photos must live in the apartment-images bucket.
--
-- Photos are uploaded to storage and stored by their public storage URL. A client
-- cannot point a listing at a stock-photo host or a tracking pixel. Operator and
-- service-role writes are not restricted (current_user is not `authenticated`),
-- and existing rows are untouched: the guard fires only when url / url_thumb are
-- written.

create or replace function public.guard_apartment_image_url()
returns trigger language plpgsql set search_path = '' as $$
declare
  v_pattern constant text := '^https?://[^/]+/storage/v1/object/public/apartment-images/.+';
begin
  if current_user <> 'authenticated' then
    return new;
  end if;

  if new.url !~ v_pattern or (new.url_thumb is not null and new.url_thumb !~ v_pattern) then
    raise exception 'Listing photos must be uploaded to APT.' using errcode = '23514';
  end if;

  return new;
end;
$$;
revoke all on function public.guard_apartment_image_url() from public, anon, authenticated;

drop trigger if exists guard_apartment_image_url on public.apartment_images;
create trigger guard_apartment_image_url
  before insert or update of url, url_thumb on public.apartment_images
  for each row execute function public.guard_apartment_image_url();

-- ---------------------------------------------------------------------------
-- 4. Repeatable data-quality check (read-only, operators only).
--
--   select * from private.listing_data_quality order by finding, name;
--
-- Covers the audit's SQL-expressible findings for live listings. Barangay names,
-- ZIP blocks and near-duplicate photos need the shared TypeScript tables and stay
-- in the audit scripts.

create or replace view private.listing_data_quality
with (security_invoker = true) as
select a.id as apartment_id, a.name, 'pin_outside_stated_city'::text as finding,
       format('%s (%s, %s)', a.city, a.latitude, a.longitude) as detail
from public.apartments a
where a.deleted_at is null
  and not public.validate_camanava_location(a.city, a.latitude, a.longitude)
union all
select a.id, a.name, 'verified_without_review', 'is_verified is true with no approved verification'
from public.apartments a
where a.deleted_at is null and a.is_verified
  and not exists (
    select 1 from public.apartment_verifications v
    where v.apartment_id = a.id and v.status = 'approved'
  )
union all
select a.id, a.name, 'pricing_off_rule',
       format('rent %s, deposit %s, advance %s', a.monthly_rent, a.security_deposit, a.advance_rent)
from public.apartments a
where a.deleted_at is null
  and (a.security_deposit is null or a.advance_rent is null
       or a.security_deposit not in (0, a.monthly_rent, a.monthly_rent * 2)
       or a.advance_rent not in (0, a.monthly_rent))
union all
select a.id, a.name, 'description_too_short', format('%s characters', char_length(btrim(a.description)))
from public.apartments a
where a.deleted_at is null and char_length(btrim(a.description)) < 20
union all
select a.id, a.name, 'photo_outside_bucket', i.url
from public.apartments a
join public.apartment_images i on i.apartment_id = a.id
where a.deleted_at is null
  and i.url !~ '^https?://[^/]+/storage/v1/object/public/apartment-images/.+'
union all
select a.id, a.name, 'no_cover_photo', 'listing has no cover image'
from public.apartments a
where a.deleted_at is null
  and not exists (select 1 from public.apartment_images i where i.apartment_id = a.id and i.is_cover)
union all
select a.id, a.name, 'name_whitespace', format('"%s"', a.name)
from public.apartments a
where a.deleted_at is null and a.name <> btrim(a.name);

revoke all on private.listing_data_quality from public, anon, authenticated;
