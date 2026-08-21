-- Part 6 — Payouts (landlord disbursement) & refunds (tenant).
--
-- See docs/payment-paymongo-plan.md Part 6. Design-review fixes baked in:
--   FIX 1 — refund eligibility: paymongo rail metadata captured on the row
--           (paymongo_payment_id + paymongo_payment_method_type), generated
--           is_refundable allowlist column, partial unique index closing the
--           double-refund race.
--   FIX 2 — atomic payout aggregation: create_payout_and_claim claims payment
--           rows inside the same transaction that creates the payout row;
--           deterministic-but-attempted reference_number (fresh per retry).
--   FIX 3 — payout status semantics: pending -> processing (awaiting rail
--           settlement) -> completed | failed | returned. `returned` is a
--           distinct failure mode (funds bounced back): destination gets
--           deactivated, payments requeued — no blind retry on a bad account.
--
-- RLS summary:
--   - payout_destination: users manage their own rows; INSERT/UPDATE require
--     users.account_status = 'verified'; any add/change fires a fraud-tripwire
--     notification.
--   - payout / refund: users SELECT their own rows only; all status writes
--     are service_role-only.
--   - payout_run / payout_config: service_role only.
--   - All FKs to public.users use the internal id (public.users.id), per the
--     repo convention.

-- ---------------------------------------------------------------------------
-- Extensions (idempotent; pg_net already installed on the remote project).
-- ---------------------------------------------------------------------------

create extension if not exists pg_net;
create extension if not exists pg_cron;
create extension if not exists supabase_vault;

-- ---------------------------------------------------------------------------
-- payout_config — single-row config; the ₱10 transfer fee is a value here,
-- never a hardcoded literal in code (PayMongo pricing changes).
-- ---------------------------------------------------------------------------

create table if not exists public.payout_config (
  id smallint primary key default 1 check (id = 1),
  transfer_fee numeric not null default 10.00 check (transfer_fee >= 0),
  min_payout_amount numeric not null default 100.00 check (min_payout_amount >= 0),
  updated_at timestamptz not null default now()
);

insert into public.payout_config (id, transfer_fee, min_payout_amount)
values (1, 10.00, 100.00)
on conflict (id) do nothing;

alter table public.payout_config enable row level security;
revoke all on public.payout_config from anon, authenticated;
grant all on public.payout_config to service_role;

-- ---------------------------------------------------------------------------
-- payout_destination — landlord bank / e-wallet accounts for disbursement.
-- Created before payout (payout.destination_id references it).
-- ---------------------------------------------------------------------------

create table if not exists public.payout_destination (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  type text not null check (type in ('bank', 'gcash', 'maya')),
  bic text not null,
  account_number text not null,
  account_name text not null,
  is_default boolean not null default false,
  status text not null default 'active' check (status in ('active', 'inactive')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists payout_destination_user_default_idx
  on public.payout_destination (user_id)
  where status = 'active';

alter table public.payout_destination enable row level security;
revoke all on public.payout_destination from anon, authenticated;
grant all on public.payout_destination to service_role;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'payout_destination' and policyname = 'dest_select_own'
  ) then
    create policy dest_select_own on public.payout_destination
      for select to public
      using (user_id = (select id from public.users where user_id = auth.uid()));
  end if;

  -- Identity-verified gate: adding/changing a payout destination requires a
  -- completed verification (account_status = 'verified').
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'payout_destination' and policyname = 'dest_insert_own_verified'
  ) then
    create policy dest_insert_own_verified on public.payout_destination
      for insert to public
      with check (
        user_id = (select id from public.users where user_id = auth.uid())
        and exists (
          select 1 from public.users u
          where u.id = user_id and u.account_status = 'verified'
        )
      );
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'payout_destination' and policyname = 'dest_update_own_verified'
  ) then
    create policy dest_update_own_verified on public.payout_destination
      for update to public
      using (user_id = (select id from public.users where user_id = auth.uid()))
      with check (
        user_id = (select id from public.users where user_id = auth.uid())
        and exists (
          select 1 from public.users u
          where u.id = user_id and u.account_status = 'verified'
        )
      );
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'payout_destination' and policyname = 'dest_delete_own'
  ) then
    create policy dest_delete_own on public.payout_destination
      for delete to public
      using (user_id = (select id from public.users where user_id = auth.uid()));
  end if;
end $$;

-- Fraud tripwire: every add/change notifies the landlord.
create or replace function public.notify_payout_destination_changed()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.create_notification(
    NEW.user_id,
    'payment',
    'Payout Destination Changed',
    'Your payout destination was ' || case when TG_OP = 'INSERT' then 'added' else 'changed' end
      || '. If this was not you, contact support immediately.',
    jsonb_build_object('screen', 'payouts', 'destinationId', NEW.id)
  );
  return NEW;
