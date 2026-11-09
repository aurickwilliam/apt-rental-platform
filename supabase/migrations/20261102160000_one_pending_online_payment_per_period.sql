-- One unfinished online payment per tenancy and rent period.
--
-- Leaving PayMongo's page without paying left that attempt `pending`, and pressing Pay again
-- created a second one. For tenancies on the server bill (billing_kind set) the existing
-- payment_one_pending_bill_idx already allows one pending payment; legacy tenancies had no such
-- rule. This partial unique index is the database backstop: the paymongo function now closes the
-- unfinished attempt before starting a new one, and a concurrent second attempt is refused here.
-- Cash is excluded (it has its own pending-submission guard); different periods stay independent.
create unique index if not exists payment_one_pending_online_idx
  on public.payment (tenancy_id, (coalesce(period_start, date '0001-01-01')))
  where status = 'pending' and method <> 'cash';
