-- Landlord dashboard RPC: add attention.pendingMaintenance, the number of
-- maintenance requests still waiting for the landlord's first response
-- (status 'pending'), for the "Waiting for your reply" card.
--
-- Additive: every existing key keeps its shape, so older app builds keep working.
-- stats.maintenanceRequests is unchanged and still counts 'pending' plus
-- 'in_progress' (the Open Maintenance tile).
--
-- Security invoker: RLS stays the final authority.

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
  ph_today as (
    select (current_timestamp at time zone 'Asia/Manila')::date as d
  ),
  window_start as (
    select (date_trunc('month', current_date) - interval '11 months')::date as d
  ),
  paid_agg as (
    select p.apartment_id,
           to_char(p.date, 'YYYY-MM') as month,
           sum(p.rental_income_amount) as amount
    from public.payment p
    where p.apartment_id in (select id from my_apartments)
      and p.status = 'paid'
      and p.date >= (select d from window_start)
    group by p.apartment_id, to_char(p.date, 'YYYY-MM')
  ),
  month_series as (
    select generate_series((select d from window_start), current_date, interval '1 month') as d
  ),
  dues as (
    select p.id,
           p.apartment_id,
           a.name as apartment_name,
           trim(both from coalesce(u.first_name, '') || ' ' || coalesce(u.last_name, '')) as tenant_name,
           p.due_date,
           p.amount,
           p.due_date < (select d from ph_today) as is_overdue
    from public.payment p
    join my_apartments a on a.id = p.apartment_id
    join public.users u on u.id = p.tenant_id
    where p.status not in ('paid', 'rejected')
      and not (p.method = 'cash' and p.status = 'pending')
      and p.due_date is not null
  ),
  collection_series as (
    select generate_series(
      (date_trunc('month', (select d from ph_today)) - interval '5 months')::date,
      date_trunc('month', (select d from ph_today))::date,
      interval '1 month'
    )::date as d
  ),
  collection_agg as (
    select to_char(coalesce(p.due_date, p.date), 'YYYY-MM') as month,
           sum(p.rental_income_amount) filter (where p.status = 'paid') as collected,
           sum(p.rental_income_amount) filter (
             where p.status in ('pending', 'unpaid', 'partial')
           ) as unpaid
    from public.payment p
    where p.apartment_id in (select id from my_apartments)
      and coalesce(p.due_date, p.date) >= (select min(d) from collection_series)
    group by 1
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
    'attention', jsonb_build_object(
      'overdueCount', (select count(*) from dues where is_overdue),
      'overdueAmount', (select coalesce(sum(amount), 0) from dues where is_overdue),
      'pendingCashCount', (
        select count(*) from public.payment p
        where p.method = 'cash'
          and p.status = 'pending'
          and p.apartment_id in (select id from my_apartments)
      ),
      'pendingCashAmount', (
        select coalesce(sum(p.amount), 0) from public.payment p
        where p.method = 'cash'
          and p.status = 'pending'
          and p.apartment_id in (select id from my_apartments)
      ),
      -- Oldest awaiting submission's property: cash is confirmed per property.
      'pendingCashApartmentId', (
        select p.apartment_id from public.payment p
        where p.method = 'cash'
          and p.status = 'pending'
          and p.apartment_id in (select id from my_apartments)
        order by p.created_at
        limit 1
      ),
      'pendingApplications', (
        select count(*) from public.rental_application r
        where r.status = 'pending'
          and r.apartment_id in (select id from my_apartments)
      ),
      'pendingMaintenance', (
        select count(*) from public.maintenance_request m
        where m.status = 'pending'
          and m.apartment_id in (select id from my_apartments)
      ),
      'pendingVisitRequests', (
        select count(*) from public.visit_request v
        where v.status = 'pending'
          and v.landlord_id = p_landlord_id
          and v.apartment_id in (select id from my_apartments)
      )
    ),
    'thisMonth', jsonb_build_object(
      'collected', (
        select coalesce(sum(p.rental_income_amount), 0) from public.payment p
        where p.status = 'paid'
          and p.apartment_id in (select id from my_apartments)
          and to_char(p.date, 'YYYY-MM') = to_char(current_date, 'YYYY-MM')
      ),
      'outstanding', (
        select coalesce(sum(p.rental_income_amount), 0) from public.payment p
        where p.status in ('pending', 'unpaid', 'partial')
          and p.apartment_id in (select id from my_apartments)
          and to_char(p.due_date, 'YYYY-MM') = to_char((select d from ph_today), 'YYYY-MM')
      )
    ),
    'collectionByMonth', (
      select coalesce(jsonb_agg(jsonb_build_object(
        'month', to_char(s.d, 'YYYY-MM'),
        'collected', coalesce(ca.collected, 0),
        'unpaid', coalesce(ca.unpaid, 0)
      ) order by s.d), '[]'::jsonb)
      from collection_series s
      left join collection_agg ca on ca.month = to_char(s.d, 'YYYY-MM')
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
    ),
    'rentDues', (
      select coalesce(jsonb_agg(jsonb_build_object(
        'id', d.id,
        'apartmentId', d.apartment_id,
        'apartmentName', d.apartment_name,
        'tenantName', d.tenant_name,
        'dueDate', d.due_date,
        'amount', d.amount,
        'isOverdue', d.is_overdue
      ) order by d.due_date), '[]'::jsonb)
      from dues d
    )
  );
$$;

revoke execute on function public.get_landlord_dashboard(uuid) from anon;
