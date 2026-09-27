-- One bounded, admin-only RPC replaces the dashboard's per-chart count fan-out.
create or replace function public.get_admin_dashboard_trends(
  p_from date,
  p_to date
)
returns table (
  label text,
  users bigint,
  apartments bigint,
  reviews bigint
)
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_bucket_count integer;
  v_day_count integer;
begin
  if auth.uid() is null or not exists (
    select 1
    from public.users u
    where u.user_id = auth.uid()
      and u.role = 'admin'
      and coalesce(to_jsonb(u) ->> 'is_suspended', 'false') <> 'true'
  ) then
    raise exception 'Admin access required.';
  end if;

  if p_from is null
    or p_to is null
    or p_to < p_from
    or p_to - p_from > 89 then
    raise exception 'Select a date range within the last 90 days.';
  end if;

  v_day_count := p_to - p_from + 1;
  v_bucket_count := least(6, v_day_count);

  return query
  with buckets as (
    select
      bucket_index,
      p_from + floor((bucket_index * v_day_count)::numeric / v_bucket_count)::integer as first_date,
      p_from + floor(((bucket_index + 1) * v_day_count)::numeric / v_bucket_count)::integer as next_date
    from generate_series(0, v_bucket_count - 1) as bucket_index
  ),
  user_counts as (
    select b.bucket_index, count(u.id)::bigint as total
    from buckets b
    left join public.users u
      on u.created_at >= b.first_date
      and u.created_at < b.next_date
    group by b.bucket_index
  ),
  apartment_counts as (
    select b.bucket_index, count(a.id)::bigint as total
    from buckets b
    left join public.apartments a
      on a.created_at >= b.first_date
      and a.created_at < b.next_date
    group by b.bucket_index
  ),
  user_review_counts as (
    select b.bucket_index, count(v.id)::bigint as total
    from buckets b
    left join public.user_verifications v
      on v.reviewed_at >= b.first_date
      and v.reviewed_at < b.next_date
      and v.status in ('approved', 'rejected')
    group by b.bucket_index
  ),
  apartment_review_counts as (
    select b.bucket_index, count(v.id)::bigint as total
    from buckets b
    left join public.apartment_verifications v
      on v.reviewed_at >= b.first_date
      and v.reviewed_at < b.next_date
      and v.status in ('approved', 'rejected')
    group by b.bucket_index
  )
  select
    to_char(b.first_date, 'Mon FMDD') as label,
    u.total as users,
    a.total as apartments,
    ur.total + ar.total as reviews
  from buckets b
  join user_counts u using (bucket_index)
  join apartment_counts a using (bucket_index)
  join user_review_counts ur using (bucket_index)
  join apartment_review_counts ar using (bucket_index)
  order by b.bucket_index;
end;
$$;

revoke all on function public.get_admin_dashboard_trends(date, date) from public, anon;
grant execute on function public.get_admin_dashboard_trends(date, date) to authenticated;
