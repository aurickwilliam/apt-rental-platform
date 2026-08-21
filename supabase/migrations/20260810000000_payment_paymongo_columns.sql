-- Payment table: canonical definition + PayMongo go-live columns.
--
-- The `payment` table was created directly in the remote dashboard (no repo
-- migration existed), so this migration is idempotent: it creates the table
-- when missing (fresh environments) and otherwise only adds what's missing
-- (columns, constraints, indexes, grants, policies).
--
-- PayMongo go-live additions:
--   reference_id         client-generated reference (e.g. pay_<base36>)
--   paymongo_session_id  checkout session id (GCash/Maya)
--   paymongo_intent_id   payment intent id (cards)
--   status               'pending' | 'paid' | 'partial' | 'unpaid'
--                        (was 'not paid'): a pending row is inserted at
--                        checkout start by the edge function, and the webhook
--                        flips it to 'paid'.
--   method               normalized to gcash | maya | card | cash
--
-- RLS note: the legacy `tenant_update_own_payments` policy let tenants update
-- any column of their own rows — including flipping status to 'paid'. It is
-- dropped: only the webhook / edge function (service_role) and the landlord
-- status-update policy may write status. Tenants keep select + insert (the
-- pending row is created server-side by the edge function).

create table if not exists public.payment (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz default now(),
  method text constraint payment_method_check check (method in ('gcash', 'maya', 'card', 'cash')),
  date date not null,
  amount numeric,
  status text not null default 'pending' constraint payment_status_check check (status in ('pending', 'paid', 'partial', 'unpaid')),
  reference_no bigint,
  reference_id text,
  paymongo_session_id text,
  paymongo_intent_id text,
  tenant_id uuid references public.users (id),
  apartment_id uuid references public.apartments (id),
  tenancy_id uuid references public.tenancies (id),
  proof_url text,
  due_date date,
  period_start date,
  period_end date
);

alter table public.payment add column if not exists reference_id text;
alter table public.payment add column if not exists paymongo_session_id text;
alter table public.payment add column if not exists paymongo_intent_id text;

alter table public.payment alter column status set default 'pending';

-- Legacy bigint reference (unused at runtime, superseded by reference_id) was
-- NOT NULL with no default — it would block every insert. Make it nullable.
alter table public.payment alter column reference_no drop not null;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'payment_status_check' and conrelid = 'public.payment'::regclass
  ) then
    alter table public.payment
      add constraint payment_status_check check (status in ('pending', 'paid', 'partial', 'unpaid'));
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'payment_method_check' and conrelid = 'public.payment'::regclass
  ) then
    alter table public.payment
      add constraint payment_method_check check (method in ('gcash', 'maya', 'card', 'cash'));
  end if;
end $$;

create index if not exists payment_reference_id_idx on public.payment (reference_id);

-- Privileges: tenants select/insert (landlord status updates ride on the same
-- authenticated grant); paid flips and reference recording happen server-side
-- via service_role. anon gets nothing.
revoke all on public.payment from anon, authenticated;
grant select, insert on public.payment to authenticated;
grant update (status) on public.payment to authenticated;
grant all on public.payment to service_role;

-- RLS policies (idempotent — CREATE POLICY has no IF NOT EXISTS).
do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'payment' and policyname = 'tenant_select_own_payments'
  ) then
    create policy tenant_select_own_payments on public.payment
      for select to public
      using (tenant_id = (select id from public.users where user_id = auth.uid()));
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'payment' and policyname = 'tenant_insert_own_payments'
  ) then
    create policy tenant_insert_own_payments on public.payment
      for insert to public
      with check (tenant_id = (select id from public.users where user_id = auth.uid()));
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'payment' and policyname = 'landlord_select_payments'
  ) then
    create policy landlord_select_payments on public.payment
      for select to public
      using (apartment_id in (
        select a.id from public.apartments a
        where a.landlord_id = (select id from public.users where user_id = auth.uid())
      ));
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'payment' and policyname = 'landlord_update_payment_status'
  ) then
    create policy landlord_update_payment_status on public.payment
      for update to public
      using (apartment_id in (
        select a.id from public.apartments a
        where a.landlord_id = (select id from public.users where user_id = auth.uid())
      ));
  end if;
end $$;

-- Tighten tenant updates: the legacy policy let tenants flip their own
-- status to 'paid'. Only the webhook/edge function (service_role) and the
-- landlord policy above may write status.
drop policy if exists tenant_update_own_payments on public.payment;