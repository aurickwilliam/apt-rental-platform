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
- Refunds, recurring/billing, payment verification — future edge function actions