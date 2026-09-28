-- Maintenance fee columns (landlord charges tenant on resolve).
--
-- Additive and idempotent: existing rows keep NULL (meaning "no fee charged").
-- fee_amount: NULL = no fee, otherwise the peso amount owed.
-- fee_status: NULL = no fee, 'pending' = owed (added to next rent), 'paid' = settled.
--
-- RLS unchanged: the existing landlord_update_maintenance policy (landlord_id
-- gate, full-row UPDATE grant) already covers these columns. Tenants can read
-- their own rows via tenant_select_own_maintenance; clients must never let
-- tenants write fee columns (no UI writes them).

alter table public.maintenance_request add column if not exists fee_amount numeric null;
alter table public.maintenance_request add column if not exists fee_status text null;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'maintenance_fee_amount_check' and conrelid = 'public.maintenance_request'::regclass
  ) then
    alter table public.maintenance_request
      add constraint maintenance_fee_amount_check check (fee_amount is null or fee_amount >= 0);
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'maintenance_fee_status_check' and conrelid = 'public.maintenance_request'::regclass
  ) then
    alter table public.maintenance_request
      add constraint maintenance_fee_status_check check (fee_status is null or fee_status in ('pending', 'paid'));
  end if;
end $$;
