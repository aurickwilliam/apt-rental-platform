# Payout / Refund — Real-Mode E2E Checklist

Working doc for Part 6 of `payment-paymongo-plan.md`. Code + schema are implemented and deployed;
this file tracks the remaining runtime setup and the end-to-end verification.

## Status

| Item | State |
|---|---|
| Migration `20260820000000_payouts_refunds.sql` | ✅ applied (+2 in-run fixes, see below) |
| `paymongo` v7 · `paymongo-webhook` v15 · `process-payouts` v7 | ✅ deployed (`paymongo-webhook` must deploy with `--no-verify-jwt`, see fix 3) |
| Types in `packages/supabase/src/types.ts` | ✅ regenerated |
| Mobile refund UI / service / hooks / tests | ✅ 35 suites, 231 tests pass |
| Cron `process-payouts` (18:00 UTC) + vault `PAYOUT_SERVICE_ROLE_KEY` | ✅ verified (fired live during the E2E) |
| PayMongo wallet enabled (live side); account number/name obtained | ✅ |
| Test-mode wallet provisioned + funded | ✅ (~₱20,010 sandbox balance at start; ~₱2,000 left after the E2E) |
| Edge secrets `PAYMONGO_SECRET_KEY` (test key), wallet account number/name, webhook secret | ✅ set — real mode active |
| Seed `payout_destination` for E2E landlord | ✅ seeded (`4c413e29-…`, simulator `999999990001`) |
| **Mock-mode E2E** | ✅ passed — run `126647be-…`, payout `db1e8bde-…` `completed` |
| Mock idempotency re-trigger | ✅ run `585c2211-…`, 0 processed |
| **Real-mode success leg** | ✅ run `8a516151-…` → payout `9719bea4-…` `completed` (`batch_tr_1ad91359…` / `tr_8b8b4f44…`, net ₱14,990) settled by `transfer.outward.successful` |
| Real-mode idempotency re-trigger | ✅ run `593b23b4-…`, 0/0 |
| **Real-mode failed leg** | ✅ run `3ee0ff64-…` → payout `cb8fd621-…` `failed` ("Simulated failure for test number", surfaced from `provider_error`), payment requeued (`payout_id` null, attempts kept); destination restored to `999999990001` |
| **Cron auto-retry (bonus)** | ✅ the 18:00 UTC cron claimed the requeued payment → payout `10ccd729-…` `completed` (`tr_a6298d90…`) — fail → requeue → next scheduled run → success, fully unattended |
| **Refund leg** | ✅ fresh GCash checkout ₱30,000 (`cs_a5e5ecbf…` / `pay_Nd94Heb4…`) → refund `5643b087-…` `succeeded` (`ref_xaXDpBvzqG4BvJp543WVLdh1`) in ~2.6 s via `payment.refund.*`; "Refund Successful" notification fired from the DB trigger |
| qrph negative test | ✅ data-level: rail `qrph` flips generated `is_refundable` to `false` — the exact condition behind `REFUND_NOT_SUPPORTED` (in-app route impossible: the button hides when not refundable); reverted to `gcash` |
| Commit / merge / PR | ⏳ pending (not pushed yet) |

## Fixes discovered during the mock E2E

1. **`process-payouts` auth gate** — the original `requireServiceRole` called
   `auth.getUser()`, which rejects the service-role JWT (no `sub` claim → GoTrue
   `bad_jwt: missing sub claim`). The first fix (constant-time compare against the
   `SUPABASE_SERVICE_ROLE_KEY` env) still failed because the vault key string differs from
   the env key. **Final fix:** decode the JWT payload (signature is already verified by the
   platform gateway, `verify_jwt=true`) and assert `claims.role === 'service_role'`.
   Deployed as v7 via `supabase functions deploy process-payouts --project-ref ezxirkpgfpripjydcqnt --use-api`.
