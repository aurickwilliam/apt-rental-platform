-- Keep the analytics RPC contract; only change the bucket size for the
-- selected reporting range (daily <= 30, calendar weeks <= 90, months > 90).
create or replace function public.get_admin_analytics_trends(p_from date, p_to date)
returns table(bucket_start date, bucket_end date, users bigint, apartments bigint)
language plpgsql stable security invoker set search_path = '' as $$
declare
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
  return query
    with bucket_days as (
      select case
        when day_count <= 30 then p_from + n
        when day_count <= 90 then greatest(
          p_from, date_trunc('week', (p_from + n)::timestamp)::date
        )
        else greatest(
          p_from, date_trunc('month', (p_from + n)::timestamp)::date
        )
      end as first_date
      from generate_series(0, day_count - 1) as n
    ),
    buckets as (
      select d.first_date, least(p_to + 1, case
        when day_count <= 30 then d.first_date + 1
        when day_count <= 90 then date_trunc('week', d.first_date::timestamp)::date + 7
        else (date_trunc('month', d.first_date::timestamp) + interval '1 month')::date
      end) as next_date
      from bucket_days d
      group by d.first_date
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
