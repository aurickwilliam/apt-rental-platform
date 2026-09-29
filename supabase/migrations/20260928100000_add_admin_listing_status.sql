-- Classify each current, non-deleted listing exactly once for an inventory
-- composition chart. Visibility and verification can overlap availability,
-- so use an explicit priority and keep uncategorized statuses as Other.
create function public.get_admin_listing_status()
returns table(
  total bigint, available bigint, occupied bigint, hidden bigint,
  pending_verification bigint, other bigint
)
language plpgsql stable security definer set search_path = '' as $$
begin
  if (select auth.uid()) is null or not exists (
    select 1 from public.users u
    where u.user_id = (select auth.uid()) and 'admin' = any(u.roles)
  ) then
    raise exception 'Admin access required.';
  end if;

  return query
    with classified as (
      select case
        when a.is_hidden_by_admin then 'hidden'
        when exists (
          select 1 from public.apartment_verifications v
          where v.apartment_id = a.id and v.status = 'pending'
        ) then 'pending_verification'
        when a.status = 'occupied' then 'occupied'
        when a.status = 'available' then 'available'
        else 'other'
      end as category
      from public.apartments a
      where a.deleted_at is null
    )
    select count(*)::bigint,
      count(*) filter (where category = 'available')::bigint,
      count(*) filter (where category = 'occupied')::bigint,
      count(*) filter (where category = 'hidden')::bigint,
      count(*) filter (where category = 'pending_verification')::bigint,
      count(*) filter (where category = 'other')::bigint
    from classified;
end;
$$;

revoke all on function public.get_admin_listing_status() from public, anon;
grant execute on function public.get_admin_listing_status() to authenticated;