2. **`create_payout_and_claim` SQL bugs** — the `RETURNS TABLE (payout_id, amount, …)`
   output columns shadow table columns inside the body, causing `42702` ("column reference
   payout_id/amount is ambiguous"), and `RETURNING sum(...)` is not allowed (`42803`).
   **Fix:** alias-qualified column references (`p.*`) and an atomic `eligible`/`claimed`
   CTE that computes `sum(c.amount)` from the rows actually updated. The migration file is
   updated; the function was re-applied to the DB directly (the migration itself is already
   applied).
3. **`paymongo-webhook` redeploy must use `--no-verify-jwt`** — PayMongo deliveries carry no
   `Authorization` header, so a plain `supabase functions deploy` (which resets `verify_jwt`
   to `true`) makes every delivery 401 and PayMongo retries until exhausted. The original
   function was deployed with `--no-verify-jwt`; any redeploy must repeat the flag:
   `supabase functions deploy paymongo-webhook --project-ref ezxirkpgfpripjydcqnt --use-api --no-verify-jwt`.
   Check with `GET https://api.supabase.com/v1/projects/<ref>/functions/paymongo-webhook`
   (`verify_jwt` must be `false`). Verify the function-level signature check still rejects
   unsigned probes (`{"error":"Invalid signature."} HTTP 401`).
4. **Test wallet needs sandbox balance** — `batch_transfers` validation fails with
   `transfer_validator.source_account_balance: insufficient` when the test wallet is
   unfunded. Top up from the PayMongo dashboard (Money Movement → Wallets, test toggle).
   There is no self-service "add test funds" API/button: sandbox balance comes from test
   payments settling into the wallet, or from PayMongo support crediting it.
5. **Rail type not captured on Payment-resource events** — PayMongo nests the rail at
   `attributes.source.type` on Payment resources (session `payments[]` entries use
   `attributes.type`), so the first GCash checkout captured `paymongo_payment_id` but left
   `paymongo_payment_method_type` null (and generated `is_refundable` null with it).
   Webhook v15 reads both shapes and backfills a null type on later events; the E2E row
   was backfilled manually to `gcash` because its events predated the fix.

## Test-mode wallet (resolved)

PayMongo support provisioned the test wallet for org `org_TuSWCTBaZ5mDp1echV2XAfwv`
(`wallet_be9dd57147e5bb160edb18cc`, status `activated`). Balance check:

```bash
curl -L "https://api.paymongo.com/v2/wallets?fields=account&fields=balance" -u sk_test_<FULL_TEST_KEY>:
```

(`fields` values must be separate query params — comma-joining silently drops them.)

### Path B — mock-mode pipeline validation (done ✅)

Mock mode is automatic: when the `PAYMONGO_SECRET_KEY` edge secret is absent, functions
complete payouts directly with a `trn_mock_<payout_id>` transfer id and skip the PayMongo
call entirely.

Steps performed:

1. **Supabase → Edge Functions → Secrets → remove `PAYMONGO_SECRET_KEY`** (keep
   `PAYMONGO_WEBHOOK_SECRET` so webhook signatures still validate for refund events).
2. **Wallet secrets set:** `APT_WALLET_ACCOUNT_NUMBER` / `APT_WALLET_ACCOUNT_NAME` (live wallet).
3. **Destination seeded** (service role bypasses the verified-gate policy):

   ```sql
   insert into public.payout_destination (user_id, type, bic, account_number, account_name, is_default, status)
   select u.id, 'gcash', 'BNORPHMM', '999999990001', 'TEST RECIPIENT', true, 'active'
   from public.users u
   where u.id = '6e06ac91-ebf8-4516-b4ac-e0bd5015d86a'
     and u.role = 'landlord';
   ```

   E2E landlord: `6e06ac91-ebf8-4516-b4ac-e0bd5015d86a` (`lorenzowilliam0721@gmail.com`).
   The RPC does **not** require `account_status = 'verified'` — that gate is only on the
   user-facing destination INSERT/UPDATE policies, which we bypass via service role.

4. **Synthetic payment inserted** (mock checkout creates no payment row, so a `paid`
   payment was seeded directly): `642d9e06-1240-4f7a-bad9-31019b217555` (₱30,000, gcash,
   `payout_eligible_at = now()`, landlord `6e06ac91-…`).
5. **Trigger a run** (service role key from vault):

   ```bash
   curl -X POST \
     -H "Authorization: Bearer <service_role_jwt>" \
     https://ezxirkpgfpripjydcqnt.supabase.co/functions/v1/process-payouts
   ```

   Get the JWT: `select decrypted_secret from vault.decrypted_secrets where name = 'PAYOUT_SERVICE_ROLE_KEY';`
   or use `SUPABASE_SERVICE_ROLE_KEY` from the dashboard.

6. **Verified** (mock run, no webhook involved):

   ```sql
   select * from payout_run order by started_at desc limit 3;
   select p.reference_number, p.status, p.paymongo_transfer_id, p.amount, p.net_amount
     from payout p where p.user_id = '6e06ac91-ebf8-4516-b4ac-e0bd5015d86a' order by p.created_at desc limit 5;
   select id, status, payout_attempts, payout_id from payment
     where landlord_id = '6e06ac91-ebf8-4516-b4ac-e0bd5015d86a' order by created_at desc limit 10;
   ```

   Result: run `126647be-…` → `landlords_processed 1, payouts_created 1, failures []`;
   payout `db1e8bde-df08-46d8-a334-507579c66d55` `completed` with
   `paymongo_transfer_id = trn_mock_db1e8bde-…`, `net_amount 29990`, reference
   `APT-PO-6e06ac91ebf84516b4ace0bd5015d86a-20260801-1`; payment claimed (`payout_id` set,
   `payout_attempts 1`). Re-trigger → `0 / 0` (idempotent).

7. **Restore real mode:** re-add the `PAYMONGO_SECRET_KEY` secret (test key). The seeded
   payment is already claimed — for the real run either make a fresh online payment or
   reset the seed (`update payment set payout_id = null, payout_attempts = 0 where id = '642d9e06-…'; delete from payout where id = 'db1e8bde-…';`).

## Real-mode E2E results (2026-08-20/21)

All legs passed against the PayMongo test environment. Sequence notes for reproduction:

1. **Seed**: synthetic `paid` payment on the E2E landlord (deleted after the run — it was
   blocking the tenant's Irene's Housing August period in the app). Resize the amount to
   fit the sandbox wallet balance before triggering.
2. **Success leg** — trigger `process-payouts` → payout `processing` with real
   `batch_tr_…`/`tr_…` ids → simulator settles `999999990001` →
   `transfer.outward.successful` webhook → `completed` within seconds. Re-trigger → 0/0.
3. **Failed leg** — point the destination at `999999990002` → payout `failed` with the
   provider message, payments requeued, destination left active. Restore `999999990001`
   afterwards; the next cron run completes the requeued payment automatically.
4. **Refund leg** — fresh GCash hosted-checkout payment on device (the synthetic seed has
   no `paymongo_payment_id` and is not refundable) → tenant taps Request Refund on the
   payment detail page → full-amount refund settles to `succeeded` via `payment.refund.*`
   in seconds; notification fires from `notify_refund_status_changed`.
5. **Cleanup**: delete the synthetic payment row; keep payouts/refunds as E2E evidence.
   The seeded destination (`999999990001`) must be deleted before any real go-live.

Gotchas hit along the way are in "Fixes discovered" above — redeploys of
`paymongo-webhook` MUST repeat `--no-verify-jwt`, and the test wallet must hold
amount + ₱10 fee before a run.

## Webhook event names (confirmed against live deliveries)

- `transfer.outward.successful` / `transfer.outward.failed` — resource is a
  `wallet_transaction`; match on its `transfer_id` attribute (falls back to resource id),
  failure reason from `provider_error`. There is **no** `transfer.outward.returned` event;
  that branch was removed from the handler.
- `payment.refund.updated` / `payment.refunded` — resource is the refund itself
  (`ref_…`), so `resourceId` matches `refund.paymongo_refund_id` directly; status comes
  from the resource (`payment.refunded` is terminal success). The old `refund.*` names are
  not in the dashboard catalog.

## Ship steps (later, not pushed yet)

- Run `pnpm --filter mobile lint` + `pnpm --filter mobile exec jest --runInBand`; confirm tsc
  diffs are only pre-existing errors.
- `graphify update .`
- Commit on `feature/payment-function`; decide whether to include the unrelated local edits to
  `apps/mobile/app/(tabs)/(landlord)/dashboard.tsx` and `units.tsx`.
- Merge `main`, open PR (CI = expo lint + jest).