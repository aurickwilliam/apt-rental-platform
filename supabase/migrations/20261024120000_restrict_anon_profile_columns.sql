-- public.users had a table-wide SELECT grant for `anon`, and two policies make
-- every landlord and tenant row readable ("Anyone can view landlord profiles",
-- "Anyone can view tenant info for reviews"). Together they let anyone holding
-- the public anon key (shipped in both apps) read every landlord's and tenant's
-- email, mobile number, birth date and home address without signing in.
--
-- Signed-out visitors only ever need the display fields behind public listing
-- and review pages (landlord/reviewer name and photo), so anon is limited to
-- those columns. Signed-in roles are unchanged here. Selecting any other
-- column (or `select *`) as anon now fails with "permission denied".
revoke select on public.users from anon;

grant select (
  id, first_name, middle_name, last_name, suffix,
  avatar_url, background_url, roles, account_status, created_at
) on public.users to anon;
