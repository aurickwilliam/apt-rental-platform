# PayMongo Go-Live Plan (Mobile-first)

**Status:** In progress — Parts 1–3 complete (2026-08-19); Part 4 deferred; Part 5 mostly complete (landlord payment-history screen built, device E2E of cash flip pending)
**Owner:** APT engineering
**Scope:** Production PayMongo payments for rent (GCash, Maya, card, cash) on mobile; web flow and saved payment methods explicitly out of scope (follow-ups)

## Current state summary

- Frontend: complete UX flow (checkout, e-wallet redirect with backend-verified status, success receipt) but hardcoded `apartmentDetails`, 4 persistence TODOs, mock payment history + saved methods
- Edge function: contract defined, mock-only — real PayMongo calls throw when `PAYMONGO_SECRET_KEY` is set; no webhook; session map in-memory
- DB: `payment` table exists (no repo migration); `notify_payment_created` trigger + deep links built; `useTenancy()` provides all real data needed

## Decisions (locked)

1. Plan file: `docs/payment-paymongo-plan.md`
2. Payment rows: **pending row created upfront** at checkout start (reference_id + session/intent id); webhook flips to `paid`. Silent for notifications (trigger fires only on `paid`); idempotency + crash recovery via persisted mapping
3. Saved payment methods: **deferred** — mock UI stays; follow-up plan (PayMongo saved-method support is weak, adds PCI scope)

## Part 1 — DB schema (foundation) ✅ DONE (2026-08-19)

- Migration `supabase/migrations/20260810000000_payment_paymongo_columns.sql` (applied to `ezxirkpgfpripjydcqnt`):
  - `ALTER TABLE payment ADD COLUMN IF NOT EXISTS`: `reference_id`, `paymongo_session_id`, `paymongo_intent_id`; `method` normalized to `gcash|maya|card|cash` (CHECK); `status` → `pending|paid|partial|unpaid` (CHECK), default `'pending'` (was `'not paid'`)
  - Legacy `reference_no` (bigint, NOT NULL, no default) made nullable — it would have blocked every insert; superseded by `reference_id`
  - `CREATE TABLE IF NOT EXISTS payment` canonical fallback for fresh DBs; index `payment_reference_id_idx` on `reference_id`
  - RLS tightened: dropped `tenant_update_own_payments` (tenants could flip their own status to `paid`). Tenants keep select + insert; landlords keep select + update-status; paid flips only via service_role (webhook/edge function)
  - **Verified:** advisors clean of new findings; functional RLS test — tenant insert OK, tenant status-flip blocked (0 rows), service_role flip OK, `notify_payment_created` fired tenant + landlord notifications on pending → paid (test data cleaned up)

## Part 2 — Edge functions: real PayMongo ✅ DONE (2026-08-19)

- `supabase/functions/paymongo/index.ts`:
  - `createCheckoutSession` → `POST /v2/checkout_sessions` (v2 defers intent creation; **create is v2 but retrieve is v1** — `/v1/checkout_sessions/{id}`, the session only reports active/expired, outcome derived from embedded intent/payments); insert `payment` row (`status=pending`, `reference_id`, session id) before responding; mock path retained while secret unset
  - `getCheckoutSessionStatus` → v1 session lookup; resolves non-`cs_` ids (deep-link reference id) through the persisted row
  - `createCardPayment` → `/v1/payment_methods` (**`/v1/tokens` is deprecated — `endpoint_deprecated`**) → `payment_intents` → attach → confirm; `awaiting_next_action` (3DS) returns a clear "not supported yet" error, nothing recorded
  - `payment_method_types` value for Maya is **`paymaya`** (not `maya` — the hosted page rejects `maya`)
- New `supabase/functions/paymongo-webhook/index.ts`: verify `PAYMONGO_WEBHOOK_SECRET` signature (`Paymongo-Signature` `t`/`te`/`li`, HMAC-SHA256 over `t.<rawBody>`, timing-safe, 300s replay window, fail closed); events **`checkout_session.payment.paid`** + **`payment.paid`** (`payment_intent.succeeded` is NOT in the dashboard catalog); idempotent flip to `paid` → fires existing notification trigger
- Deployed with **`--no-verify-jwt`** (`verify_jwt=false` — PayMongo sends no JWT; HMAC is the auth)
- Secrets: `PAYMONGO_SECRET_KEY`, `PAYMONGO_WEBHOOK_SECRET` (test-mode endpoint secret)
- **⚠ Webhook endpoints are mode-bound**: an endpoint registered while the dashboard is in Live mode receives zero test events (hit this live). Register the test endpoint in **Test mode**; at go-live, swap to the Live endpoint + its secret
- Test cards (current docs): success `4343434343434345`, `4571736000000075`, `5123000000000002`; 3DS-required `4120000000000007`; declines `4200000000000018` (expired), `4300000000000017` (CVC), `5100000000000198` (insufficient funds), `4111111111111111` (generic — in practice triggers 3DS); e-wallet range ₱1.00–₱100,000.00
- **Gate passed:** test-key E2E — GCash sandbox paid via hosted checkout, webhook flipped row to `paid`, tenant + landlord notifications fired; declined card surfaced PayMongo's reason; mock mode intact (e2e rows cleaned up)

