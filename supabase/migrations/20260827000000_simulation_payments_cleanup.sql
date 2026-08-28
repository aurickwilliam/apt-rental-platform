-- Simulation payments cleanup: remove PayMongo / payout / refund provider plumbing.
-- Payments are now simulated locally (no external provider). Cash stays pending,
-- all other methods insert as paid directly via the client.
-- Drops payout/refund tables, PayMongo columns on payment, and cron.

-- Unschedule the payout cron if present.
select cron.unschedule('process-payouts') where exists (
  select 1 from cron.job where jobname = 'process-payouts'
);

-- Drop payout/refund notification triggers first (they reference the tables).
drop trigger if exists notify_payout_status_changed on public.payout;
drop trigger if exists notify_refund_status_changed on public.refund;
drop trigger if exists notify_payout_destination_changed on public.payout_destination;
drop trigger if exists payout_apartment_override_updated_at on public.payout_apartment_override;
drop function if exists public.notify_payout_status_changed();
drop function if exists public.notify_refund_status_changed();
drop function if exists public.notify_payout_destination_changed();

-- Drop the atomic claim function.
drop function if exists public.create_payout_and_claim(uuid, uuid, date, date, int);
drop function if exists public.create_payout_and_claim(uuid, uuid, date, date, int, uuid);

-- Payment: payout/clearing trigger + generated refundability + paymongo cols.
drop trigger if exists payment_set_payout_eligible_at on public.payment;
drop function if exists public.payment_set_payout_eligible_at();
drop index if exists public.payment_payout_claim_idx;
drop index if exists public.payout_apartment_override_active_idx;

alter table public.payment drop column if exists is_refundable;
alter table public.payment drop column if exists paymongo_payment_id;
alter table public.payment drop column if exists paymongo_payment_method_type;
alter table public.payment drop column if exists payout_eligible_at;
alter table public.payment drop column if exists payout_id;
alter table public.payment drop column if exists payout_attempts;

-- Broader paymongo session/intent cols from 20260810000000.
alter table public.payment drop column if exists paymongo_session_id;
alter table public.payment drop column if exists paymongo_intent_id;

-- Keep landlord_id (useful denormalized field for queries even in simulation).
-- Drop dependent payout/refund objects.
drop index if exists public.one_active_refund_per_payment;

alter table public.refund disable row level security;
drop policy if exists refund_select_own on public.refund;
drop table if exists public.refund cascade;

alter table public.payout disable row level security;
drop policy if exists payout_select_own on public.payout;
drop table if exists public.payout cascade;

alter table public.payout_run disable row level security;
drop table if exists public.payout_run cascade;

alter table public.payout_destination disable row level security;
drop policy if exists dest_select_own on public.payout_destination;
drop policy if exists dest_insert_own_verified on public.payout_destination;
drop policy if exists dest_update_own_verified on public.payout_destination;
drop policy if exists dest_delete_own on public.payout_destination;
drop table if exists public.payout_destination cascade;

alter table public.payout_config disable row level security;
drop table if exists public.payout_config cascade;

alter table public.payout_apartment_override disable row level security;
drop table if exists public.payout_apartment_override cascade;

-- Restore payment RLS grants to the simple payment-table model (tenants insert/select, landlord update cash status).
-- Existing grants from 20260810000000 remain; no extra action needed.
