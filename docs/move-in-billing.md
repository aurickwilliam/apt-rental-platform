# Move-in billing

New tenancies use `billing_version = 1`. Existing tenancies retain `NULL` and their historical billing behavior; this migration neither charges an old deposit nor infers an old advance payment.

The existing tracked demo-population importer remains legacy-only for historical data. Its exception requires a direct PostgreSQL operator session without a JWT and a known tracked run; ordinary clients and service-role requests cannot select legacy billing. The migration updates only the reviewed trigger-function hashes in its safety audit.

## Billing rules

- Approval already snapshots the listing's rent, security deposit and advance. New tenancy billing terms are frozen in the database, including direct landlord inserts.
- The initial bill is first month's rent + deposit + advance + any pending maintenance fees raised by that tenancy. With ₱15,000 rent, a ₱15,000 deposit and a ₱15,000 advance, the total is ₱45,000 before fees.
- Month 1 is the calendar month containing move-in, billed in full and due on the move-in date. There is no automatic proration. Month 2 is the next calendar month; one month's advance covers that month only, not the final lease month. Without advance, month 2 remains payable. Normal due-day billing resumes afterward.
- An unpaid initial bill stays payable even after its original month. Credit is granted only by a confirmed `paid` payment; pending, rejected and failed payments grant no rent coverage.
- Each receipt is one payment with separate `rent_amount`, `deposit_amount`, `advance_amount` and `maintenance_amount` allocations. Advance includes its exact calendar period. Deposits and fees never count toward paid rent or rental revenue.
- `rental_income_amount` is the rent plus advance collected, excluding deposits and maintenance fees. This is cash collection reporting, not an accrual accounting ledger. Legacy rows retain their original amount because their components are unknown.
- Maintenance-only bills remain possible after rent is covered. Only the fee IDs included in a confirmed payment settle; fees raised later remain payable.
- A maintenance fee belongs to the tenancy that raised it (`maintenance_request.tenancy_id`). The binding is set on insert and cannot move. Re-letting a unit — even to the same tenant — never inherits an older tenancy's unpaid fee. Fees with no resolvable tenancy stay unbilled.
- `fee_status` flows `pending → paid | waived` and never reopens. The landlord waives a pending fee through `waive_maintenance_fee`, which is caller-bound and refuses a fee already reserved by a pending payment. A tenancy cannot be ended while it has a pending fee; settle or waive it first (`guard_vacate_pending_fees`).

## Safety and integration

`get_tenancy_bill` is caller-bound and calculates in Manila time. The private calculator's date parameter exists for tests only. Web and mobile consume the same bill; shared rent helpers prefer it over a bounded payment-history page.

The payment insert trigger locks the tenancy and verifies the amount, period, ownership and active status. It assigns allocations itself, refuses prepaid inserts, and permits only one pending versioned bill per tenancy across payment methods. Paid move-in receipts have a separate unique index. Financial fields cannot be rewritten afterward.

Online checkout reserves a pending payment **before** contacting PayMongo. Provider confirmation (webhook or authenticated status lookup) marks it paid. Definite provider rejections release the reservation; uncertain transport/provider failures stay pending to avoid a second charge. Existing hosted sessions can be resumed from the web verification screen. Never clear an uncertain reservation just because time elapsed. A reservation without a saved provider ID requires operator reconciliation against PayMongo before another payment can be attempted. The pre-existing unsupported card 3-D Secure path remains pending, not falsely paid.

The database handles maintenance settlement for versioned bills. The old receipt-side settlement path is restricted to legacy payments and reads only the active tenancy's fees. Rent reminders use rent allocations, including month 2 advance, rather than the full payment amount.

## Release order and verification

1. Deploy the updated `paymongo` Edge Function first. It remains compatible with the old schema and reserves online payments before charging. No Auth settings or environment files need changing.
2. Apply `supabase/migrations/20261020101501_move_in_billing.sql` through the reviewed migration workflow. It updates the existing cash insert guard, rent-reminder query, payment-notification wording and landlord revenue calculation without replacing their surrounding rules. It refuses deployment if key existing definitions have drifted.
3. Apply `supabase/migrations/20261020130311_maintenance_fee_tenancy.sql`. It backfills fees to their originating tenancy, scopes new bills and settlements, adds the waive state/RPC and the vacate guard, and re-registers the reviewed trigger hashes. Fees that predate every lease bind to the tenancy that owned the unit at the time, never to the newest re-let. Then apply `supabase/migrations/20261020131416_guard_maintenance_fee_landlord.sql`, which enforces the same landlord-only rule for direct table writes so a tenant cannot waive a fee or zero its amount without the RPC.
4. Release the web and matching mobile changes together. Old clients cannot submit an underpriced new move-in bill: database validation rejects it. Existing tenancies continue using legacy billing.
5. Test a new tenancy in PayMongo **test mode**: cash pending/accept/reject; wallet/card confirmation; duplicate submits; month 2 coverage; month 3 billing; separate maintenance; waive; vacate guard; receipts and landlord revenue. Do not rewrite existing tenant records to manufacture advance credits.

`pnpm db:billing:test` executes both migrations and the billing guards in test-only embedded PostgreSQL (PGlite), without Docker, environment files, credentials or hosted writes. It covers allocation, confirmation/replay, retries, wrong amounts/ownership/periods, legacy compatibility, zero advance, two-month deposits, mid-month starts, year/February boundaries, fee-only bills, tenancy-bound fees across a re-let, landlord-only waiving and the vacate guard. It is a focused schema-contract test, not a full Supabase/RLS or provider end-to-end test. Web tests cover shared rent calculations and receipt breakdowns.