## Part 3 — Frontend data wiring (mobile) ✅ DONE (2026-08-19)

- `service/payments/paymentService.ts` (new): `fetchPayments(tenancyId)` / `fetchPaymentById` / `fetchPaymentByReferenceId` (embed apartment + landlord names for the receipt) / `createCashPayment` (client insert, `status='pending'` — the tenant has paid in cash, awaiting landlord confirmation; landlord flips to `paid`; RLS-governed); pure helpers `formatReferenceId` (`pay_…` → `APT-…` display format), `methodLabel`, `paymentStatusLabel`, `paidAmountForPeriod`, `periodMonthLabel` — unit-tested
- Hooks `usePayments` / `usePayment` / `usePaymentByReference` (React Query; the success screen polls while the webhook is still flipping the row)
- `payment/index.tsx`: real data via `useTenancy()` (apartment, address, landlord, lease, rent); period from the tenancy's current payment (fallback: current calendar month, due 5th); due = rent − paid-in-period; e-wallet + card flows pass `tenancyId`/period fields (edge function already persisted them); **cash flow inserts its own row**; all flows route to success with `?referenceId=`
- `e-wallet-redirect.tsx`: accepts `referenceId`; deep-link return now matches the reference id (warm-start auto-verify works); on `paid` routes to success with the reference (the 4 persistence TODOs are resolved server-side by design)
- `success.tsx` + `history/` (list + `[paymentId]`): receipts and history render from real `payment` rows; `mockPaymentHistory.ts` deleted; `PAYMENT_STATUS` gained **`Pending`** (constants + chip style + receipt meta)
- **Gate passed:** jest 35 suites / 226 tests (23 new) + `pnpm --filter mobile lint` clean on touched files

## Part 4 — Saved payment methods: **deferred**

- Mock UI stays; follow-up plan recorded. Cleanup note: dedupe `saved-methods/e-wallet-redirect.tsx` vs `e-wallet-redirect.tsx`

## Part 5 — Verification & parity

- **Landlord payment-history screen built** (was missing): `app/landlord/manage-apartment/[apartmentId]/payment-history.tsx` lists all payment statuses per apartment (year-grouped), with **Mark as Paid** on pending cash rows (ConfirmDialog → status-only update, guarded to `method=cash AND status=pending` server-side; RLS `landlord_update_payment_status` + status column grant). Fixes the "See All" 404 (`manage-apartment` dashboard) and the landlord payment notification deep link. Service: `fetchLandlordPayments` / `updateLandlordPaymentStatus` in `landlordService.ts` + `useLandlordPayments` / `useLandlordPaymentConfirmation` hooks (optimistic, exact-key invalidate)
- Landlord dashboard preview (`fetchLandlordTenancy`) still shows paid/partial only — by design
- Web `PaymentModal` TODO recorded as out-of-scope follow-up
- `graphify update .`; docs updated only if conventions change

## Part 5 E2E status (device, 2026-08-19)

- ✅ GCash sandbox paid via hosted checkout; "Return to Merchant" deep link → success receipt; webhook flipped row `pending → paid` (~49s); tenant + landlord notifications fired with `paymentId` + `apartmentId`
- ✅ Card `4343 4343 4343 4345` success — synchronous flip (`created_at == updated_at`), instant receipt + toast
- ✅ Card `5100 0000 0000 0198` decline — PayMongo reason surfaced in error dialog, no row created
- ✅ Cash flow — row created `pending` (was `unpaid`; semantic change: tenant paid but awaiting landlord confirmation), receipt shows **Pending**
- ⏳ Landlord flip E2E pending: landlord notification → payment-history screen → Mark as Paid → row `paid`, tenant "Payment Successful" notification fires (landlord self-skipped via `auth.uid()`)

## Part 6 — Payouts (landlord disbursement) & refunds (tenant) 🚧 IN PROGRESS

**Status:** Planned + schema/edge-function pass (2026-08-20). Landlord destination-management UI, payout history screens, and landlord balance dashboard are follow-ups (explicitly out of scope here).

