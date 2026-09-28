-- Rental payments are grouped by their recorded payment date, not the time
-- their status changed (payment has no dedicated paid_at timestamp).
create function public.get_admin_rental_payment_trends(p_from date, p_to date)
returns table(
  bucket_start date, bucket_end date, payment_total numeric, payment_count bigint
)
language plpgsql stable security definer set search_path = '' as $$
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
    payment_counts as (
      select b.first_date,
        coalesce(sum(p.amount), 0) as total,
        count(p.id)::bigint as total_count
      from buckets b
      left join public.payment p
        on p.date >= b.first_date and p.date < b.next_date
        and p.status = 'paid'
      group by b.first_date
    )
    select b.first_date, b.next_date - 1, pc.total, pc.total_count
    from buckets b
    join payment_counts pc using (first_date)
    order by b.first_date;
end;
$$;

revoke all on function public.get_admin_rental_payment_trends(date, date) from public, anon;
grant execute on function public.get_admin_rental_payment_trends(date, date) to authenticated;
