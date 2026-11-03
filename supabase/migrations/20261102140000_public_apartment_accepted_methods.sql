-- Public read of the payment methods a listing's landlord accepts, so an apartment page can
-- show them to anyone (signed-out visitors included). Method names only: no account
-- numbers, no credentials. A landlord with no saved setting accepts every method.
--
-- The function answers only for a listing the public can already see (not deleted, not
-- hidden by an admin, owned by a verified landlord) and returns null for anything else, so it
-- cannot be used to probe a hidden listing or an arbitrary landlord. The table itself stays
-- private to its landlord.

create or replace function public.get_apartment_accepted_methods(p_apartment_id uuid)
returns text[] language sql stable security definer set search_path = '' as $$
  select coalesce(
    (select s.accepted_methods
     from public.landlord_payment_settings s
     where s.landlord_id = a.landlord_id),
    array['gcash', 'maya', 'qrph', 'bank_transfer', 'card', 'cash']::text[])
  from public.apartments a
  where a.id = p_apartment_id
    and a.deleted_at is null
    and a.is_hidden_by_admin = false
    and public.is_landlord_account_verified(a.landlord_id);
$$;
revoke all on function public.get_apartment_accepted_methods(uuid) from public;
grant execute on function public.get_apartment_accepted_methods(uuid) to anon, authenticated;
