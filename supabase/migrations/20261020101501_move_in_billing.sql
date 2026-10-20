-- New tenancies only. Never reinterpret historical deposits or payments.
alter table public.tenancies add column billing_version smallint;
alter table public.tenancies alter column billing_version set default 1;
alter table public.tenancies add constraint tenancies_billing_version_check
  check (billing_version is null or billing_version = 1);

alter table public.payment
  add column billing_kind text check (billing_kind in ('move_in', 'monthly', 'fees')),
  add column rent_amount numeric,
  add column deposit_amount numeric,
  add column advance_amount numeric,
  add column maintenance_amount numeric,
  add column maintenance_fee_ids uuid[],
  add column advance_period_start date,
  add column advance_period_end date,
  add column rental_income_amount numeric generated always as
    (case when billing_kind is null then amount else rent_amount + advance_amount end) stored;

alter table public.payment drop constraint payment_status_check;
alter table public.payment add constraint payment_status_check
  check (status in ('pending', 'paid', 'partial', 'unpaid', 'rejected', 'failed'));
alter table public.payment add constraint payment_allocation_check check (
  billing_kind is null or (
    rent_amount >= 0 and deposit_amount >= 0 and advance_amount >= 0 and maintenance_amount >= 0
    and amount = rent_amount + deposit_amount + advance_amount + maintenance_amount
    and rent_amount is not null and deposit_amount is not null
    and advance_amount is not null and maintenance_amount is not null
  )
);
create index payment_tenancy_billing_idx on public.payment (tenancy_id, period_start, status);
create unique index payment_one_pending_bill_idx on public.payment (tenancy_id)
  where billing_kind is not null and status = 'pending';
create unique index payment_one_paid_move_in_idx on public.payment (tenancy_id)
  where billing_kind = 'move_in' and status = 'paid';

create schema if not exists app_private;

-- Amount allocated to RENT only. A deposit or maintenance fee never pays rent.
create or replace function app_private.rent_paid_for_period(p_tenancy_id uuid, p_period date)
returns numeric language sql stable security definer set search_path = '' as $$
  select coalesce(sum(case
    when p.billing_kind is null and p.period_start <= (p_period + interval '1 month - 1 day')::date
      and coalesce(p.period_end, p.period_start) >= p_period then p.amount
    else
      case when p.period_start = p_period then coalesce(p.rent_amount, 0) else 0 end
      + case when p.advance_period_start = p_period then coalesce(p.advance_amount, 0) else 0 end
    end), 0)
  from public.payment p where p.tenancy_id = p_tenancy_id and p.status = 'paid';
$$;

-- Private date argument makes the calendar contract testable; public callers
-- cannot select a past/future bill. Calendar month 1 includes the move-in day,
-- is billed in full (no proration), and is due on that day. Advance = month 2.
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
    where apartment_id = t.apartment_id and tenant_id = t.tenant_id
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

create or replace function public.get_tenancy_bill(p_tenancy_id uuid)
returns jsonb language plpgsql stable security definer set search_path = '' as $$
begin
  if not exists (select 1 from public.tenancies t join public.users u
    on u.id = t.tenant_id where t.id = p_tenancy_id
      and u.user_id = (select auth.uid()) and not u.is_suspended)
    and coalesce((select auth.jwt()->>'role'), '') <> 'service_role' then
    raise exception 'You cannot view this rental bill.';
  end if;
  return app_private.tenancy_bill(p_tenancy_id, (now() at time zone 'Asia/Manila')::date);
end;
$$;
revoke all on function public.get_tenancy_bill(uuid) from public, anon;
grant execute on function public.get_tenancy_bill(uuid) to authenticated, service_role;

-- Freeze terms on new tenancies, including direct landlord inserts. The
-- approval trigger already copies them; this also closes direct-write bypasses.
create or replace function app_private.guard_tenancy_billing()
returns trigger language plpgsql security definer set search_path = '' as $$
declare a public.apartments%rowtype;
begin
  if tg_op = 'INSERT' then
    -- Historical demo imports stay historical. This exception is available
    -- only to the existing direct-postgres, tracked operator workflow, never
    -- to a client JWT or service-role request.
    if session_user = 'postgres' and (select auth.uid()) is null
      and coalesce(current_setting('app.demo_population_run', true), '') <> '' then
      if exists (select 1 from demo_population.runs
        where id::text = current_setting('app.demo_population_run', true)) then
        new.billing_version := null;
        return new;
      end if;
    end if;
    new.billing_version := 1;
    select * into a from public.apartments where id = new.apartment_id;
    new.monthly_rent := a.monthly_rent;
    new.security_deposit := coalesce(a.security_deposit, 0);
    new.advance_rent := coalesce(a.advance_rent, 0);
    if new.monthly_rent is null or new.monthly_rent <= 0 or new.security_deposit < 0
      or new.advance_rent not in (0, new.monthly_rent) then
      raise exception 'Rental pricing must have a positive rent and at most one month advance.';
    end if;
    if new.lease_start is null or new.rent_due_day is null or new.rent_due_day not between 1 and 31 then
      raise exception 'Choose a move-in date and a rent due day from 1 to 31.';
    end if;
  elsif new.billing_version is distinct from old.billing_version
    or (old.billing_version = 1 and (
      row(new.monthly_rent, new.security_deposit, new.advance_rent, new.lease_start, new.rent_due_day,
        new.tenant_id, new.apartment_id, new.landlord_id)
      is distinct from row(old.monthly_rent, old.security_deposit, old.advance_rent, old.lease_start,
        old.rent_due_day, old.tenant_id, old.apartment_id, old.landlord_id))) then
    raise exception 'The agreed rental billing terms cannot be changed.';
  end if;
  return new;
