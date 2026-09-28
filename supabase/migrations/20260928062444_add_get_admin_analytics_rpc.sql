-- Admin analytics aggregate (mirrors get_admin_analytics from the Phase 2
-- admin operations batch, adapted to the roles[] + account_status user
-- model for environments that never received
-- 20260926143751_phase2_admin_operations).
create or replace function public.get_admin_analytics(date_from date, date_to date)
returns jsonb language plpgsql stable security definer set search_path = '' as $$
begin
  if auth.uid() is null or not exists (
    select 1 from public.users where user_id = auth.uid()
      and 'admin' = any (roles)
  ) then raise exception 'Admin access required.'; end if;
  if date_from is null or date_to is null or date_to < date_from
    or date_to - date_from > 365 then
    raise exception 'Select a date range of at most 366 days.';
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
