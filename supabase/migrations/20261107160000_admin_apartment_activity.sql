-- The admin apartment page reads tenancies, applications, visits, maintenance and
-- payments, but no read rule ever let admins see them on the hosted project, so
-- those sections came back empty instead of failing.
--
-- This returns only what that page shows, for one apartment at a time, instead of
-- table-wide admin read policies, which would also expose applicants' income and
-- document paths. It is read-only, requires the admin second step through
-- app_private.require_admin(), and adds no client access to the tables themselves.

create function public.get_admin_apartment_activity(p_apartment_id uuid)
returns jsonb language plpgsql stable security definer set search_path = '' as $$
declare
  v_tenancy public.tenancies%rowtype;
  v_tenant_name text;
  v_payment jsonb;
begin
  perform app_private.require_admin();

  select * into v_tenancy from public.tenancies t
  where t.apartment_id = p_apartment_id and t.status = 'active'
  order by t.created_at desc limit 1;

  if v_tenancy.id is not null then
    select nullif(btrim(coalesce(u.first_name, '') || ' ' || coalesce(u.last_name, '')), '')
    into v_tenant_name from public.users u where u.id = v_tenancy.tenant_id;

    select jsonb_build_object('status', p.status, 'date', p.date, 'due_date', p.due_date)
    into v_payment from public.payment p
    where p.tenancy_id = v_tenancy.id
    order by p.date desc limit 1;
  end if;

  return jsonb_build_object(
    'tenancy', case when v_tenancy.id is null then null else jsonb_build_object(
      'id', v_tenancy.id,
      'status', v_tenancy.status,
      'lease_start', v_tenancy.lease_start,
      'lease_end', v_tenancy.lease_end,
      'monthly_rent', v_tenancy.monthly_rent,
      'tenant_name', v_tenant_name
    ) end,
    'payment', v_payment,
    'applications', jsonb_build_object(
      'items', coalesce((select jsonb_agg(jsonb_build_object('id', a.id, 'status', a.status, 'created_at', a.created_at) order by a.created_at desc)
        from (select id, status, created_at from public.rental_application
          where apartment_id = p_apartment_id order by created_at desc limit 3) a), '[]'::jsonb),
      'counts', (select jsonb_build_object(
          'total', count(*),
          'pending', count(*) filter (where status = 'pending'),
          'approved', count(*) filter (where status = 'approved'),
          'rejected', count(*) filter (where status = 'rejected'))
        from public.rental_application where apartment_id = p_apartment_id)
    ),
    'visits', jsonb_build_object(
      'items', coalesce((select jsonb_agg(jsonb_build_object('id', v.id, 'status', v.status, 'visit_date', v.visit_date, 'confirmed_visit_date', v.confirmed_visit_date) order by v.created_at desc)
        from (select id, status, visit_date, confirmed_visit_date, created_at from public.visit_request
          where apartment_id = p_apartment_id order by created_at desc limit 3) v), '[]'::jsonb),
      'counts', (select jsonb_build_object(
          'total', count(*),
          'pending', count(*) filter (where status = 'pending'),
          'approved', count(*) filter (where status = 'approved'),
          'rescheduled', count(*) filter (where status = 'rescheduled'),
          'cancelled', count(*) filter (where status = 'cancelled'),
          'rejected', count(*) filter (where status = 'rejected'))
        from public.visit_request where apartment_id = p_apartment_id)
    ),
    'maintenance', jsonb_build_object(
      'items', coalesce((select jsonb_agg(jsonb_build_object('id', m.id, 'title', m.title, 'urgency', m.urgency, 'status', m.status, 'created_at', m.created_at) order by m.created_at desc)
        from (select id, title, urgency, status, created_at from public.maintenance_request
          where apartment_id = p_apartment_id order by created_at desc limit 5) m), '[]'::jsonb),
      'counts', (select jsonb_build_object(
          'pending', count(*) filter (where status = 'pending'),
          'in_progress', count(*) filter (where status = 'in_progress'),
          'resolved', count(*) filter (where status = 'resolved'),
          'high', count(*) filter (where urgency = 'high' and status in ('pending', 'in_progress')))
        from public.maintenance_request where apartment_id = p_apartment_id)
    )
  );
end;
$$;
revoke all on function public.get_admin_apartment_activity(uuid) from public, anon;
grant execute on function public.get_admin_apartment_activity(uuid) to authenticated;
