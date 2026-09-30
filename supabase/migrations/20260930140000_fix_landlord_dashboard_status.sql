-- Landlord dashboard RPC: align metric semantics with the canonical payment
-- vocabulary and the platform's occupancy convention.
--
-- 1. pendingPayments counted status = 'not paid', a legacy value the
--    payment_status_check constraint ('pending' | 'paid' | 'partial' |
--    'unpaid') rejects — so the count was always 0 with real data. Count
--    unsettled rows instead, matching the web dashboard derivation
--    (apps/web/app/landlord/dashboard/lib/get-dashboard-data.ts).
-- 2. unitsOccupied counted active tenancy ROWS, which can exceed the property
--    count when an apartment holds multiple active tenancies. Count distinct
--    occupied apartments instead, matching the admin analytics convention
--    (occupiedUnits = count(distinct apartment_id) over active tenancies).
--
-- Requires a production deployment to take effect; until then mobile
-- pendingPayments reads 0 and unitsOccupied may over-count multi-tenancies.

create or replace function public.get_landlord_dashboard(p_landlord_id uuid)
returns jsonb
language sql
stable
set search_path = public
as $$
  with my_apartments as (
    select a.id, a.name
    from public.apartments a
    where a.landlord_id = p_landlord_id
      and a.deleted_at is null
  ),
  window_start as (
    select (date_trunc('month', current_date) - interval '11 months')::date as d
  ),
  paid_agg as (
    select p.apartment_id,
           to_char(p.date, 'YYYY-MM') as month,
           sum(p.amount) as amount
    from public.payment p
    where p.apartment_id in (select id from my_apartments)
      and p.status = 'paid'
      and p.date >= (select d from window_start)
    group by p.apartment_id, to_char(p.date, 'YYYY-MM')
  ),
  month_series as (
    select generate_series((select d from window_start), current_date, interval '1 month') as d
  )
  select jsonb_build_object(
    'stats', (
      select jsonb_build_object(
        'totalProperties', count(a.id),
        'unitsOccupied', (
          select count(distinct t.apartment_id) from public.tenancies t
          where t.landlord_id = p_landlord_id
            and t.status = 'active'
        ),
        'pendingPayments', (
          select count(*) from public.payment p
          where p.status in ('pending', 'unpaid', 'partial')
            and p.apartment_id in (select id from my_apartments)
        ),
        'maintenanceRequests', (
          select count(*) from public.maintenance_request m
          where m.status in ('pending', 'in_progress')
            and m.apartment_id in (select id from my_apartments)
        )
      )
      from my_apartments a
    ),
    'monthlyRevenue', (
      select coalesce(jsonb_agg(jsonb_build_object(
        'month', to_char(s.d, 'YYYY-MM'),
        'amount', coalesce(pa.amount, 0)
      ) order by s.d), '[]'::jsonb)
      from month_series s
      left join paid_agg pa on pa.month = to_char(s.d, 'YYYY-MM')
    ),
    'revenueByProperty', (
      select coalesce(jsonb_agg(
        jsonb_build_object(
          'apartmentId', a.id,
          'apartmentName', a.name,
          'months', (
            select coalesce(jsonb_agg(jsonb_build_object(
              'month', pa.month,
              'amount', pa.amount
            ) order by pa.month), '[]'::jsonb)
            from paid_agg pa
            where pa.apartment_id = a.id
          )
        )
        order by a.name
      ), '[]'::jsonb)
      from my_apartments a
      where exists (select 1 from paid_agg pa where pa.apartment_id = a.id)
    ),
    'rentDues', (
      select coalesce(jsonb_agg(jsonb_build_object(
        'id', p.id,
        'apartmentId', p.apartment_id,
        'apartmentName', a.name,
        'tenantName', trim(both from coalesce(u.first_name, '') || ' ' || coalesce(u.last_name, '')),
        'dueDate', p.due_date,
        'amount', p.amount,
        'isOverdue', p.due_date < (current_timestamp at time zone 'Asia/Manila')::date
      ) order by p.due_date), '[]'::jsonb)
      from public.payment p
      join public.apartments a on a.id = p.apartment_id
        and a.landlord_id = p_landlord_id
        and a.deleted_at is null
      join public.users u on u.id = p.tenant_id
      where p.status <> 'paid'
        and p.due_date is not null
    )
  );
$$;
