-- Restore PayMongo checkout columns for test-mode hybrid (no disbursement).
-- Re-adds session/intent/payment tracking needed for hosted checkout + webhook
-- flip pending -> paid. Payout/refund tables remain dropped (simulation cleanup).
alter table public.payment add column if not exists paymongo_session_id text;
alter table public.payment add column if not exists paymongo_intent_id text;
alter table public.payment add column if not exists paymongo_payment_id text;
alter table public.payment add column if not exists paymongo_payment_method_type text;

create index if not exists payment_paymongo_session_idx on public.payment (paymongo_session_id) where paymongo_session_id is not null;
create index if not exists payment_reference_id_idx on public.payment (reference_id);
