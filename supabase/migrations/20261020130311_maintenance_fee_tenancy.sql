-- A maintenance fee belongs to the tenancy that raised it, not merely to a
-- tenant + apartment pair. Without this, re-letting the same unit to the same
-- tenant folds an older, unpaid fee into the new tenant's move-in bill.
alter table public.maintenance_request
  add column tenancy_id uuid references public.tenancies(id) on delete set null;

alter table public.maintenance_request
  drop constraint if exists maintenance_fee_status_check;
alter table public.maintenance_request
  add constraint maintenance_fee_status_check
  check (fee_status is null or fee_status in ('pending', 'paid', 'waived'));

create index maintenance_request_tenancy_fee_idx
  on public.maintenance_request (tenancy_id)
  where fee_status = 'pending';

-- Backfill the tenancy that covered the fee's creation date. A fee raised
-- before every lease (for example while testing a move-in) belongs to the
-- earliest tenancy for that tenant + apartment, never to the newest re-let.
update public.maintenance_request mr
set tenancy_id = coalesce(
  (select t.id from public.tenancies t
    where t.apartment_id = mr.apartment_id and t.tenant_id = mr.tenant_id
      and t.lease_start <= (mr.created_at at time zone 'Asia/Manila')::date
      and (t.lease_end is null or t.lease_end >= (mr.created_at at time zone 'Asia/Manila')::date)
    order by t.lease_start desc, t.created_at desc
    limit 1),
  (select t.id from public.tenancies t
    where t.apartment_id = mr.apartment_id and t.tenant_id = mr.tenant_id
      and t.lease_start <= (mr.created_at at time zone 'Asia/Manila')::date
    order by t.lease_start desc, t.created_at desc
    limit 1),
  (select t.id from public.tenancies t
    where t.apartment_id = mr.apartment_id and t.tenant_id = mr.tenant_id
    order by t.lease_start asc, t.created_at asc
    limit 1))
where mr.tenancy_id is null;

-- Bind new fees to the active tenancy, keep the binding immutable, and make
-- settlement terminal. A paid or waived fee can never return to the bill.
create or replace function app_private.guard_maintenance_fee()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if tg_op = 'INSERT' then
    if new.tenancy_id is null then
      select coalesce(
        (select t.id from public.tenancies t
          where t.apartment_id = new.apartment_id and t.tenant_id = new.tenant_id
            and t.lease_start <= (new.created_at at time zone 'Asia/Manila')::date
            and (t.lease_end is null or t.lease_end >= (new.created_at at time zone 'Asia/Manila')::date)
          order by t.lease_start desc, t.created_at desc
          limit 1),
        (select t.id from public.tenancies t
          where t.apartment_id = new.apartment_id and t.tenant_id = new.tenant_id
            and t.lease_start <= (new.created_at at time zone 'Asia/Manila')::date
          order by t.lease_start desc, t.created_at desc
          limit 1),
        (select t.id from public.tenancies t
          where t.apartment_id = new.apartment_id and t.tenant_id = new.tenant_id
            and t.status = 'active'
          order by t.lease_start desc, t.created_at desc
          limit 1))
      into new.tenancy_id;
    end if;
    return new;
  end if;

  if new.tenancy_id is distinct from old.tenancy_id then
    raise exception 'A maintenance fee cannot move to another rental.';
  end if;

  if new.fee_status is distinct from old.fee_status then
    if old.fee_status is null then
      if new.fee_status is distinct from 'pending' then
        raise exception 'A new maintenance fee must start as pending.';
      end if;
    elsif old.fee_status = 'pending' then
      if new.fee_status not in ('paid', 'waived') then
        raise exception 'A pending maintenance fee can only be paid or waived.';
      end if;
    else
      raise exception 'A settled maintenance fee cannot change status.';
    end if;
  end if;
  return new;
end;
$$;
create trigger aa_guard_maintenance_fee before insert or update on public.maintenance_request
  for each row execute function app_private.guard_maintenance_fee();

-- Bill only the fees raised by this tenancy. The previous apartment + tenant
-- filter let an older tenancy's fee survive a re-let to the same tenant.
create or replace function app_private.tenancy_bill(p_tenancy_id uuid, p_today date)
returns jsonb language plpgsql volatile security definer set search_path = '' as $$
declare
  t public.tenancies%rowtype;
  first_month date;
  second_month date;
  anchor date;
  due_on date;
  rent numeric;
  deposit numeric := 0;
  advance numeric := 0;
  fees numeric;
  fee_rows jsonb;
  paid boolean;
  move_in_paid boolean;
  covered boolean := false;
  kind text;
  pending jsonb;
