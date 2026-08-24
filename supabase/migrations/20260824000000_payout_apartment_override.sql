-- Per-apartment payout override (indefinite reusable)
-- Allows Irene's Housing (56510e01-3ea1-4aae-9801-0d8c63ab5c75) to be fee-waived min 20
-- while all other apartments stay global payout_config (100/10).
-- Indefinite: is_active=true and expires_at null => reusable until explicitly disabled.

create table if not exists public.payout_apartment_override (
  apartment_id uuid primary key references public.apartments(id) on delete cascade,
  transfer_fee numeric not null check (transfer_fee >= 0),
  min_payout_amount numeric not null check (min_payout_amount >= 0),
  reason text,
  is_active boolean not null default true,
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.payout_apartment_override enable row level security;

-- Service-role only (mirrors payout_config)
revoke all on public.payout_apartment_override from anon, authenticated;
grant all on public.payout_apartment_override to service_role;

-- Optional index for cron lookup
create index if not exists payout_apartment_override_active_idx
  on public.payout_apartment_override (apartment_id) where is_active;

-- Updated trigger
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists payout_apartment_override_updated_at on public.payout_apartment_override;
create trigger payout_apartment_override_updated_at
  before update on public.payout_apartment_override
  for each row execute function public.set_updated_at();