end;
$$;

drop trigger if exists notify_payout_destination_changed on public.payout_destination;

create trigger notify_payout_destination_changed
  after insert or update on public.payout_destination
  for each row
  execute function public.notify_payout_destination_changed();

-- ---------------------------------------------------------------------------
-- payout — one aggregated disbursement per landlord per run.
-- FIX 3 statuses: pending (created) -> processing (submitted, awaiting rail
-- settlement) -> completed | failed | returned. `returned` = funds bounced
-- back (bad/closed destination) — handled separately, never blind-retried.
-- ---------------------------------------------------------------------------

create table if not exists public.payout (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  destination_id uuid references public.payout_destination (id),
  amount numeric not null default 0 check (amount >= 0),
  fee numeric not null default 0 check (fee >= 0),
  net_amount numeric not null default 0 check (net_amount >= 0),
  status text not null default 'pending'
    check (status in ('pending', 'processing', 'completed', 'failed', 'returned')),
  reference_number text not null,
  attempt int not null default 1,
  period_start date,
  period_end date,
  paymongo_batch_id text,
  paymongo_transfer_id text,
  failure_reason text,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists payout_user_created_idx
  on public.payout (user_id, created_at desc);

create index if not exists payout_transfer_id_idx
  on public.payout (paymongo_transfer_id)
  where paymongo_transfer_id is not null;

alter table public.payout enable row level security;
revoke all on public.payout from anon, authenticated;
grant all on public.payout to service_role;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'payout' and policyname = 'payout_select_own'
  ) then
    create policy payout_select_own on public.payout
      for select to public
      using (user_id = (select id from public.users where user_id = auth.uid()));
  end if;
end $$;

-- ---------------------------------------------------------------------------
-- payment: Part 6 columns.
-- ---------------------------------------------------------------------------

alter table public.payment add column if not exists paymongo_payment_id text;
alter table public.payment add column if not exists paymongo_payment_method_type text;
alter table public.payment add column if not exists landlord_id uuid references public.users (id);
alter table public.payment add column if not exists payout_eligible_at timestamptz;
alter table public.payment add column if not exists payout_id uuid references public.payout (id);
alter table public.payment add column if not exists payout_attempts int not null default 0;

-- FIX 1 — derived refundability. Allowlist only: card and standard e-wallet
-- checkout payments (gcash / paymaya). QR Ph, direct online banking (dob) and
-- OTC rails are never refundable via the PayMongo API.
alter table public.payment add column if not exists is_refundable boolean
  generated always as (
    method in ('card', 'gcash', 'maya')
    and paymongo_payment_id is not null
    and paymongo_payment_method_type in ('card', 'gcash', 'paymaya')
  ) stored;

-- Backfill landlord_id from the apartment (FIX 2 claim is single-table).
update public.payment p
set landlord_id = a.landlord_id
from public.apartments a
where p.apartment_id = a.id
  and p.landlord_id is null;

-- Backfill payout_eligible_at for already-paid rows (they are past clearing).
update public.payment
set payout_eligible_at = coalesce(created_at, now())
  + case when method = 'card' then interval '3 days' else interval '2 days' end
where status = 'paid'
  and payout_eligible_at is null
  and method in ('gcash', 'maya', 'card');

-- FIX 2 — claim query index: unclaimed, eligible, paid rows per landlord.
create index if not exists payment_payout_claim_idx
  on public.payment (landlord_id, payout_eligible_at)
  where status = 'paid' and payout_id is null;

-- FIX 3 / clearing window — set payout_eligible_at when a payment flips to
-- paid (webhook flips and the synchronous card insert both pass through
-- here). Card clears in 3 banking days, e-wallets in 2.
create or replace function public.payment_set_payout_eligible_at()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if NEW.status = 'paid' and NEW.payout_eligible_at is null then
    NEW.payout_eligible_at := now() + case NEW.method
      when 'card' then interval '3 days'
      else interval '2 days'
    end;
  end if;
  return NEW;
end;
$$;

drop trigger if exists payment_set_payout_eligible_at on public.payment;

create trigger payment_set_payout_eligible_at
  before insert or update of status on public.payment
  for each row
  when (new.status = 'paid')
  execute function public.payment_set_payout_eligible_at();

-- ---------------------------------------------------------------------------
-- refund — tenant payout back to the original payment method.
-- ---------------------------------------------------------------------------

