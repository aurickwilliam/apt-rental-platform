# Plan: Online banking ("bank transfer") rent payments

Status: proposed, not started. Nothing in this plan is implemented.

## Goal

Let a tenant pay rent from their bank account (PayMongo direct online banking), next to GCash, Maya, QRPh, card and cash, on both mobile and web.

## Scope: simulation only

This is a simulation. It runs on the PayMongo test key (`sk_test_...`) only: no real money moves, and there is no payout to landlords (see AGENTS.md "PayMongo Test-Mode Hybrid (No Disbursement)"). Nothing here should be switched to a live key. The UI should not promise real bank transfers, and the limits and fees below are PayMongo's real ones, used only to make the simulation realistic.

## Should landlords set their own payment methods and accounts?

Decision: landlords choose which methods tenants may use (Part 2 below). Landlord payout accounts stay out of scope, for the reasons here.

- There is nowhere for a landlord's account to go. Payouts to landlords were removed from the app (`payout_destination` and related tables dropped), and the plan is "no disbursement": landlord profit is just totals of the `payment` table.
- Even with real PayMongo, the tenant pays into the platform's PayMongo account, not the landlord's. A landlord's own bank account only matters when money is paid out, which this simulation doesn't do.
- Real landlord bank/e-wallet details are sensitive data (account numbers, names). Storing them needs encryption, access rules and review, which is far more than a simulation needs.

There are two sizes of landlord control; this plan includes only the first:
1. **Accepted methods (small, safe, included):** the landlord ticks which methods tenants may use (e.g. cash and GCash only). The tenant's payment screen shows only those. This stores method names only, never account numbers, like `payment_method_preferences` does for tenants.
2. **Landlord payout accounts (large, not included):** bank or wallet details per landlord plus a payout flow. This brings back the dropped payout system and has real-money, security and compliance weight.

## What PayMongo offers (checked 2026-11-02)

| Bank | PayMongo type + bank code | Limits (PHP) | Status in docs |
|---|---|---|---|
| BPI | `dob` + `bpi` | 1 to 50,000 (tenant can raise it in the BPI app) | Available |
| UnionBank | `dob` + `ubp` | 1 to 100,000 | Available |
| Land Bank | `brankas` + `landbank` | 1 to 50,000 | Available |
| BDO | `brankas` + `bdo` | 100 to 50,000 | Temporarily unavailable |
| Metrobank | `brankas` + `metrobank` | 1 to 50,000 | Temporarily unavailable |