end;
$$;
create trigger guard_tenancy_billing before insert or update on public.tenancies
  for each row execute function app_private.guard_tenancy_billing();

create or replace function app_private.guard_payment_billing()
returns trigger language plpgsql security definer set search_path = '' as $$
declare t public.tenancies%rowtype; b jsonb;
begin
  select * into t from public.tenancies where id = new.tenancy_id for update;
  if tg_op = 'UPDATE' then
    if old.billing_kind is null and new.billing_kind is null then return new; end if;
    if row(new.amount, new.billing_kind, new.rent_amount, new.deposit_amount, new.advance_amount,
      new.maintenance_amount, new.maintenance_fee_ids, new.advance_period_start, new.advance_period_end,
      new.period_start, new.period_end, new.due_date, new.tenant_id, new.apartment_id,
      new.tenancy_id, new.landlord_id, new.method, new.reference_id)
      is distinct from row(old.amount, old.billing_kind, old.rent_amount, old.deposit_amount,
      old.advance_amount, old.maintenance_amount, old.maintenance_fee_ids,
      old.advance_period_start, old.advance_period_end, old.period_start, old.period_end,
      old.due_date, old.tenant_id, old.apartment_id, old.tenancy_id, old.landlord_id, old.method, old.reference_id) then
      raise exception 'Payment amounts, allocations and ownership cannot be changed.';
    end if;
    if new.status is distinct from old.status then
      if old.status <> 'pending' or new.status not in ('paid', 'rejected', 'failed') then
        raise exception 'Only a pending payment can be confirmed or declined.';
      end if;
      if old.method <> 'cash' and coalesce((select auth.jwt()->>'role'), '') <> 'service_role'
        and (select auth.uid()) is not null then
        raise exception 'Online payments can only be confirmed by the payment provider.';
      end if;
    end if;
    return new;
  end if;
  if t.billing_version is null then
    new.billing_kind := null;
    new.rent_amount := null; new.deposit_amount := null; new.advance_amount := null;
    new.maintenance_amount := null; new.maintenance_fee_ids := null;
    new.advance_period_start := null; new.advance_period_end := null;
    return new;
  end if;
  if t.status <> 'active' or new.tenant_id is distinct from t.tenant_id
    or new.apartment_id is distinct from t.apartment_id then
    raise exception 'This payment does not match an active rental.';
  end if;
  if new.status is distinct from 'pending' then raise exception 'Payments must await confirmation.'; end if;
  if new.method <> 'cash' and coalesce((select auth.jwt()->>'role'), '') <> 'service_role'
    and (select auth.uid()) is not null then
    raise exception 'Start online payments through checkout.';
  end if;
  b := app_private.tenancy_bill(t.id, (now() at time zone 'Asia/Manila')::date);
  if b->'pendingPayment' <> 'null'::jsonb then
    raise exception 'A payment is already awaiting confirmation. Open its receipt before trying again.';
  end if;
  if (b->>'totalDue')::numeric <= 0 then raise exception 'This rental bill is already paid.'; end if;
  if new.amount is distinct from (b->>'totalDue')::numeric
    or new.period_start is distinct from (b->>'periodStart')::date then
    raise exception 'Your bill has changed. Refresh the payment page before paying.';
  end if;
  new.landlord_id := t.landlord_id;
  new.billing_kind := b->>'kind';
  new.period_end := (b->>'periodEnd')::date;
  new.due_date := (b->>'dueDate')::date;
  new.rent_amount := (b->>'rentDue')::numeric;
  new.deposit_amount := (b->>'securityDeposit')::numeric;
  new.advance_amount := (b->>'advanceRent')::numeric;
  new.maintenance_amount := (select coalesce(sum((f->>'amount')::numeric), 0) from jsonb_array_elements(b->'fees') f);
  new.maintenance_fee_ids := array(select (f->>'id')::uuid from jsonb_array_elements(b->'fees') f);
  new.advance_period_start := (b->>'advancePeriodStart')::date;
  new.advance_period_end := (b->>'advancePeriodEnd')::date;
  return new;
end;
$$;
-- Runs before the existing cash guard, which handles legacy bills only below.
create trigger aa_guard_payment_billing before insert or update on public.payment
  for each row execute function app_private.guard_payment_billing();

