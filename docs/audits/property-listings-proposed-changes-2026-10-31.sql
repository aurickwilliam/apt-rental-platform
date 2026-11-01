-- Property listings audit, 2026-10-31: PROPOSED changes. NOT EXECUTED.
-- Target: Supabase project ezxirkpgfpripjydcqnt ("APT", production).
-- Report: docs/audits/property-listings-audit-2026-10-31.md (section G).
--
-- How to run (after approval):
--   1. Dry run: execute the whole file with the final COMMIT replaced by ROLLBACK, read the
--      RETURNING / verification output, then run it again with COMMIT.
--   2. Every UPDATE is compare-and-set (it only touches a row whose current value equals the one
--      audited), so a listing edited since the audit is skipped, never overwritten.
--   3. Undo with the ROLLBACK section at the bottom.

begin;

-- 1. Backup of every row this file can touch (drop the table to undo; nothing depends on it).
create table if not exists private.listing_audit_backup_20261031 as
select now() as backed_up_at, a.*
from public.apartments a
where false;

insert into private.listing_audit_backup_20261031
select now(), a.*
from public.apartments a
where a.id in (
  select ap.id from public.apartments ap
  where ap.deleted_at is null
    and exists (select 1 from public.apartment_images i
                where i.apartment_id = ap.id and i.url like 'https://images.unsplash.com/%')
)
or a.id in ('64f7181f-47de-4359-9dc0-50deaa292da5')                       -- Cozy Cove (name)
or a.id in ('07e36e58-6ead-4801-83bb-172db3898b63',                       -- Bagumbayan Norte
            '81ad4faf-b38d-4e29-b5d8-5e63df8b9b8a',                       -- Bagumbayan Sur
            'ad6045ba-d0f6-48fd-8217-c58901e80286');                      -- Tanong

-- 2. Description rewrite for the 54 seeded listings whose text names places outside their address.
--    Text is built only from stored fields; no landmarks, transport or condition claims.
--    Bignay Budget Dormitory (8ef5c491) and Lingunan 2BR (f253a347) are excluded: their text is
--    short but not false.
with lbl(id, label) as (values
 ('bath','Shower/Bathtub'),('hotwater','Hot Water'),('toilet','Private Toilet'),('cleaning','Cleaning Essentials'),
 ('washer','Washing Machine'),('dryer','Dryer'),('wifi','Wi-Fi'),('tv','TV'),('cabletv','Cable TV'),
 ('ac','Air Conditioning'),('electricfan','Electric Fan'),('ceiling_fan','Ceiling Fan'),('fridge','Refrigerator'),
 ('microwave','Microwave'),('kettle','Electric Kettle'),('kitchen','Kitchen'),('stove','Stove'),
 ('cooking_utensils','Cooking Utensils'),('no_cooking','No Cooking Allowed'),('water_dispenser','Water Dispenser'),
 ('wardrobe','Wardrobe'),('bed','Bed Included'),('lamp','Study Lamp'),('balcony','Balcony Access'),('garden','Garden'),
 ('fenced','Fenced Compound'),('elevator','Elevator'),('rooftop','Rooftop Access'),('parking','Parking'),
 ('parkroad','Street Parking'),('motorbikeparking','Motorbike Parking'),('covered_parking','Covered Parking'),
 ('security','Security Guard'),('cctv','CCTV'),('smartlock','Smart Lock'),('intercom','Intercom / Doorbell'),
 ('smokealarm','Smoke Alarm'),('fireextinguisher','Fire Extinguisher'),('electricity','Electricity Included'),
 ('water','Water Included'),('generator','Generator / Backup Power'),('gym','Gym Access'),('pool','Swimming Pool'),
 ('petfriendly','Pet Friendly'),('childfriendly','Child Friendly'),('nonsmoking','Non-Smoking'),
 ('smoking','Smoking Allowed'),('storage','Storage Room'),('moving_in','Move-in Ready')),