**Decisions (locked):**
1. Tenant payout = **refund to the original payment method** via PayMongo `/v1/refunds`. Cash/OTC payments are refunded manually (offline) — never via the API.
2. Landlord payout = **automated scheduled disbursement** from APT's PayMongo Wallet to the landlord's bank (instapay/pesonet) or GCash/Maya via `POST /v2/batch_transfers`.
3. **No platform commission.** Landlord receives full rent; PayMongo per-payment processing fees are taken at settlement; the ₱10 transfer fee (config) is recorded and deducted.
4. Destinations: bank + GCash/Maya; adding/changing a destination requires `users.account_status = 'verified'`; every add/change fires a "Payout Destination Changed" fraud-tripwire notification.
5. Refund initiator: **tenant only** (owner of the payment). Landlord-initiated refunds (e.g. deposit refunds) are a follow-up.
6. Failed-transfer requeue policy: **auto-retry with a 3-attempt cap** → payments past the cap surface as the manual admin-review queue (failed payout rows + `payout_run.failures`). `returned` transfers (bad/closed destination) do **not** auto-retry: the destination is deactivated and payments wait for a healthy one.

### Money flow

- Paid card/e-wallet rent clears into APT's PayMongo Wallet (card 3 banking days, e-wallet 2 — `payout_eligible_at` set by the `payment_set_payout_eligible_at` trigger on paid flips). **Owner action:** APT's PayMongo payout destination must be the PayMongo Wallet (min ₱1) so funds accumulate for disbursement.
- **Landlord payout:** pg_cron (daily 02:00 Asia/Manila) → `process-payouts` edge function (service-role JWT from vault secret) → per landlord (own try/catch, logged to `payout_run.failures`): active default destination → RPC `create_payout_and_claim` (atomic claim, see below) → `POST /v2/batch_transfers` (instapay ≤ ₱50,000, pesonet above) → payout `processing` → webhook settles `completed` / `failed` (requeue) / `returned` (deactivate destination + requeue).
- **Tenant refund:** tenant requests on a paid, refundable payment → `createRefund` edge action (server-side eligibility + typed errors) inserts `refund` row `pending` → `POST /v1/refunds` → `processing` with `paymongo_refund_id` → webhook `refund.updated` settles `succeeded`/`failed` + notifies.

### FIX 1 — Refund eligibility (design-review)

- `payment.paymongo_payment_id` + `payment.paymongo_payment_method_type` captured from the webhook (`payment.paid` resource, or `payments[]` inside `checkout_session.payment.paid`) and from `getCheckoutSessionStatus` as a resilience net (never clobbers a captured value).
- Generated column `is_refundable` = `method IN ('card','gcash','maya') AND paymongo_payment_id IS NOT NULL AND paymongo_payment_method_type IN ('card','gcash','paymaya')` — **allowlist**, so Maya QR Ph (`qrph`), direct online banking (`dob`) and OTC rails are never refundable via the API.
- `createRefund` rejects server-side with typed errors (`REFUND_NOT_SUPPORTED`, `PAYMENT_NOT_FOUND`, `PAYMENT_NOT_OWNED`, `PAYMENT_NOT_PAID`, `REFUND_INVALID_AMOUNT`, `REFUND_EXCEEDS_AMOUNT`, `REFUND_ALREADY_PENDING`) — never raw PayMongo 4xx.
- **Double-refund race** closed by `one_active_refund_per_payment` partial unique index on `refund(payment_id) WHERE status IN ('pending','processing')`; the losing INSERT (SQLSTATE 23505) maps to `REFUND_ALREADY_PENDING`.
- Mobile: "Request Refund" only on `is_refundable && status='paid'`; otherwise a short explanatory message (cash/QR/OTC refunded manually).

### FIX 2 — Atomic payout aggregation (design-review)