create or replace function app_private.settle_payment_fees()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if new.billing_kind is not null and new.status = 'paid'
    and (tg_op = 'INSERT' or old.status is distinct from 'paid') then
    update public.maintenance_request set fee_status = 'paid'
      where id = any(new.maintenance_fee_ids) and tenant_id = new.tenant_id
        and apartment_id = new.apartment_id and fee_status = 'pending';
  end if;
  return new;
end;
$$;
create trigger settle_payment_fees after insert or update of status on public.payment
  for each row execute function app_private.settle_payment_fees();

-- A fee being paid cannot change underneath its already-reserved amount.
create or replace function app_private.guard_reserved_maintenance_fee()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if exists (select 1 from public.payment p
    where p.apartment_id = old.apartment_id and p.tenant_id = old.tenant_id
      and p.status = 'pending' and old.id = any(p.maintenance_fee_ids)) then
    raise exception 'This maintenance fee is included in a payment awaiting confirmation.';
  end if;
  if tg_op = 'DELETE' then return old; end if;
  return new;
end;
$$;
create trigger guard_reserved_maintenance_fee_update
  before update of fee_amount, fee_status, apartment_id, tenant_id on public.maintenance_request
  for each row execute function app_private.guard_reserved_maintenance_fee();
create trigger guard_reserved_maintenance_fee_delete before delete on public.maintenance_request
  for each row execute function app_private.guard_reserved_maintenance_fee();

revoke all on function app_private.rent_paid_for_period(uuid, date),
  app_private.tenancy_bill(uuid, date), app_private.guard_tenancy_billing(),
  app_private.guard_payment_billing(), app_private.settle_payment_fees(),
  app_private.guard_reserved_maintenance_fee()
  from public, anon, authenticated;

-- Preserve existing notification/dashboard definitions and their access rules.
-- Fail closed if the expected implementation has drifted rather than silently
-- deploying only half of the accounting fix.
do $$
declare definition text; reviewed record;
begin
  if to_regclass('demo_population.audited_functions') is not null then
    if exists (select 1 from demo_population.audited_functions a
      where a.name in ('public.guard_cash_payment_insert', 'public.notify_payment_created')
        and a.hash <> md5(pg_get_functiondef((a.name || '()')::regprocedure))) then
      raise exception 'Review the changed payment functions against the demo-population safety audit first.';
    end if;
  end if;
  definition := pg_get_functiondef('public.guard_cash_payment_insert()'::regprocedure);
  if position('if new.method <> ''cash'' then' in definition) = 0 then
    raise exception 'Review the current cash insert guard before deploying move-in billing.';
  end if;
  execute replace(definition, 'if new.method <> ''cash'' then',
    'if new.method <> ''cash'' or new.billing_kind is not null then');

  definition := pg_get_functiondef('public.notify_rent_due_status()'::regprocedure);
  if position('select coalesce(sum(p.amount), 0) into v_paid' in definition) = 0 then
    raise exception 'Review the current rent reminder function before deploying move-in billing.';
  end if;
  -- Keep the reminder schedule/audiences; replace only its rent-coverage query.
  definition := regexp_replace(definition,
    'select coalesce\(sum\(p.amount\), 0\) into v_paid.*?coalesce\(p.period_end, p.period_start\) >= v_month_anchor;',
    'select app_private.rent_paid_for_period(t.id, v_month_anchor) into v_paid;', 's');
  execute definition;

  definition := pg_get_functiondef('public.get_landlord_dashboard(uuid)'::regprocedure);
  if position('sum(p.amount)' in definition) = 0 then
    raise exception 'Review landlord revenue accounting before deploying move-in billing.';
  end if;
  execute replace(definition, 'sum(p.amount)', 'sum(p.rental_income_amount)');

  definition := pg_get_functiondef('public.notify_payment_created()'::regprocedure);
  definition := replace(definition, '''Your rent payment of ₱'' ||',
    '(case when NEW.billing_kind = ''move_in'' then ''Your move-in payment of ₱'' else ''Your rent payment of ₱'' end) ||');
  execute definition;

  -- Update only the functions reviewed in this migration, not the entire
  -- importer's fail-closed allowlist. The demo exception above is operator-only.
  if to_regclass('demo_population.audited_functions') is not null then
    for reviewed in select p.oid, n.nspname || '.' || p.proname as name
      from pg_proc p join pg_namespace n on n.oid = p.pronamespace
      where (n.nspname = 'app_private' and p.proname in (
        'guard_tenancy_billing', 'guard_payment_billing', 'settle_payment_fees', 'guard_reserved_maintenance_fee'))
        or (n.nspname = 'public' and p.proname in ('guard_cash_payment_insert', 'notify_payment_created'))
    loop
      insert into demo_population.audited_functions(name, hash)
        values (reviewed.name, md5(pg_get_functiondef(reviewed.oid)))
        on conflict (name) do update set hash = excluded.hash;
    end loop;
  end if;
end;
$$;
