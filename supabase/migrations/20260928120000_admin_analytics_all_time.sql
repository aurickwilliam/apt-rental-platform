-- The All Time preset begins at the earliest currently reportable activity.
-- On an empty platform it begins today. Keep this admin-only like the other
-- analytics functions; clients never query unrestricted underlying tables.
create or replace function public.get_admin_analytics_start_date()
returns date language plpgsql stable security definer set search_path = '' as $$
declare
  first_day date;
begin
  if (select auth.uid()) is null or not exists (
    select 1 from public.users u
    where u.user_id = (select auth.uid()) and 'admin' = any(u.roles)
  ) then
    raise exception 'Admin access required.';
  end if;

  select coalesce(min(history.first_day), current_date) into first_day
  from (
    select min((created_at at time zone 'UTC')::date) as first_day from public.users
    union all
    select min((created_at at time zone 'UTC')::date) from public.apartments where deleted_at is null
    union all
    select min((reviewed_at at time zone 'UTC')::date) from public.user_verifications
    union all
    select min((reviewed_at at time zone 'UTC')::date) from public.apartment_verifications
    union all
    select min((created_at at time zone 'UTC')::date) from public.rental_application
    union all
    select min((created_at at time zone 'UTC')::date) from public.tenancies
    union all
    select min((created_at at time zone 'UTC')::date) from public.payment where status = 'paid'
    union all
    select min(date) from public.payment where status = 'paid'
    union all
    select min((created_at at time zone 'UTC')::date) from public.maintenance_request
  ) history;
  return first_day;
end;
$$;

revoke all on function public.get_admin_analytics_start_date() from public, anon;
grant execute on function public.get_admin_analytics_start_date() to authenticated;


-- Allow the same history span for the summary and each trend RPC.
create or replace function public.get_admin_analytics(date_from date, date_to date)
returns jsonb language plpgsql stable security definer set search_path = '' as $$
begin
  if auth.uid() is null or not exists (
    select 1 from public.users where user_id = auth.uid()
      and 'admin' = any (roles)
  ) then raise exception 'Admin access required.'; end if;
  if date_from is null or date_to is null or date_to < date_from
    or date_to - date_from > 36525 or date_to > current_date then
    raise exception 'Select a valid date range of at most 100 years.';
  end if;
  return jsonb_build_object(
    'users', (select jsonb_build_object(
      'total', count(*), 'new', count(*) filter (where created_at >= date_from and created_at < date_to + 1),
      'newTenants', count(*) filter (where 'tenant' = any (roles) and created_at >= date_from and created_at < date_to + 1),
      'newLandlords', count(*) filter (where 'landlord' = any (roles) and created_at >= date_from and created_at < date_to + 1),
      'tenants', count(*) filter (where 'tenant' = any (roles)),
      'landlords', count(*) filter (where 'landlord' = any (roles)),
      'verified', count(*) filter (where account_status = 'verified'),
      'suspended', count(*) filter (where account_status = 'suspended')
    ) from public.users),
    'apartments', (select jsonb_build_object(
      'total', count(*), 'new', count(*) filter (where created_at >= date_from and created_at < date_to + 1),
      'hidden', count(*) filter (where is_hidden_by_admin),
      'verified', count(*) filter (where is_verified),
      'available', count(*) filter (where status = 'available')
    ) from public.apartments where deleted_at is null),
    'userVerifications', (select jsonb_build_object(
      'pending', count(*) filter (where status = 'pending'),
      'approved', count(*) filter (where status = 'approved' and reviewed_at >= date_from and reviewed_at < date_to + 1),
      'rejected', count(*) filter (where status = 'rejected' and reviewed_at >= date_from and reviewed_at < date_to + 1)
    ) from public.user_verifications),
    'apartmentVerifications', (select jsonb_build_object(
      'pending', count(*) filter (where status = 'pending'),
      'approved', count(*) filter (where status = 'approved' and reviewed_at >= date_from and reviewed_at < date_to + 1),
      'rejected', count(*) filter (where status = 'rejected' and reviewed_at >= date_from and reviewed_at < date_to + 1)
    ) from public.apartment_verifications),
    'applications', (select jsonb_build_object(
      'new', count(*), 'approved', count(*) filter (where status = 'approved')
    ) from public.rental_application where created_at >= date_from and created_at < date_to + 1),
    'tenancies', (select jsonb_build_object(
      'new', count(*) filter (where created_at >= date_from and created_at < date_to + 1),
      'active', count(*) filter (where status = 'active'),
      'occupiedUnits', count(distinct apartment_id) filter (where status = 'active')
    ) from public.tenancies),
    'payments', (select jsonb_build_object(
      'paidCount', count(*), 'paidTotal', coalesce(sum(amount), 0)
    ) from public.payment where status = 'paid' and created_at >= date_from and created_at < date_to + 1),
    'maintenance', (select jsonb_build_object(
      'total', count(*), 'pending', count(*) filter (where status = 'pending'),
      'inProgress', count(*) filter (where status = 'in_progress'),
      'resolved', count(*) filter (where status = 'resolved'),
      'cancelled', count(*) filter (where status = 'cancelled')
    ) from public.maintenance_request where created_at >= date_from and created_at < date_to + 1)
  );
end;
$$;
revoke all on function public.get_admin_analytics(date, date) from public, anon;
grant execute on function public.get_admin_analytics(date, date) to authenticated;

-- Allow the same history span for the summary and each trend RPC.
create or replace function public.get_admin_analytics_trends(p_from date, p_to date)
returns table(
  bucket_start date, bucket_end date, users bigint, apartments bigint,
  tenants bigint, landlords bigint
)
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
    or p_to - p_from > 36525 or p_to > current_date then
    raise exception 'Select valid dates within the past 100 years.';
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
      select b.first_date, count(u.id)::bigint as total,
        count(u.id) filter (where 'tenant' = any(u.roles))::bigint as tenant_total,
        count(u.id) filter (where 'landlord' = any(u.roles))::bigint as landlord_total
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
    select b.first_date, b.next_date - 1,
      u.total, a.total, u.tenant_total, u.landlord_total
    from buckets b
    join user_counts u using (first_date)
    join apartment_counts a using (first_date)
    order by b.first_date;
end;
$$;
revoke all on function public.get_admin_analytics_trends(date, date) from public, anon;
grant execute on function public.get_admin_analytics_trends(date, date) to authenticated;

-- Allow the same history span for the summary and each trend RPC.
create or replace function public.get_admin_rental_payment_trends(p_from date, p_to date)
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
    or p_to - p_from > 36525 or p_to > current_date then
    raise exception 'Select valid dates within the past 100 years.';
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
