# Own meter requirement (electricity and water)

APT accepts only units with their own dedicated electricity and water meters.
Shared meters and landlord submeters are not accepted for either utility. This
says nothing about whether utilities are included in rent or who pays the provider.

The stored flag keeps its original name, `apartments.has_own_electricity_meter`,
so older clients and rows keep working; it now means "own electricity and water
meters". Migration `20261107170000_own_meter_electricity_and_water.sql` only
replaces the refusal message and the column comment (no rows are rewritten).
Listings classified true by the earlier rollout policy are therefore shown with the
new wording; that extends the same policy decision to the water meter and implies
no inspection.

## Forms and display

Web and mobile use the same wording and strict confirmation validation from
`packages/constants/src/apartment/electricity-meter.ts`. The existing Apartment
Info / Property Details form places a required, initially unchecked confirmation
after Floor Level / Lease Duration; no new section or step is added. Edit forms
load the saved confirmation and cannot save it unchecked. Publishing independently
checks it again before uploading anything.

Listing details and previews show **Own meter (electricity and water)** only for a true
`apartments.has_own_electricity_meter`. Landlord property details show it under the
"Utility meters" label (`OWN_ELECTRICITY_METER_FIELD_LABEL`). All wording and
`getOwnElectricityMeterDetail` live in the shared constants file.
The confirmation is a landlord declaration, not an APT verification badge.

## Database and existing listings

Migration `20261106210000_apartment_own_electricity_meter.sql` adds a non-null
boolean. All apartments existing at migration time are classified true, as an
explicit product decision; no individual meter inspection is implied. Adding
the column with a constant true default avoids row UPDATE triggers and preserves
existing timestamps. The default is then changed to false for future inserts.

A trigger rejects new inserts without explicit true and any attempt to clear
the field. Only column-level grants are added; existing owner RLS and listing
guards still apply. No other apartment or notification trigger is changed.

## Release order

1. Confirm the intended Supabase project against the active app's public URL,
   supplied by the operator without reading `.env` files.
2. Apply the migration before releasing either client; the new field is read by
   their detail queries and sent on insert.
3. Deploy web and distribute the mobile JavaScript update together. Old mobile
   versions cannot create listings after migration because they omit confirmation;
   require an updated app before they can publish. Existing listing reads using
   older clients continue to work. No native dependency or rebuild is introduced
   by this feature itself.

No hosted schema or data is changed simply by adding these files. Do not bypass
the requirement with a default true for new rows to accommodate old clients.

## Verification

- `pnpm db:listing-meter:test`: embedded PostgreSQL checks for backfill, timestamp
  preservation, explicit confirmation, anonymous read, column grants and RLS.
- Web `lib/electricity-meter.test.mjs`: shared validation and form/display wiring.
- Mobile `tests/apartments/electricity-meter.test.tsx`: default/reset behavior,
  checkbox interactions and conditional listing detail display.
- Mobile `hooks/apartments/usePublishApartment.test.ts`: final publishing checks,
  explicit insert payload and database refusal messages before any upload.