create table if not exists public.refund (
  id uuid primary key default gen_random_uuid(),
  payment_id uuid not null references public.payment (id) on delete cascade,
  user_id uuid not null references public.users (id) on delete cascade,
  amount numeric not null check (amount > 0),
  reason text not null default 'requested_by_customer'
    check (reason in ('duplicate', 'fraudulent', 'requested_by_customer', 'others')),
  status text not null default 'pending'
    check (status in ('pending', 'processing', 'succeeded', 'failed')),
  paymongo_refund_id text,
  failure_reason text,
  created_by uuid references public.users (id),
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- FIX 1 — double-refund race: at most one in-flight refund per payment.
-- Rows leave the covered set once they settle, so a later (e.g. partial)
-- refund remains possible.
create unique index if not exists one_active_refund_per_payment
  on public.refund (payment_id)
  where status in ('pending', 'processing');

create index if not exists refund_user_created_idx
  on public.refund (user_id, created_at desc);

alter table public.refund enable row level security;
revoke all on public.refund from anon, authenticated;
grant all on public.refund to service_role;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'refund' and policyname = 'refund_select_own'
  ) then
    create policy refund_select_own on public.refund
      for select to public
      using (user_id = (select id from public.users where user_id = auth.uid()));
  end if;
end $$;

-- ---------------------------------------------------------------------------
-- payout_run — one row per process-payouts invocation; per-landlord failures
-- are captured so one bad landlord never swallows the rest of the run.
-- ---------------------------------------------------------------------------

create table if not exists public.payout_run (
  id uuid primary key default gen_random_uuid(),
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  landlords_processed int not null default 0,
  payouts_created int not null default 0,
  failures jsonb not null default '[]'::jsonb
);

alter table public.payout_run enable row level security;
revoke all on public.payout_run from anon, authenticated;
grant all on public.payout_run to service_role;

-- ---------------------------------------------------------------------------
-- FIX 2 — atomic payout aggregation.
-- Creates the payout row and claims eligible payments in ONE transaction.
-- Concurrency: the claim UPDATE takes row locks and re-checks
-- payout_id IS NULL after blocking, so overlapping process-payouts runs can
-- never claim the same payments twice; the losing run rolls its payout back.
-- reference_number is deterministic given (landlord, period, attempt) and
-- changes per attempt — fresh reference to PayMongo on every retry (their
-- guidance), shared prefix for traceability. Not unique-constrained on
-- purpose: a concurrent losing run may compute the same value, and its row
-- is rolled back with its claim.
-- ---------------------------------------------------------------------------

create or replace function public.create_payout_and_claim(
  p_landlord_id uuid,
  p_destination_id uuid,
  p_period_start date,
  p_period_end date,
  p_max_attempts int default 3
) returns table (payout_id uuid, amount numeric, net_amount numeric, reference_number text)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_fee numeric;
  v_min_amount numeric;
  v_destination_owner uuid;
  v_payout_id uuid;
  v_claimed numeric;
  v_attempt int;
  v_reference_number text;
begin
  select d.user_id into v_destination_owner
  from public.payout_destination d
  where d.id = p_destination_id
    and d.status = 'active';

  if v_destination_owner is null or v_destination_owner <> p_landlord_id then
    raise exception 'Destination is not active or does not belong to this landlord.'
      using errcode = 'P0001';
  end if;

  select transfer_fee, min_payout_amount
    into v_fee, v_min_amount
  from public.payout_config
  where id = 1;

  v_attempt := 1 + coalesce((
    select max(attempt) from public.payout
    where user_id = p_landlord_id
      and period_start = p_period_start
      and period_end = p_period_end
  ), 0);

  v_reference_number := 'APT-PO-' || replace(p_landlord_id::text, '-', '')
    || '-' || to_char(p_period_start, 'YYYYMMDD')
    || '-' || v_attempt;

  insert into public.payout (
    user_id, destination_id, amount, fee, net_amount, status,
    reference_number, attempt, period_start, period_end
  ) values (
    p_landlord_id, p_destination_id, 0, v_fee, 0, 'pending',
    v_reference_number, v_attempt, p_period_start, p_period_end
  )
  returning id into v_payout_id;

  with eligible as (
    select p.id, p.amount
    from public.payment p
    where p.landlord_id = p_landlord_id
      and p.status = 'paid'
      and p.payout_id is null
      and p.payout_eligible_at <= now()
      and p.payout_attempts < p_max_attempts
      and p.method in ('gcash', 'maya', 'card')
  ), claimed as (
    update public.payment p
    set payout_id = v_payout_id
    from eligible e
    where p.id = e.id
    returning p.amount
  )
  select coalesce(sum(c.amount), 0) into v_claimed from claimed c;

  if v_claimed < v_min_amount then
    update public.payment p
    set payout_id = null
    where p.payout_id = v_payout_id;

    delete from public.payout where id = v_payout_id;
    return;
  end if;

  update public.payout
  set amount = v_claimed,
      net_amount = v_claimed - v_fee
  where id = v_payout_id;

  -- The claim is real: count the attempt toward the retry cap.
  update public.payment p
  set payout_attempts = p.payout_attempts + 1
  where p.payout_id = v_payout_id;

  return query
    select p.id, p.amount, p.net_amount, p.reference_number
    from public.payout p
    where p.id = v_payout_id;
