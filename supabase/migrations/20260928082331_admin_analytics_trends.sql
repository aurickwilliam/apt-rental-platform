-- Bounded, calendar-aligned growth series for the admin analytics period.
-- Security invoker follows get_admin_dashboard_trends: admin RLS still applies.
create function public.get_admin_analytics_trends(p_from date, p_to date)
returns table(bucket_start date, bucket_end date, users bigint, apartments bigint)
language plpgsql stable security invoker set search_path = '' as $$
declare
  bucket_count integer;
  day_count integer;
begin
  if (select auth.uid()) is null or not exists (
    select 1 from public.users u
    where u.user_id = (select auth.uid()) and 'admin' = any(u.roles)
  ) then
    raise exception 'Admin access required.';
  end if;
  if p_from is null or p_to is null or p_to < p_from
    or p_to - p_from > 365 or p_to > current_date then
    raise exception 'Select valid dates within the past year (up to 366 days).';
  end if;

  day_count := p_to - p_from + 1;
  bucket_count := least(12, day_count);
  return query
    with buckets as (
      select
        p_from + floor((n * day_count)::numeric / bucket_count)::integer as first_date,
        p_from + floor(((n + 1) * day_count)::numeric / bucket_count)::integer as next_date
      from generate_series(0, bucket_count - 1) as n
    ),
    user_counts as (
      select b.first_date, count(u.id)::bigint as total
      from buckets b
      left join public.users u
        on u.created_at >= b.first_date and u.created_at < b.next_date
      group by b.first_date
    ),
    apartment_counts as (
      select b.first_date, count(a.id)::bigint as total
      from buckets b
      left join public.apartments a
        on a.created_at >= b.first_date and a.created_at < b.next_date
        and a.deleted_at is null
      group by b.first_date
    )
    select b.first_date, b.next_date - 1, u.total, a.total
    from buckets b
    join user_counts u using (first_date)
    join apartment_counts a using (first_date)
    order by b.first_date;
end;
$$;
revoke all on function public.get_admin_analytics_trends(date, date) from public, anon;
grant execute on function public.get_admin_analytics_trends(date, date) to authenticated;
