-- Current, non-deleted apartment inventory in the four CAMANAVA cities.
-- Keep non-matching stored city values separate rather than misattributing them.
create function public.get_admin_listings_by_city()
returns table(city text, listing_count bigint)
language plpgsql stable security definer set search_path = '' as $$
begin
  if (select auth.uid()) is null or not exists (
    select 1 from public.users u
    where u.user_id = (select auth.uid()) and 'admin' = any(u.roles)
  ) then
    raise exception 'Admin access required.';
  end if;

  return query
    with cities as (
      select c.name, c.display_order
      from (values
        ('Caloocan', 1), ('Malabon', 2), ('Navotas', 3),
        ('Valenzuela', 4), ('Other', 5)
      ) as c(name, display_order)
    ),
    counts as (
      select coalesce(c.name, 'Other') as name, count(*)::bigint as total
      from public.apartments a
      left join cities c on lower(btrim(a.city)) = lower(c.name)
        and c.name <> 'Other'
      where a.deleted_at is null
      group by coalesce(c.name, 'Other')
    )
    select c.name, coalesce(cnt.total, 0)::bigint
    from cities c
    left join counts cnt on cnt.name = c.name
    order by c.display_order;
end;
$$;

revoke all on function public.get_admin_listings_by_city() from public, anon;
grant execute on function public.get_admin_listings_by_city() to authenticated;
