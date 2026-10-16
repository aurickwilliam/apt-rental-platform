-- Cash is a landlord-reviewed payment method. A tenant may submit one request
-- per tenancy/billing period, then may try again only after the landlord rejects
-- it. Card and wallet payment rows remain webhook-owned.
alter table public.payment drop constraint if exists payment_status_check;
alter table public.payment add constraint payment_status_check
  check (status in ('pending', 'paid', 'partial', 'unpaid', 'rejected'));

create unique index if not exists payment_one_pending_cash_per_period_idx
  on public.payment (tenant_id, tenancy_id, period_start)
  where method = 'cash' and status = 'pending' and period_start is not null;

create or replace function public.guard_cash_payment_insert()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.method <> 'cash' then
    return new;
  end if;

  if new.status is distinct from 'pending' then
    raise exception 'Cash payments must be submitted for landlord confirmation.';
  end if;

  if new.period_start is null then
    raise exception 'Cash payments must include a billing period.';
  end if;

  if exists (
    select 1
    from public.payment as existing
    where existing.tenant_id = new.tenant_id
      and existing.tenancy_id = new.tenancy_id
      and existing.period_start = new.period_start
      and existing.method = 'cash'
      and existing.status is distinct from 'rejected'
  ) then
    raise exception 'A cash payment for this billing period is already awaiting landlord confirmation or has been accepted.';
  end if;

  return new;
end;
$$;

drop trigger if exists guard_cash_payment_insert on public.payment;
create trigger guard_cash_payment_insert
  before insert on public.payment
  for each row execute function public.guard_cash_payment_insert();

create or replace function public.guard_cash_payment_status_transition()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if old.method <> 'cash' then
    return new;
  end if;

  if new.method is distinct from old.method
    or new.tenant_id is distinct from old.tenant_id
    or new.tenancy_id is distinct from old.tenancy_id
    or new.apartment_id is distinct from old.apartment_id
    or new.period_start is distinct from old.period_start then
    raise exception 'Cash payment ownership and billing period cannot be changed.';
  end if;

  if new.status is distinct from old.status
    and (old.status <> 'pending' or new.status not in ('paid', 'rejected')) then
    raise exception 'A cash payment can only be marked paid or rejected while awaiting landlord confirmation.';
  end if;

  return new;
end;
$$;

drop trigger if exists guard_cash_payment_status_transition on public.payment;
create trigger guard_cash_payment_status_transition
  before update on public.payment
  for each row execute function public.guard_cash_payment_status_transition();

revoke all on function public.guard_cash_payment_insert() from public, anon, authenticated;
revoke all on function public.guard_cash_payment_status_transition() from public, anon, authenticated;