begin
  select * into t from public.tenancies where id = p_tenancy_id;
  if not found then raise exception 'Rental not found.'; end if;
  if t.billing_version is null then return null; end if;
  first_month := date_trunc('month', t.lease_start)::date;
  second_month := (first_month + interval '1 month')::date;
  select exists(select 1 from public.payment where tenancy_id = t.id
    and billing_kind = 'move_in' and status = 'paid') into move_in_paid;
  anchor := greatest(first_month, date_trunc('month', p_today)::date);
  if not move_in_paid then
    anchor := first_month;
    due_on := t.lease_start;
    kind := 'move_in';
    rent := t.monthly_rent;
    deposit := coalesce(t.security_deposit, 0);
    advance := coalesce(t.advance_rent, 0);
    paid := false;
  else
    due_on := anchor + least(coalesce(t.rent_due_day, 5),
      extract(day from (anchor + interval '1 month - 1 day'))::int) - 1;
    if anchor = first_month then due_on := t.lease_start; end if;
    covered := anchor = second_month and coalesce(t.advance_rent, 0) > 0;
    paid := app_private.rent_paid_for_period(t.id, anchor) >= t.monthly_rent;
    rent := case when paid then 0 else t.monthly_rent end;
    kind := case when paid then 'fees' else 'monthly' end;
  end if;
  select coalesce(sum(fee_amount), 0), coalesce(jsonb_agg(jsonb_build_object(
    'id', id, 'title', title, 'amount', fee_amount) order by id), '[]'::jsonb)
    into fees, fee_rows from public.maintenance_request
    where tenancy_id = t.id
      and fee_status = 'pending' and fee_amount > 0;
  select jsonb_build_object('id', id, 'referenceId', reference_id, 'method', method)
    into pending from public.payment where tenancy_id = t.id
      and billing_kind is not null and status = 'pending' limit 1;
  return jsonb_build_object(
    'kind', kind, 'periodStart', anchor,
    'periodEnd', (anchor + interval '1 month - 1 day')::date, 'dueDate', due_on,
    'monthlyRent', t.monthly_rent, 'rentDue', rent,
    'securityDeposit', deposit, 'advanceRent', advance,
    'advancePeriodStart', case when advance > 0 then second_month end,
    'advancePeriodEnd', case when advance > 0 then (second_month + interval '1 month - 1 day')::date end,
    'fees', fee_rows, 'totalDue', rent + deposit + advance + fees,
    'rentPaid', paid, 'coveredByAdvance', covered and paid,
    'pendingPayment', pending);
end;
$$;

-- Settlement also stays inside the tenancy that raised the fee.
create or replace function app_private.settle_payment_fees()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if new.billing_kind is not null and new.status = 'paid'
    and (tg_op = 'INSERT' or old.status is distinct from 'paid') then
    update public.maintenance_request set fee_status = 'paid'
      where id = any(new.maintenance_fee_ids) and tenant_id = new.tenant_id
        and apartment_id = new.apartment_id and tenancy_id = new.tenancy_id
        and fee_status = 'pending';
  end if;
  return new;
end;
$$;

-- Landlord write-off. Caller-bound and pending-only; the existing reservation
-- guard rejects a fee already included in a payment awaiting confirmation.
create or replace function public.waive_maintenance_fee(p_request_id uuid)
returns void language plpgsql security definer set search_path = '' as $$
declare
  v_request public.maintenance_request%rowtype;
begin
  select * into v_request from public.maintenance_request
    where id = p_request_id for update;
  if not found then
    raise exception 'Maintenance request not found.';
  end if;
  if coalesce((select auth.jwt()->>'role'), '') <> 'service_role'
    and not exists (
      select 1 from public.apartments a join public.users u on u.id = a.landlord_id
      where a.id = v_request.apartment_id and u.user_id = (select auth.uid())
    ) then
    raise exception 'Only the landlord can waive this fee.';
  end if;
  if v_request.fee_status is distinct from 'pending' then
    raise exception 'Only a pending maintenance fee can be waived.';
  end if;
  if coalesce(v_request.fee_amount, 0) <= 0 then
    raise exception 'This request has no maintenance fee to waive.';
  end if;
  update public.maintenance_request set fee_status = 'waived' where id = v_request.id;
end;
$$;

-- A tenancy cannot end while the tenant still owes a maintenance fee. The
-- landlord either collects it or waives it first.
create or replace function app_private.guard_vacate_pending_fees()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if new.status = 'ended' and old.status is distinct from 'ended'
    and (select auth.uid()) is not null
    and coalesce((select auth.jwt()->>'role'), '') <> 'service_role'
    and exists (
      select 1 from public.maintenance_request mr
      where mr.tenancy_id = old.id
        and mr.fee_status = 'pending'
        and coalesce(mr.fee_amount, 0) > 0
    ) then
    raise exception 'Settle or waive the pending maintenance fee before ending this rental.';
  end if;
  return new;
end;
$$;
create trigger guard_vacate_pending_fees before update of status on public.tenancies
  for each row execute function app_private.guard_vacate_pending_fees();

revoke all on function app_private.guard_maintenance_fee(),
  app_private.guard_vacate_pending_fees(),
  app_private.settle_payment_fees(), app_private.tenancy_bill(uuid, date)
  from public, anon, authenticated;
revoke all on function public.waive_maintenance_fee(uuid) from public, anon;
grant execute on function public.waive_maintenance_fee(uuid) to authenticated, service_role;

-- Register the new and changed trigger functions with the demo-population
-- safety audit. rental_inventory() hashes every function body, so saved
-- previews become stale and must be regenerated.
do $$
declare reviewed record;
begin
  if to_regclass('demo_population.audited_functions') is not null then
    for reviewed in
      select p.oid, n.nspname || '.' || p.proname as name
      from pg_proc p join pg_namespace n on n.oid = p.pronamespace
      where n.nspname = 'app_private' and p.proname in (
        'guard_maintenance_fee', 'guard_vacate_pending_fees', 'settle_payment_fees')
    loop
      insert into demo_population.audited_functions(name, hash)
        values (reviewed.name, md5(pg_get_functiondef(reviewed.oid)))
        on conflict (name) do update set hash = excluded.hash;
    end loop;
  end if;
end;
$$;
