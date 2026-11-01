-- A listing is public only while its landlord's account is verified.
--
-- Mirrors "Hidden listings ..." (admin moderation): anonymous visitors and
-- signed-in users see a listing only when its landlord is verified, except the
-- same participants who may still open an admin-hidden one (the landlord, a
-- tenant with a tenancy there, admins). Images follow listing visibility and
-- new applications / visit requests already require a visible apartment, so
-- they close with it. Verifying the landlord restores the listing; nothing is
-- deleted or rewritten.

-- Lives in public (not app_private) because anonymous visitors evaluate the
-- policy too and hold no usage on app_private; it only reveals what the
-- column-scoped anon grant on users.account_status already exposes.
create or replace function public.is_landlord_account_verified(p_landlord_id uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.users u
    where u.id = p_landlord_id and u.account_status = 'verified'
  );
$$;
revoke all on function public.is_landlord_account_verified(uuid) from public;
grant execute on function public.is_landlord_account_verified(uuid) to anon, authenticated;

drop policy if exists "Unverified landlord listings excluded for anonymous visitors" on public.apartments;
create policy "Unverified landlord listings excluded for anonymous visitors" on public.apartments
  as restrictive for select to anon
  using ((select public.is_landlord_account_verified(landlord_id)));

drop policy if exists "Unverified landlord listings limited to participants" on public.apartments;
create policy "Unverified landlord listings limited to participants" on public.apartments
  as restrictive for select to authenticated
  using ((select public.is_landlord_account_verified(landlord_id))
    or (select app_private.can_view_hidden_apartment(id, landlord_id)));
