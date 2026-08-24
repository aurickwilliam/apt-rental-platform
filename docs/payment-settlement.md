# Payment Settlement & Payouts — Reference Guide

How rent money physically moves from a tenant's payment to the landlord's GCash,
what delays exist at each hop, and how to make payouts faster. Operational
companion to `payment-paymongo-plan.md` (build decisions) — this file covers the
**money-movement runtime** on project `ezxirkpgfpripjydcqnt`.

---

## 1. Money flow

```
Tenant GCash / Maya / QR Ph / Card
        │  (payment marked "paid" instantly)
        ▼
PayMongo clearing hold          ← funds NOT usable yet (processor's own window)
        │  available_at  ≈ +2 days (QR Ph / e-wallets), +3 days (cards)
        ▼
APT PayMongo Wallet             ← wallet_c9b1aee850c24575f7dcddf1 (live, activated)
        │  process-payouts cron (02:00 Manila daily) or manual trigger
        │  → batch_transfers via InstaPay (≤ ₱50k) / PESONet (> ₱50k)
        ▼
Landlord payout_destination     ← default GCash (GXCHPHM2XXX) / Maya
        │  transfer.outward.successful webhook → payout 'completed'
        ▼
Landlord GCash (minutes via InstaPay)
```

Key rule: **a payout is a transfer OUT of the PayMongo wallet.** If the wallet
balance is lower than the payout net, PayMongo rejects the batch with
`transfer_validator.source_account_balance: insufficient` — and the failed run
burns one of the payment's 3 payout attempts.

## 2. Standard clearing windows (observed live, 2026-08-24)

PayMongo holds funds per rail before they count toward the wallet balance.
Verified on the real ₱20 QR Ph payment `pay_FphYQtMxEr6JZD4sMthEmnw1`:

| Field on the Payment resource | Value (Manila time) | Meaning |
|---|---|---|
| `paid_at` | Aug 24, 5:55 PM | Tenant paid |
| `available_at` | **Aug 26, 5:00 PM** | Net amount usable in wallet balance |
| `credited_at` | Aug 27, 9:00 AM | Fully settled in the ledger |

Our own DB window mirrors this so payouts never fire early:

- Trigger `payment_set_payout_eligible_at` (migration
  `20260820000000_payouts_refunds.sql`): `payout_eligible_at = now() + 2 days`
  for e-wallets/qrph, `+ 3 days` for card. This gates **our** claim query only —
  it cannot bypass PayMongo's hold.
- `process-payouts` cron: daily 18:00 UTC (02:00 Manila), claims rows with
  `status='paid' AND payout_id IS NULL AND payout_eligible_at <= now() AND
  payout_attempts < 3`.
- Net amount math: `net = sum(claimed amounts) - payout_config fee` (global
  ₱10 / min ₱100; per-apartment overrides in `payout_apartment_override`).
  PayMongo's own processing fee (e.g. 1.5% QR Ph) is deducted from the wallet
  credit **before** we ever see the balance — flat config fees only match
  exact amounts (see §4 trap).

## 3. Case study — Irene's Housing ₱20 (2026-08-24)

First live-money payout attempt and everything it exposed.

**Setup:** Irene's Housing (`56510e01-…`) has rent ₱20 and a payout override
(fee ₱0 / min ₱20) so the full amount pays out. Live keys active, live webhook
`hook_zKwr…` verified (signed probe → 200), sandbox destination deactivated,
default destination = real GCash `09196840499`.

**Timeline:**

1. Tenant paid ₱20 via QR Ph on the hosted checkout → row `pay_mt727t8a`
   flipped `paid`, rail `qrph` captured. ✅
2. Manual payout trigger **failed** — `failed to get first source account`
   → cause: edge secrets `APT_WALLET_ACCOUNT_NUMBER/NAME` still held the *test*
   wallet. Fixed by setting them to the live wallet (`407066469991` /
   `AURICK WILLIAM EBOJO LORENZO DBA APT (A Place to Thrive)`).
3. Second trigger **failed** — `source_account_balance: insufficient`. Wallet
   balance was ₱0.00 available / ₱0.00 pending: PayMongo's hold had not lifted
   (`available_at` Aug 26). Zeroing our `payout_eligible_at` bypasses our gate,
   never PayMongo's. Two payout rows left as `failed` audit history; the
   payment sat at `payout_attempts = 2` (cap 3).
4. **Protection:** tonight's 02:00 Manila cron would have burned the last
   attempt against an empty wallet, so the row was parked past settlement:
   ```sql
   update public.payment
   set payout_eligible_at = '2026-08-27 01:10:00+00'  -- past credited_at
   where reference_id = 'pay_mt727t8a';
   ```

**Resolution plan (agreed): wait for the funds, then fire manually.**

```sql
-- 1. When the wallet shows the settled balance (₱19.70 = 20 − 0.30 QR Ph fee),
--    align the override so net == available. Flat ₱0 fee would ask PayMongo for
--    ₱20 from a ₱19.70 wallet and fail by ₱0.30.
update public.payout_apartment_override set transfer_fee = 0.30
where apartment_id = '56510e01-3ea1-4aae-9801-0d8c63ab5c75';

-- 2. Release the claim gate.
update public.payment set payout_eligible_at = now()
where reference_id = 'pay_mt727t8a';
```

