-- Admin apartment oversight requires read-only access to related rental records.
-- These additive policies do not alter existing tenant/landlord permissions.
create policy "Admins read apartment tenancies" on public.tenancies
  for select to authenticated
  using ((select private.is_admin()));
create policy "Admins read apartment applications" on public.rental_application
  for select to authenticated
  using ((select private.is_admin()));
create policy "Admins read apartment visits" on public.visit_request
  for select to authenticated
  using ((select private.is_admin()));
create policy "Admins read apartment maintenance" on public.maintenance_request
  for select to authenticated
  using ((select private.is_admin()));
create policy "Admins read apartment payments" on public.payment
  for select to authenticated
  using ((select private.is_admin()));

-- The visibility columns were deployed separately from the phase-2 operations
-- batch. Keep them server-managed even for apartment owners.
alter table public.admin_audit_logs drop constraint admin_audit_logs_action_check;
alter table public.admin_audit_logs add constraint admin_audit_logs_action_check check (action in (
  'USER_VERIFICATION_APPROVED', 'USER_VERIFICATION_REJECTED',
  'PROPERTY_VERIFICATION_APPROVED', 'PROPERTY_VERIFICATION_REJECTED',
  'USER_SUSPENDED', 'USER_REACTIVATED', 'APARTMENT_HIDDEN', 'APARTMENT_RESTORED'
));
alter table public.admin_audit_logs drop constraint admin_audit_logs_target_type_check;
alter table public.admin_audit_logs add constraint admin_audit_logs_target_type_check check (
  target_type in ('user_verification', 'apartment_verification', 'user', 'apartment')
);
revoke update on public.apartments from public, anon, authenticated;
grant update (
  name, description, monthly_rent, type, street_address, barangay, city, province,
  status, no_bedrooms, no_bathrooms, area_sqm, zip_code, furnished_type,
  latitude, longitude, max_occupants, deleted_at, amenities, floor_level,
  lease_duration, security_deposit, advance_rent, lease_agreement_url,
  rent_due_day, updated_at
) on public.apartments to authenticated;

create or replace function public.admin_set_apartment_visibility(
  p_apartment_id uuid, p_hide boolean, p_reason text
) returns void language plpgsql security definer set search_path = '' as $$
declare v_admin_id uuid; v_apartment public.apartments%rowtype;
begin
  if p_reason is null or length(btrim(p_reason)) < 3 or length(p_reason) > 500 then
    raise exception 'A reason between 3 and 500 characters is required.';
  end if;
  select id into v_admin_id from public.users
  where user_id = (select auth.uid()) and 'admin' = any(roles);
  if v_admin_id is null then raise exception 'Admin access required.'; end if;

  select * into v_apartment from public.apartments where id = p_apartment_id for update;
  if not found or v_apartment.deleted_at is not null
    or v_apartment.is_hidden_by_admin = p_hide then
    raise exception 'Invalid listing visibility transition.';
  end if;
  update public.apartments set is_hidden_by_admin = p_hide,
    hidden_at = case when p_hide then now() else null end,
    hidden_by = case when p_hide then v_admin_id else null end,
    hidden_reason = case when p_hide then btrim(p_reason) else null end,
    updated_at = now()
  where id = p_apartment_id;
  insert into public.admin_audit_logs(admin_id, action, target_type, target_id, reason)
  values(v_admin_id, case when p_hide then 'APARTMENT_HIDDEN' else 'APARTMENT_RESTORED' end,
    'apartment', p_apartment_id, btrim(p_reason));
end;
$$;
revoke all on function public.admin_set_apartment_visibility(uuid, boolean, text)
  from public, anon, authenticated;
grant execute on function public.admin_set_apartment_visibility(uuid, boolean, text)
  to authenticated;