seed as (
  select a.* from public.apartments a
  where a.deleted_at is null
    and a.id not in ('8ef5c491-8562-4331-8b62-2c0ea6477f5b','f253a347-8c3a-43fe-a1e5-6c3e36f497bf')
    and exists (select 1 from public.apartment_images i
                where i.apartment_id = a.id and i.url like 'https://images.unsplash.com/%')
),
g as (
  select s.id, s.description as old_desc,
    format(E'%s is a %s %s in %s, %s, Metro Manila. It has %s bedroom%s and %s bathroom%s, with a floor area of %s sqm, and is set up for up to %s occupants. Floor level: %s.',
      s.name, lower(coalesce(s.furnished_type,'unspecified furnishing')), lower(s.type), s.barangay, s.city,
      s.no_bedrooms, case when s.no_bedrooms = 1 then '' else 's' end,
      s.no_bathrooms, case when s.no_bathrooms = 1 then '' else 's' end,
      trim(trailing '.' from trim(trailing '0' from s.area_sqm::text)),
      coalesce(s.max_occupants::text,'(not stated)'), coalesce(s.floor_level,'not stated'))
    || coalesce(E'\n\nListed amenities: ' ||
         nullif((select string_agg(l.label, ', ' order by l.label)
                 from unnest(s.amenities) a2 join lbl l on l.id = a2), '') || '.', '')
    || format(E'\n\nRental terms: ₱%s per month, due on day %s of each month. Security deposit: %s. Advance rent: %s. Lease duration: %s.',
         to_char(s.monthly_rent,'FM999,999,990'), s.rent_due_day,
         case when coalesce(s.security_deposit,0) = 0 then 'none'
              else '₱'||to_char(s.security_deposit,'FM999,999,990')||' ('||round(s.security_deposit/s.monthly_rent)||' month'
                   ||case when s.security_deposit/s.monthly_rent > 1 then 's' else '' end||')' end,
         case when coalesce(s.advance_rent,0) = 0 then 'none'
              else '₱'||to_char(s.advance_rent,'FM999,999,990')||' (1 month)' end,
         coalesce(s.lease_duration,'not stated'))
    || E'\n\nPlease confirm the unit condition, utilities and house rules with the landlord before applying.' as new_desc
  from seed s
)
update public.apartments a
set description = g.new_desc
from g
where a.id = g.id
  and a.description = g.old_desc                       -- compare-and-set
  and char_length(g.new_desc) <= 2000                  -- MAX_DESCRIPTION_LENGTH
returning left(a.id::text, 8) as id, a.name, char_length(a.description) as new_len;
-- expected: 54 rows

-- 3. Trailing space in a listing name.
update public.apartments
set name = btrim(name)
where id = '64f7181f-47de-4359-9dc0-50deaa292da5' and name <> btrim(name)
returning left(id::text, 8) as id, name;
-- expected: 1 row

-- 4. Canonical spellings of the same barangays (PSGC).
update public.apartments set barangay = 'Bagumbayan North'
where id = '07e36e58-6ead-4801-83bb-172db3898b63' and city = 'Navotas' and barangay = 'Bagumbayan Norte'
returning left(id::text, 8) as id, barangay;
update public.apartments set barangay = 'Bagumbayan South'
where id = '81ad4faf-b38d-4e29-b5d8-5e63df8b9b8a' and city = 'Navotas' and barangay = 'Bagumbayan Sur'
returning left(id::text, 8) as id, barangay;
update public.apartments set barangay = 'Tañong'
where id = 'ad6045ba-d0f6-48fd-8217-c58901e80286' and city = 'Malabon' and barangay = 'Tanong'
returning left(id::text, 8) as id, barangay;
-- expected: 1 row each

-- 5. Verification inside the transaction (all should hold before COMMIT).
select
  (select count(*) from public.apartments a
     where a.description like '%Please confirm the unit condition, utilities and house rules%') = 54  as descriptions_ok,
  (select count(*) from public.apartments where name <> btrim(name)) = 0                               as names_trimmed,
  (select count(*) from public.apartments a
     join private.listing_audit_backup_20261031 b using (id)
     where a.monthly_rent is distinct from b.monthly_rent
        or a.security_deposit is distinct from b.security_deposit
        or a.advance_rent is distinct from b.advance_rent
        or a.latitude is distinct from b.latitude
        or a.longitude is distinct from b.longitude
        or a.city is distinct from b.city
        or a.amenities is distinct from b.amenities
        or a.landlord_id is distinct from b.landlord_id) = 0                                          as nothing_material_changed;

commit;  -- use ROLLBACK for the dry run

-- ROLLBACK SECTION (run later if needed): restores exactly the columns this file changes.
-- update public.apartments a
-- set description = b.description, name = b.name, barangay = b.barangay
-- from private.listing_audit_backup_20261031 b
-- where a.id = b.id;
-- drop table private.listing_audit_backup_20261031;

-- ---------------------------------------------------------------------------------------------
-- Read-only: full-ID version of the per-listing matrix (run any time).
-- select a.id, a.name, a.landlord_id, a.deleted_at is not null as deleted,
--        public.validate_camanava_location(a.city, a.latitude, a.longitude) as pin_in_stated_city,
--        a.is_verified,
--        exists (select 1 from public.apartment_verifications v
--                where v.apartment_id = a.id and v.status = 'approved') as has_approved_verification
-- from public.apartments a order by a.name;