```bash
# 3. Trigger (service_role JWT from vault PAYOUT_SERVICE_ROLE_KEY).
curl -X POST -H "Authorization: Bearer <service_role_jwt>" \
  -H "Content-Type: application/json" \
  -d '{"landlordId":"6e06ac91-ebf8-4516-b4ac-e0bd5015d86a","apartmentId":"56510e01-3ea1-4aae-9801-0d8c63ab5c75"}' \
  https://ezxirkpgfpripjydcqnt.supabase.co/functions/v1/process-payouts
```

4. Expect `transfer.outward.successful` → payout `completed` (net ₱19.70) →
   InstaPay credit to GCash `09196840499` within minutes. Verify in the
   landlord Payouts tab and `public.payout`.

**Check wallet balance any time:**

```bash
curl -s -L -u "$PAYMONGO_SECRET_KEY:" \
  "https://api.paymongo.com/v2/wallets?fields=account&fields=balance"
```

## 4. The realtime option — PayMongo Instant Settlement

The 2-day wait is PayMongo's standard settlement schedule. They offer an
official add-on that removes it:

- **What:** successful payments land in the PayMongo Wallet **the moment they
  are paid — 24/7**, weekends and holidays included, bypassing the clearing
  window entirely.
- **Supported rails:** QR Ph, e-wallets (GCash, GrabPay, Maya) — exactly APT's
  online rails. Per-method enablement (QR Ph only, e-wallets only, or both).
- **Cost:** ~1% extra per transaction (confirm current rate with PayMongo),
  deducted before the wallet credit. Example: ₱8,000 rent → ~₱7,800 instant vs
  ₱7,880 standard two days later.
- **Activation:** email `support@paymongo.com` requesting Instant Settlement
  for the desired methods and confirming the fee rate.
- **Detection:** the Payment resource carries an `instant_settlement` field
  (`null` while the feature is off). Docs:
  `docs.paymongo.com → Money Movement → Instant Settlement`.

With Instant Settlement on, a payout can move money tenant → landlord within
minutes end-to-end (payment → wallet instantly; cron or manual trigger →
InstaPay minutes).

## 5. Operational gotchas (carried forward from the retired runbooks)

- **Webhook deploys must keep `verify_jwt=false`:**
  `supabase functions deploy paymongo-webhook --project-ref ezxirkpgfpripjydcqnt --use-api --no-verify-jwt`.
  PayMongo deliveries carry no `Authorization` header; a plain deploy makes
  every delivery 401 until retries exhaust. Check via
  `GET https://api.supabase.com/v1/projects/<ref>/functions/paymongo-webhook`.
- **Webhook endpoints are mode-bound.** An endpoint registered in Test mode
  receives zero live events. The live endpoint is
  `hook_zKwrJmGkoe1chGAJYPpXGCh8` (`livemode: true`); its signing secret must
  match the edge secret `PAYMONGO_WEBHOOK_SECRET`. Verify with a signed probe:
  HMAC-SHA256 over `"<t>.<body>"` → header `Paymongo-Signature: t=<t>,li=<hex>`
  → expect `{"received":true}`; unsigned must 401.
- **Confirmed webhook event names:** `checkout_session.payment.paid`,
  `payment.paid`, `transfer.outward.successful`, `transfer.outward.failed`,
  `payment.refund.updated`, `payment.refunded`. There is no
  `transfer.outward.returned` event.
- **Wallet secrets must match the provisioned wallet** —
  `APT_WALLET_ACCOUNT_NUMBER` / `APT_WALLET_ACCOUNT_NAME` (live:
  `407066469991`). Mismatch surfaces as `failed to get first source account`.
  The wallet's BIC is the constant `PAEYPHM2XXX` in `process-payouts`.
- **Test mode:** sandbox transfers settle only to simulator accounts
  `999999990001` (success) / `999999990002` (failure); the test wallet needed
  PayMongo support funding. The seeded sandbox destination
  (`4c413e29-…`, `TEST RECIPIENT`) is soft-disabled (`status='inactive'`) —
  hard delete is blocked by 4 historical payout rows (`ON DELETE NO ACTION`).
- **Attempt cap:** `payout_attempts` max 3 per payment; exhausted rows leave
  the automatic queue (manual review). Before forcing a payout, confirm the
  wallet balance covers the net, or park `payout_eligible_at` into the future.

## 6. Future improvements

1. **Drive eligibility from real availability** — capture `available_at` /
   `instant_settlement` from the webhook payload onto `public.payment` and set
   `payout_eligible_at` from that instead of the flat +2/+3-day window. Payouts
   then fire exactly when funds are usable, with zero failed attempts.
2. **Balance pre-check in `process-payouts`** — read `/v2/wallets` before
   submitting a batch; skip (without burning an attempt) when
   `available < net`, retry next run.
3. **Faster cadence / on-demand** — hourly cron and/or a landlord
   "Cash out now" action that triggers a scoped `process-payouts` run.
4. **Percentage-based fees** — `payout_config` / overrides use flat pesos;
   PayMongo's processing fee is proportional (1.5% QR Ph), so flat fees only
   match exact amounts (the ₱20 vs ₱19.70 trap). Model the processor fee as a
   rate, or store the payment's actual `fee`/`net_amount` from PayMongo and pay
   out the recorded net.
5. **Instant Settlement** — activate (§4) and treat standard clearing as the
   fallback for card payments.
