-- Restore the explicit self-service profile allowlist. Revoking a table-wide
-- UPDATE grant (for example when protecting Auth-managed email) must not leave
-- legitimate profile edits without column grants.
--
-- Names and birth date are needed by profile completion, even though the Edit
-- Profile UI locks them. Owner-only and active-account RLS, plus both guards,
-- remain unchanged. Never grant table-wide UPDATE or client UPDATE(email).
revoke update on public.users from public, anon, authenticated;
revoke update (email) on public.users from public, anon, authenticated;

grant update (
  first_name, last_name, middle_name, suffix, gender, mobile_number,
  birth_date, street_address, barangay, city, province, postal_code,
  avatar_url, background_url, preferences, updated_at
) on public.users to authenticated;
