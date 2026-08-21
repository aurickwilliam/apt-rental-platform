-- Grants for user-facing payout tables.
--
-- FIX: 20260820000000_payouts_refunds revoked ALL from authenticated on every
-- new table (correct for service-only payout_config / payout_run) but never
-- re-granted the user-facing subset. Table privileges are checked before row
-- security, so every client query failed with 42501 despite valid RLS policies
-- (dest_select_own / dest_insert_own_verified / dest_update_own_verified /
-- dest_delete_own, payout_select_own, refund_select_own). Caught live when a
-- verified landlord tried to save a payout destination from the app.

-- Landlords manage their own destinations; RLS scopes rows and enforces the
-- account_status = 'verified' gate on INSERT/UPDATE.
grant select, insert, update, delete on public.payout_destination to authenticated;

-- Users read their own payouts and refunds; all writes stay service_role
-- (edge functions / webhooks / cron).
grant select on public.payout to authenticated;
grant select on public.refund to authenticated;
