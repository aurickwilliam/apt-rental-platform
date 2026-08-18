-- Landlord dashboard: single RPC returning every dashboard section (stats,
-- revenue charts, rent dues) in one round trip, plus the indexes its queries
-- rely on. Security invoker: RLS stays the final authority — passing another
-- landlord's id yields empty/zero data, never another user's rows.

-- ─── Indexes ──────────────────────────────────────────────────────────────────
-- payment is the hot table: every dashboard query filters
-- apartment_id + status (+ date range). Without these, each dashboard load
-- scans the full payment history of the platform.
create index if not exists payment_apartment_status_date_idx
  on public.payment (apartment_id, status, date);

-- apartments(landlord_id) partial index matching the active-filter exactly.
create index if not exists apartments_landlord_active_idx
  on public.apartments (landlord_id)
  where deleted_at is null;

-- tenancies_landlord_id_idx is fully covered by the composite prefix below.
create index if not exists tenancies_landlord_status_idx
  on public.tenancies (landlord_id, status);

drop index if exists public.tenancies_landlord_id_idx;

-- ─── Function ─────────────────────────────────────────────────────────────────
-- Returns: stats, monthlyRevenue (12 pts, month "YYYY-MM"),
-- revenueByProperty ({apartmentId, apartmentName, months[{month, amount}]},
-- only apartments with at least one paid month), rentDues (isOverdue computed
-- against the PH timezone's date).
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
          select count(*) from public.tenancies t
          where t.landlord_id = p_landlord_id
            and t.status = 'active'
        ),
        'pendingPayments', (
          select count(*) from public.payment p
          where p.status = 'not paid'
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

revoke execute on function public.get_landlord_dashboard(uuid) from anon;
