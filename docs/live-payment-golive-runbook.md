# Live Payment Go-Live & ₱1 Real-Money Test Runbook

Operational companion to `payment-paymongo-plan.md` and `payout-e2e-checklist.md`.
Goal: take rent payments from PayMongo **test mode** to **live mode**, then prove the
full tenant → landlord money movement with a real ₱1 GCash payment.

Current state at time of writing:

- All E2E legs passed against the PayMongo **test** environment (see
  `payout-e2e-checklist.md`). "Real mode active" there means real API calls with a
  **test key** (`sk_test_…`) — no real money has moved yet.
- Edge functions deployed: `paymongo` v7 · `paymongo-webhook` v15 · `process-payouts` v7
  (project `ezxirkpgfpripjydcqnt`; webhook must keep `verify_jwt=false`).
- Live keys + live wallet: merchant verification done, `sk_live_…` available.

---

## Phase 1 — Close gaps before go-live

### 1. Landlord "Mark as Paid" E2E (cash leg)

Code already exists; this is a device verification pass.

- Flip path: `updateLandlordPaymentStatus`
  (`apps/mobile/service/landlord/landlordService.ts`) — RLS-gated, only flips
  `method='cash' AND status='pending'` rows. The webhook owns e-wallet/card rows.
- Steps:
  1. Tenant device: Payment → **Cash** method → any amount (e.g. ₱500) → submit.
     Row lands as `pending`.
  2. Landlord device: notification arrives → manage-apartment → payment history →
     **Mark as Paid**.
  3. Verify: row flips to `paid`, tenant receives the "Payment Successful"
     notification, landlord self-notification skipped (`auth.uid()` guard).
- Record results in `payout-e2e-checklist.md`.

### 2. Ship the branch

- Include the pending cosmetic edits (`(tabs)/(landlord)/dashboard.tsx`,
  `units.tsx` — header color + label font polish, consistent with sibling tab
  screens) as their own commit.
- Gates: `pnpm --filter mobile lint`, `pnpm --filter mobile exec jest --runInBand`,
  `graphify update .`.
- `git merge main` on `feature/payment-function`, push, open PR (CI = expo lint +
  jest), merge when green.

---

## Phase 2 — Go-live switch (one-time)

> Webhook endpoints are **mode-bound**: an endpoint registered while the dashboard
> is in Test mode receives zero live events. The existing endpoint only serves
> test mode — register a fresh one in Live mode.

1. **Swap the secret key**
   ```bash
   supabase secrets set PAYMONGO_SECRET_KEY=sk_live_… --project-ref ezxirkpgfpripjydcqnt
   ```
   Mock mode dies automatically once this is set (functions branch on its presence).

2. **Register the Live-mode webhook**
   - PayMongo dashboard → toggle to **Live** → Developers → Webhooks → Add:
     - URL: `https://ezxirkpgfpripjydcqnt.supabase.co/functions/v1/paymongo-webhook`
     - Events: `checkout_session.payment.paid`, `payment.paid`,
       `transfer.outward.successful`, `transfer.outward.failed`,
       `payment.refund.updated`, `payment.refunded`
   - Copy the live webhook secret:
     ```bash
     supabase secrets set PAYMONGO_WEBHOOK_SECRET=whsec_live_… --project-ref ezxirkpgfpripjydcqnt
     ```

3. **Verify the deploy flags**
   ```bash
   curl -s https://api.supabase.com/v1/projects/ezxirkpgfpripjydcqnt/functions/paymongo-webhook \
     -H "Authorization: Bearer <SUPABASE_ACCESS_TOKEN>" | jq .verify_jwt   # must be false
   ```
   If it ever gets redeployed: `supabase functions deploy paymongo-webhook
   --project-ref ezxirkpgfpripjydcqnt --use-api --no-verify-jwt`.

4. **DB cleanup / payout destination (SQL, service role)**
   ```sql
   -- remove the sandbox simulator destination from the E2E
   delete from public.payout_destination where account_number = '999999990001';

   -- confirm APT's live destination: PayMongo Wallet, active + default
   select type, bic, account_number, account_name, is_default, status
   from public.payout_destination where user_id = '<APT user id>';
   ```

5. **Prep the ₱1 test tenancy** — checkout always bills the *full remaining
   balance* for the period, so make the balance exactly ₱1:
   ```sql
   update public.tenancies set monthly_rent = 1 where id = '<test tenancy id>';
   ```
   PayMongo minimums allow this: e-wallets/cards min ₱1.00 (100 centavos).

---

## Phase 3 — ₱1 real-money test legs

### Leg A — Tenant pays ₱1 via GCash

1. Tenant device: Payment → amount shows ₱1 → GCash → authorize in the GCash app
   → deep-link return → success receipt renders.
2. Verify settlement:
   ```sql
   select reference_id, status, amount, method, paymongo_session_id,
          paymongo_payment_id, paymongo_payment_method_type, payout_eligible_at
   from public.payment order by created_at desc limit 3;
   -- expect: status 'paid', rail captured ('gcash'), payout_eligible_at ≈ now() + 2d
   ```
3. Both parties receive notifications (DB trigger via `create_notification()`).

### Leg B — Landlord gets paid

- E-wallet funds clear into APT's PayMongo Wallet in ~2 banking days
  (`payout_eligible_at`). The 18:00 UTC cron then aggregates and transfers.
- To trigger immediately instead of waiting:
  ```bash
  curl -X POST -H "Authorization: Bearer <service_role_jwt>" \
    https://ezxirkpgfpripjydcqnt.supabase.co/functions/v1/process-payouts
  ```
  (JWT from vault `PAYOUT_SERVICE_ROLE_KEY`.)
- Expect: payout row `processing` with real `batch_tr_…`/`tr_…` ids →
  `transfer.outward.successful` webhook → `completed`. Note the ₱10 transfer fee
  exceeds ₱1 — fine for the test, but don't read net_amount as a fee benchmark.

### Leg C — Refund (optional, ends at zero)

Tenant: payment detail → Request Refund → expect `refund.updated` /
`payment.refunded` to settle `succeeded` in seconds and notify.

### Cleanup

```sql
update public.tenancies set monthly_rent = <original> where id = '<test tenancy id>';
```

Keep the payment/payout/refund rows as live-mode evidence; log outcomes in
`payout-e2e-checklist.md`.

---

## Fee reality check (live)

| Rail | Fee |
|---|---|
| GCash / Maya | ~2.5% per transaction |
| Cards | ~3.5% + ₱15 |
| Payout transfer | ₱10 per payout run |

Micro-payments are fee-inefficient — relevant to the future partial-payments
feature (consider a floor, e.g. ₱100+).

## Deferred follow-up

Partial payments: DB already has a `partial` status and per-period accumulation
(`paidAmountForPeriod` sums all `paid` rows), but online methods force the full
remaining balance and nothing sets `partial` today. Planned separately after
go-live: editable online amount (min ≥ fee-aware floor, max remaining balance),
flip to `partial` when `0 < paid < rent`, `paid` at ≥ rent.