- Fee shown by PayMongo: 0.8% or PHP 15, whichever is higher (who pays it is a product decision, see questions).
- Not refundable through the PayMongo API. Refunds are not live in the app today: the `refund`/`payout` tables and the `is_refundable` column were dropped by `20260827000000_simulation_payments_cleanup.sql` and not restored (checked on the hosted database 2026-11-02), so this plan adds no refund handling.
- PayMongo's docs describe these banks only through the Payment Intent flow (create intent, create payment method with `bank_code`, attach, redirect to `next_action.redirect.url`). I could not confirm they work as `payment_method_types` in a hosted Checkout Session. Step 0 settles this before any other work.
- Rent can exceed the limits (the ₱80,000 tenancy is above BPI's, Land Bank's and BDO's ₱50,000 cap). The app must hide or disable banks whose limit is below the amount due.

## Step 0: Spike in PayMongo test mode (no code shipped)

1. Try a Checkout Session with `payment_method_types: ['dob']` (and the bank variants) using the test key. If it works, use Option A. If PayMongo rejects it, use Option B.
2. Confirm the webhook payload shows which type the payment used (`source.type` / `attributes.type`), so `paymongo_payment_method_type` can be recorded.
3. Confirm test-mode behavior: how a test bank login and a failed/cancelled bank payment come back.

## Two ways to build it

**Option A: hosted Checkout Session (preferred if Step 0 passes).** Same flow as GCash/Maya: the function creates a session with the bank type and the app opens `checkout_url`. Least new code, same return/verify path.

**Option B: Payment Intent flow.** The app shows a bank picker, the function creates the intent and payment method, and the app opens the bank's redirect URL. More code: a new action in the function, a new return/verify path, and webhook handling for intents (the card flow already uses intents, so part of this exists).

## Work items (same for both options unless noted)

### Database (one migration, applied to hosted only after approval)
- Add `bank_transfer` (name open, see questions) to `payment_method_check` on `public.payment` (pattern: `20260824000001_payment_method_qrph.sql`).
- Add it to `payment_method_preferences` allowed values if that table has its own check (`20261016052235_add_payment_method_preferences.sql`; confirm when starting).
- No refund or payout changes (those tables do not exist today).

### Edge function `paymongo`
- Option A: add the bank to `CHECKOUT_PAYMENT_METHOD_TYPES` and the payload `method` union; reserve the payment row with the new method before calling PayMongo (already how it works).
- Option B: new `createBankPayment` action (intent, payment method with `bank_code`, attach, return redirect URL).
- Server-side amount check against the bank's limit, so the client check is only feedback.
- Update `paymongo-webhook` only if the new type's event shape differs; the generic `markPaymentPaid` path should cover it.

### Shared code
- `@repo/utils` `paymentMethodPreferences.ts`: add the method to `PAYMENT_METHOD_TYPES`, `DATABASE_METHODS` and labels, with tests.
- `@repo/constants` `paymentMethods.ts`: add `PaymentMethodKey`, chip colors, and `paymentMethodKey()` mapping.
- A small shared bank list (code, name, limits, available flag) in `@repo/constants` so web and mobile cannot drift.

### Mobile (`apps/mobile`)
- `PaymentMethodSelector` and `PaymentMethodButton`: new option plus bank picker if more than one bank; add logos to `constants/images.ts` (WebP, per app-size rules).
- Payment screen `app/tenant/payment/index.tsx`: map the method, call the new checkout, reuse the verify screen.
- `PaymentMethodChip`, `paymentService.ts` display labels, saved-methods screen.
- Update the Jest tests that enumerate methods (`PaymentMethodSelector.test.tsx`, `PaymentMethodChip.test.tsx`, preferences tests).

### Web (`apps/web`)
- Tenant payment page, `app/tenant/payment/constants.ts` / `utils.ts`, `PaymentMethodChip`, `paymongoService.ts`, `paymentService.ts` types, Settings payment preferences.
- Reuse HeroUI components for the bank picker (per AGENTS.md).

### Other
- `scripts/db-populate/planner.mjs` method list: leave as is unless the run audit needs it (changing it affects frozen demo data).
- Docs: AGENTS.md PayMongo section and ARCHITECTURE.md §7 get one line each; DESIGN.md if the picker adds new UI.

## Part 2: Landlord accepted payment methods (included)

A landlord chooses which methods tenants may use to pay rent. Method names only: no account numbers, no credentials (same rule as `payment_method_preferences`). Payout accounts stay out of scope.

### Rules
- Scope: one setting per landlord (their internal `users.id`), applied to all their listings. Per-listing override is a possible later step (question 5).
- No row means "all methods allowed", so every existing landlord and tenancy keeps working unchanged. Nothing is backfilled.
- At least one method must stay on. A landlord cannot save an empty list, so a tenant is never left unable to pay.
- Cash is on by default and may be turned off like any other method, but the "at least one" rule still applies.
- Turning a method off never touches existing payments. A pending payment made with a method that was later turned off still completes normally.
- The tenant pays with a method the landlord allows; the database and edge function enforce it, not just the UI.

### Database (same migration as Part 1, or a second one)
- New table `landlord_payment_settings` (`landlord_id` primary key referencing `public.users (id)`, `accepted_methods text[] not null`, `updated_at`). Check constraint: non-empty, values within the allowed method names.
- RLS: the landlord reads and writes only their own row, resolved through `public.users.id` like every other policy. Writes pass through the verified-landlord gate (`guard_verified_landlord_write`, add the table to its trigger list) and the active-account policy. Client column grants limited to `accepted_methods` and `updated_at`.
- Tenant read: a small caller-bound function `get_landlord_accepted_methods(p_tenancy_id)` that returns method names for the caller's own active tenancy only. Tenants never get table access, so they cannot browse other landlords' settings.
- Enforcement in the database: a `before insert` trigger on `payment` rejects a method the tenancy's landlord has turned off (message shown as-is to the tenant). `service_role` inserts from the edge function are covered too, because the check reads the landlord from the tenancy, not from the JWT.
- Tests: new SQL test next to `supabase/tests/` (allowed and refused insert, empty list refused, tenant cannot read the table, other landlord cannot write it) and a rollback dry-run on the hosted database before applying.

### Edge function
- `paymongo` already reserves the payment row first, so the trigger above makes a disallowed method fail before PayMongo is contacted. No separate check needed; only make sure the trigger's message reaches the app (it already surfaces `billing_error` text).

### Shared code
- `@repo/utils`: pure helpers `normalizeAcceptedMethods`, `isMethodAccepted` and `validateAcceptedMethods` (non-empty, known names), reusing `PAYMENT_METHOD_TYPES`. Tested in the mobile Jest suite.

### Mobile
- Landlord side: a "Payment methods" settings screen reached from the landlord's settings, with a switch per method and the "keep at least one" error. Query via React Query with the account-keyed pattern used for tenant preferences. Place screens under `app/landlord/` and components under `components/`, not inside `app/`.
- Tenant side: `PaymentMethodSelector` shows only accepted methods. A tenant's saved or default method that the landlord turned off falls back to the first accepted one without changing their saved preferences.

### Web
- Landlord side: a Settings section for payment methods using the existing HeroUI wrappers (`ToggleSwitch`, `SettingsRow`).
- Tenant side: the payment page filters the same way.

### Parity
- Mobile and web behave the same: same rules, same error text, both read the same function.

## Testing
- Unit: preferences conversions, bank limit filtering, label/key mapping, accepted-method helpers.
- DB: constraint accepts the new method, refund flag stays false.
- Manual in PayMongo test mode on mobile and web: success, cancel, and failure; webhook confirms the payment; Payment History shows the right label and chip.
- Run: `pnpm --filter mobile lint && pnpm --filter mobile test`, `pnpm --filter web lint && pnpm --filter web typecheck && pnpm --filter web test`, `pnpm db:billing:test`.

## Order of work
1. Step 0 spike, then confirm Option A or B with the product answers below.
2. Migration (rollback dry-run first), then shared code.
3. Edge function + webhook, deployed after approval.
4. Mobile, then web (online banking option).
5. Part 2: landlord accepted methods, database first, then shared helpers, then landlord screens and tenant filtering on mobile and web.
6. Test-mode end-to-end run on both platforms, including a landlord turning a method off and a tenant being unable to use it.

Parts 1 and 2 are independent: Part 2 can ship first or alone, since it works with the five existing methods.

## Product questions to answer before building
1. Which banks to offer first? (BPI and UnionBank are the only ones shown as available now.)
2. Who pays the bank fee: the tenant (added to the total) or absorbed by APT? Today the tenant pays no fee.
3. What do we call it in the app: "Online Banking" or "Bank Transfer"? (It is a redirect to the bank's own login, not a manual transfer.)
4. Rent above a bank's limit (₱80,000 vs ₱50,000 caps): hide those banks, or show them disabled with the reason?
5. Landlord methods: one setting per landlord (planned), or per listing too?
6. Should cash be allowed to be turned off, or always stay available as a fallback?