- RPC `create_payout_and_claim(p_landlord_id, p_destination_id, p_period_start, p_period_end, p_max_attempts)` (SECURITY DEFINER) — **one transaction**: validate destination (active + owned) → read `payout_config` → insert `payout` (`pending`) → `UPDATE payment SET payout_id = <new> WHERE landlord_id = … AND status='paid' AND payout_id IS NULL AND payout_eligible_at <= now() AND payout_attempts < cap AND method IN ('gcash','maya','card') RETURNING sum(amount)` → below min amount / zero rows → roll the claim back (payout deleted, payments unclaimed) → finalize amount/net + bump `payout_attempts`. Two overlapping `process-payouts` runs can never claim the same payments (row locks + `payout_id IS NULL` re-check).
- `payment.landlord_id` denormalized (backfilled from `apartments`) so the claim is single-table; partial index `(landlord_id, payout_eligible_at) WHERE status='paid' AND payout_id IS NULL`.
- `payout.reference_number` = `APT-PO-{landlord_id no dashes}-{YYYYMMDD period}-{attempt}` — deterministic prefix for traceability but **changes per attempt** (fresh reference to PayMongo each retry, per PayMongo's guidance). `payout.attempt` is derived inside the RPC as `1 + max(attempt) for (landlord, period)`. Deliberately **not unique-constrained** (a concurrent losing run may compute the same value; its row is rolled back). PayMongo does **not** dedupe `batch_transfers` — the reference goes in the transfer `description` for cross-referencing; it is our identifier, not PayMongo's.

### FIX 3 — Payout status semantics (design-review)

- `payout.status`: `pending → processing → completed | failed | returned`. `processing` = submitted to PayMongo, **awaiting rail settlement** — never treated as delivered. PESONet clears on PayMongo's 11:00/14:00/17:00 Manila cycles, so a 02:00 submission lands later the same banking day.
- Landlord copy avoids instant-delivery claims: "Payout Sent — typically arrives the same banking day" (processing), "Payout Successful" (completed), "Payout Failed — will retry automatically" (failed), "Payout Returned — destination deactivated; add a new one" (returned).
- `returned` handling (real InstaPay/PESONet failure mode — funds bounced back): payout `returned`, **destination deactivated** (`payout_destination.status='inactive'`), payments requeued — but `process-payouts` only claims landlords with an active default destination, so attempts are not burned on a broken destination. `transfer.outward.returned` event name not confirmed in PayMongo's catalog — handled defensively (also detectable via `getTransferStatus` poll); verify against the dashboard event list at go-live.

### Schema (migration `20260820000000_payouts_refunds.sql`)

- `payment` +: `paymongo_payment_id`, `paymongo_payment_method_type`, `landlord_id` (FK `users.id`, backfilled), `payout_eligible_at` (trigger `payment_set_payout_eligible_at` sets on paid flips: card +3d, e-wallet +2d), `payout_id` (FK `payout`), `payout_attempts int default 0`, generated `is_refundable`.
- `payout_destination`: `user_id → users.id`, `type bank|gcash|maya`, `bic` (provider code from PayMongo receiving institutions), `account_number`, `account_name`, `is_default`, `status active|inactive`. RLS: users manage own rows; INSERT/UPDATE `WITH CHECK` requires `account_status='verified'`. Trigger fires the fraud-tripwire notification.
- `payout`: `user_id`, `destination_id`, `amount`, `fee`, `net_amount`, `status pending|processing|completed|failed|returned`, `reference_number`, `attempt`, `period_start/end`, `paymongo_batch_id`, `paymongo_transfer_id`, `failure_reason`, `completed_at`. RLS: landlord reads own; **all writes service_role-only**.
- `refund`: `payment_id`, `user_id`, `amount`, `reason duplicate|fraudulent|requested_by_customer|others`, `status pending|processing|succeeded|failed`, `paymongo_refund_id`, `failure_reason`, `created_by`, `completed_at` + partial unique index (FIX 1). RLS: tenant reads own; **all writes service_role-only**.
- `payout_run`: `started_at`, `finished_at`, `landlords_processed`, `payouts_created`, `failures jsonb` (one landlord's failure never swallows the run). service_role-only.
- `payout_config`: single row (`id=1`) `transfer_fee` (default ₱10 — config value, not a literal), `min_payout_amount` (default ₱100). service_role-only.
- Triggers: `payment_set_payout_eligible_at` (BEFORE insert/update on paid), `notify_payout_status_changed`, `notify_refund_status_changed`, `notify_payout_destination_changed` (all via `create_notification`, type `payment`).
- pg_cron: `create extension if not exists pg_cron` + `cron.schedule_in_timezone('Asia/Manila', 'process-payouts', '0 2 * * *', net.http_post → process-payouts with vault secret PAYOUT_SERVICE_ROLE_KEY)`.

### Edge functions

- `paymongo/index.ts` +: `createRefund` (eligibility + typed errors + mock branch: refs ending `-fail` → failed), `getTransferStatus` (`GET /v2/transfers/{id}` fallback poll; event name/status values verified at go-live); `getCheckoutSessionStatus` captures payment id + rail; `recordPayment` stores `landlord_id` (tenancy join); `resolveTenancy` returns `landlord_id`.
- `paymongo-webhook/index.ts` +: `parseEvent` extracts `paymentId`/`paymentMethodType`/`errorMessage`; `checkout_session.payment.paid` + `payment.paid` capture rail + flip paid (idempotent, pending/unpaid only); **`transfer.outward.successful` → completed, `transfer.outward.failed` → failed + requeue (`payout_id = NULL`), `transfer.outward.returned` → returned + requeue + deactivate destination**; `refund.updated` (+ granular `refund.succeeded|failed|pending`) → settle refund, never downgrade a completed row.
- `process-payouts/index.ts` (new, `verify_jwt=true`): service-role JWT check → `payout_run` row → per-landlord try/catch → RPC claim → `batch_transfers` (env: `APT_WALLET_ACCOUNT_NUMBER`, `APT_WALLET_ACCOUNT_NAME`, `PAYMONGO_SECRET_KEY`; source bic `PAEYPHM2XXX`; `provider` instapay ≤₱50k / pesonet above) → payout `processing` with transfer id. Manual single-landlord mode via `{"landlordId": "…"}`.

### Mobile (tenant)

- `service/payments/paymentService.ts`: `PaymentRecord.is_refundable`, `fetchRefundsForPayment` (refund status on the receipt).
- `service/payments/paymongoService.ts`: `PaymongoError.code` (typed-error mapping), `requestRefund`.
- `hooks/payments/usePayments.ts`: `useRequestRefund` mutation (invalidates payment + refund queries), `useRefundForPayment`.
- `app/tenant/payment/history/[paymentId].tsx`: "Request Refund" button only when refundable + paid (ConfirmDialog → mutation); explanatory message otherwise; refund status line (Refunded / Refund in progress / Refund failed) on the receipt.

### Owner actions

1. Set APT PayMongo payout destination to the **PayMongo Wallet** (min ₱1) so funds accumulate for disbursement.
2. Grab the wallet account number + name (batch `source_account`) → `supabase secrets set APT_WALLET_ACCOUNT_NUMBER=… APT_WALLET_ACCOUNT_NAME=…`.
3. Store the service role key for the cron job: `select vault.create_secret('<service_role>', 'PAYOUT_SERVICE_ROLE_KEY')`.
4. Register webhook events: `transfer.outward.successful`, `transfer.outward.failed` (+ verify whether `transfer.outward.returned` exists in the catalog), `refund.updated`.
5. Test-mode: fund the test wallet, add a test bank/GCash destination (SQL/service role), run `process-payouts` manually (single landlord), verify claim atomicity (double invocation), refund a GCash sandbox payment (succeeds) vs a `qrph`-typed row (typed `REFUND_NOT_SUPPORTED`).

### Out of scope (Part 6 follow-ups)

- Landlord payout-destination management UI (bank picker via `listReceivingInstitutions` — action not built this pass), payout history screen, landlord balance dashboard
- Landlord-initiated refunds (deposit refund at lease end)
- Web payout/refund parity
- Partial-amount refund selection (client always refunds the full amount)

## Owner action items (only you can do these)

**Before Part 1:** ✅ Done — DB access granted (MCP works against project `ezxirkpgfpripjydcqnt`)

**During Part 2 (start now — verification takes days):**
1. Create PayMongo account + complete merchant verification (SEC/DTI cert, valid IDs, business docs)
2. Get test keys (`sk_test_...`), live keys (`sk_live_...`) after approval
3. Set secrets (I can run `supabase secrets set PAYMONGO_SECRET_KEY=... PAYMONGO_WEBHOOK_SECRET=...` with values you paste — never committed to repo)
4. Register webhook in PayMongo dashboard → `https://ezxirkpgfpripjydcqnt.supabase.co/functions/v1/paymongo-webhook`; subscribe `checkout_session.paid` + `payment_intent.succeeded`; copy webhook secret for step 3

**During Part 3:** ✅ Device E2E is the remaining owner action — Expo device with real test data: GCash sandbox (incl. "Return to Merchant" deep-link return, app open + cold start), card `4343 4343 4343 4345` success, `5100 0000 0000 0198` decline, cash flow + landlord flip, history + filters

**After implementation:** Review + merge PR (I work on a feature branch; `main` is protected, `ci` must pass) · one live ₱1 payment to verify webhook→notification→landlord dashboard loop · switch to `sk_live_...` and re-deploy

## Verification commands

```bash
supabase db push                                  # Part 1
supabase functions deploy paymongo paymongo-webhook  # Part 2
pnpm --filter mobile test && pnpm --filter mobile lint  # Part 3
```

## Out of scope (documented follow-ups)

- Web payment flow (my-rental `PaymentModal` TODO)
- Saved payment methods (Part 4)
- Recurring/billing — future edge function actions (refunds now live in Part 6)