end;
$$;

revoke execute on function public.create_payout_and_claim(uuid, uuid, date, date, int) from public, anon, authenticated;
grant execute on function public.create_payout_and_claim(uuid, uuid, date, date, int) to service_role;

comment on function public.create_payout_and_claim(uuid, uuid, date, date, int) is
  'Atomically create a payout row and claim eligible paid payments for a landlord. Service role only.';

-- ---------------------------------------------------------------------------
-- Notifications (all via create_notification; type 'payment').
-- ---------------------------------------------------------------------------

create or replace function public.notify_payout_status_changed()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_title text;
  v_message text;
begin
  if NEW.status = OLD.status then
    return NEW;
  end if;

  case NEW.status
    when 'processing' then
      v_title := 'Payout Sent';
      v_message := 'Your payout of ₱' || to_char(NEW.net_amount, 'FM999,999,999.00')
        || ' is on its way — it typically arrives the same banking day.';
    when 'completed' then
      v_title := 'Payout Successful';
      v_message := 'Your payout of ₱' || to_char(NEW.net_amount, 'FM999,999,999.00')
        || ' has been delivered.';
    when 'failed' then
      v_title := 'Payout Failed';
      v_message := 'Your payout of ₱' || to_char(NEW.net_amount, 'FM999,999,999.00')
        || ' failed and will be retried automatically.';
    when 'returned' then
      v_title := 'Payout Returned';
      v_message := 'Your payout was returned because the destination account was unreachable. '
        || 'The destination has been deactivated — add a new one to resume payouts.';
    else
      return NEW;
  end case;

  perform public.create_notification(
    NEW.user_id,
    'payment',
    v_title,
    v_message,
    jsonb_build_object('screen', 'payouts', 'payoutId', NEW.id)
  );

  return NEW;
end;
$$;

drop trigger if exists notify_payout_status_changed on public.payout;

create trigger notify_payout_status_changed
  after update of status on public.payout
  for each row
  execute function public.notify_payout_status_changed();

create or replace function public.notify_refund_status_changed()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if NEW.status = OLD.status then
    return NEW;
  end if;

  if NEW.status = 'succeeded' then
    perform public.create_notification(
      NEW.user_id,
      'payment',
      'Refund Successful',
      'Your refund of ₱' || to_char(NEW.amount, 'FM999,999,999.00')
        || ' is on its way back to your original payment method.',
      jsonb_build_object('screen', 'payments', 'paymentId', NEW.payment_id, 'refundId', NEW.id)
    );
  elsif NEW.status = 'failed' then
    perform public.create_notification(
      NEW.user_id,
      'payment',
      'Refund Failed',
      'Your refund of ₱' || to_char(NEW.amount, 'FM999,999,999.00')
        || ' could not be processed. Please try again or contact your landlord.',
      jsonb_build_object('screen', 'payments', 'paymentId', NEW.payment_id, 'refundId', NEW.id)
    );
  end if;

  return NEW;
end;
$$;

drop trigger if exists notify_refund_status_changed on public.refund;

create trigger notify_refund_status_changed
  after update of status on public.refund
  for each row
  execute function public.notify_refund_status_changed();

-- ---------------------------------------------------------------------------
-- Scheduler — daily 02:00 Asia/Manila (PESONet clears on 11:00/14:00/17:00
-- Manila cycles, so submissions settle later the same banking day).
-- pg_cron 1.6 on Supabase has no schedule_in_timezone; schedules use the
-- cron.timezone GUC (default GMT). The Philippines is UTC+8 with no DST, so
-- 02:00 Manila = 18:00 UTC the previous day.
-- The service role key lives in vault (owner action: vault.create_secret).
-- net.http_post is fire-and-forget; an empty bearer before the secret exists
-- yields a 401 that is visible in the edge function logs.
-- ---------------------------------------------------------------------------

select cron.unschedule('process-payouts') where exists (
  select 1 from cron.job where jobname = 'process-payouts'
);

select cron.schedule(
  'process-payouts',
  '0 18 * * *',
  $$
  select net.http_post(
    url := 'https://ezxirkpgfpripjydcqnt.supabase.co/functions/v1/process-payouts',
    headers := jsonb_build_object(
      'Authorization', 'Bearer ' || (select decrypted_secret from vault.decrypted_secrets where name = 'PAYOUT_SERVICE_ROLE_KEY'),
      'Content-Type', 'application/json'
    ),
    body := '{}'::jsonb
  );
  $$
);