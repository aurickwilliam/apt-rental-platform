# Lease Renewal — Web and Mobile

## Goal

Let tenants and landlords renew an existing lease using the same records on web and mobile. Reuse APT's payments, messaging, notifications, private document uploads, and design system. Keep the original lease, agreements, payment history, and occupancy intact.

## Safety rules

- Never read, display, or change `.env` files or secret values. Do not print process environments, credentials, or API keys.
- Before any hosted database inspection, confirm the active app's public Supabase URL/project reference with the user. A reference in an old migration or the CLI link is not sufficient proof.
- Hosted inspection is read-only and schema-focused; do not retrieve tenant records or private documents for discovery.
- Write additive migrations and test them locally. Do not apply hosted migrations, deploy functions, enable scheduled jobs, or change production data without separate explicit approval.
- Do not overwrite original contracts, rewrite historical payments, automatically charge tenants, or automatically end an unresolved tenancy.
- Keep existing database authorization and payment verification in force. Never disable integrity triggers to make renewal work.
- No automatic commits or pushes.

## Confirmed product decision: discuss charges through chat

Use **Discuss Charges**, not **Dispute Charges**.

- Open the existing conversation between the tenant and landlord about this apartment. Reuse each platform's conversation builder and messaging route; do not create a second chat system.
- Opening chat or sending a message does not accept, reject, or change a proposal.
- Keep the renewal **Awaiting Tenant Confirmation** during discussion. There is no separate dispute status or formal dispute form in this feature.
- The landlord can revise the proposal after discussion. The tenant must explicitly accept the latest version.
- Do not insert a chat message automatically. An optional editable draft may be offered only if the existing composer supports it safely.
- Chat restrictions, such as suspension or verification rules, still apply. Show a clear explanation if messaging is unavailable; do not bypass them.

## Confirmed product decision: same or lower rent

The user approved blocking rent increases in this release. Renewal rent may remain the same or decrease, subject to existing minimum rent and deposit/advance limits. Do not enable increases until a current authoritative policy is verified. Landlords may still revise dates and justified payment/deposit terms; tenant acceptance is always required.

## Existing code to reuse

| Area | Existing implementation |
| --- | --- |
| Database types | `packages/supabase/src/types.ts` |
| Billing rules | `docs/move-in-billing.md`, `supabase/migrations/20261020101501_move_in_billing.sql` and later billing/maintenance migrations |
| Shared billing and rent helpers | `packages/utils/src/tenancyBill.ts`, `packages/utils/src/rentPeriod.ts` |
| Web rental reads | `apps/web/service/tenancy-context.ts`, `apps/web/service/tenancyService.ts`, `apps/web/hooks/use-tenancy.ts` |
| Mobile rental reads | `apps/mobile/service/tenancy/tenancyService.ts`, `apps/mobile/hooks/tenancy/useTenancy.ts` |
| Executed agreements | `apps/web/service/signedLeaseService.ts`, `apps/mobile/service/tenancy/signedLeaseService.ts` and their hooks/components |
| Web payments | `apps/web/service/paymentService.ts`, `apps/web/service/paymongoService.ts`, `apps/web/app/tenant/payment/` |
| Mobile payments | `apps/mobile/service/payments/paymentService.ts`, `apps/mobile/app/tenant/payment/` |
| Provider confirmation | `supabase/functions/paymongo/index.ts`, `supabase/functions/paymongo-webhook/index.ts` |
| Scheduled reminders | `supabase/migrations/20260826054353_rent_due_reminders.sql` and later reminder changes |
| Email delivery | `public.email_outbox`, `app_private.queue_email()`, `supabase/functions/email-notify/` |
| Notification audiences | `packages/utils/src/notificationAudience.ts` |
| Notification destinations | `apps/web/lib/notification-links.ts`, `apps/mobile/utils/notificationDeepLink.ts` |
| Tenant entry points | `apps/web/app/tenant/my-rental/`, `apps/mobile/app/(tabs)/(tenant)/rentals.tsx` |
| Landlord entry points | `apps/web/app/landlord/properties/`, `apps/mobile/app/landlord/manage-apartment/` |
| Messaging | Existing apartment-specific conversation keys, portal conversation selectors, and message screens |

Some sections of `ARCHITECTURE.md` describe older behavior. Verify source and the current schema; follow `AGENTS.md` when documentation conflicts. Contract upload and tenant acknowledgment exist; automatic contract generation has not been found in the inspected app code.

## Important compatibility findings

1. Versioned tenancy billing freezes agreed terms. Do not change its original rent/start/deposit fields through ordinary updates.
2. Creating an ordinary tenancy can generate another move-in bill. Renewal must not collect a second original deposit or move-in payment.
3. Current advance rent covers a named calendar period, not automatically the last lease month. Only confirmed, applicable allocations count as credit.
4. The existing signed-lease replacement service removes the replaced file. Reuse its safe upload/viewing patterns, not its deletion behavior, for renewal history.
5. Existing payment uniqueness rules include one pending versioned bill per tenancy. Inspect and preserve them unless a reviewed replacement proves equivalent protection across ordinary rent and renewal.
6. Keeping one continuous tenancy avoids falsely recording a move-out, orphaning maintenance, or unlocking ended-tenancy reviews during renewal.

## Proposed records

Names and exact columns remain subject to current-schema inspection.

| Record | What it saves |
| --- | --- |
| `lease_renewals` | Current lease-term link, request/intention, workflow state, active proposal, deadlines, completion |
| `lease_renewal_proposals` | Immutable versions of dates, rent, deposit treatment, advance period, credit sources, and payment conditions |
| `lease_renewal_events` | Append-only requests, revisions, decisions, agreement confirmations, and payment/scheduling outcomes |
| `tenancy_lease_terms` | Original agreed-term snapshot when needed, plus confirmed renewal periods; one continuous occupancy |
| Private document metadata | Evidence/agreement storage path, uploader, proposal version, file identity, and confirmation references |
| Internal reminder ledger | One event per lease term, milestone, and recipient |
| Additional `payment` linkage | Renewal/proposal identity and `lease_renewal` classification while retaining separate advance/deposit components |

Do not bulk migrate untouched tenancies or guess missing historical amounts. Lazily snapshot existing terms when a tenancy first enters renewal; legacy billing stays unchanged outside explicit, tested renewal behavior.

Keep historical base tenancy terms unchanged. Resolve effective agreed terms through shared database logic used by bills, rental presentation, reminders, and reports. The resolver takes the relevant period, not just today's date. Expose only caller-authorized reads. Protect creation of a term snapshot against concurrent original-lease edits.

## Workflow

```text
Eligible lease
  -> Pending Landlord Review
       -> Declined
       -> Awaiting Payment Configuration
            -> Awaiting Tenant Confirmation
                 -> Discuss Charges (chat; status unchanged)
                 -> Revised proposal (acceptance required again)
                 -> Declined
                 -> Awaiting Agreement Confirmation
                      -> Awaiting Payment
                           -> Payment Verification Pending
                           -> Renewed (scheduled)
                                -> Effective on agreed start date
```

- Record **I Will Not Renew** as an explicit intention with confirmation and a landlord notice. It does not end the lease or vacate the unit.
- **Decide Later** dismisses a local prompt; it is not a refusal or a permanent loss of eligibility.
- **Expired / Requires Review** blocks unsafe completion without ending occupancy or discarding payment evidence.
- Completion before the start date means scheduled, not already active.
- A revision is a new immutable proposal. Both parties' confirmations must refer to the same proposal and agreement file.
- An unresolved payment locks its proposal against revision/decline. A late verified payment must be reconciled, never discarded because a client deadline passed.
- A failed or rejected attempt can be retried safely after authoritative settlement. Paid proposals cannot be silently cancelled; exceptions need an operator reconciliation path.

## Implementation checklist

### 1. Verify schema and settle boundary rules

- [x] Obtain user confirmation of the active public Supabase project reference without opening environment files.
- [ ] Inspect only relevant tables, constraints, indexes, grants, RLS policies, functions, triggers, storage policies, and cron definitions read-only.
- [ ] Confirm current billing, payment notification, landlord confirmation, finance, and signed-lease definitions against local migrations.
- [ ] Verify lease end-date inclusivity before choosing the next start date. Never silently change existing date conventions.
- [ ] Define month-end/leap-year behavior and same-calendar-month renewal boundaries. Prevent double rent when the old and new term share a billing month; ambiguous rent changes require review rather than guessed proration.
- [ ] Derive prior duration from original agreed dates/snapshots, not the current editable listing. Require explicit resolution for missing/ambiguous legacy terms.
- [ ] Verify applicable current Philippine deposit, advance, and rent-increase rules using authoritative sources. Existing product limits are not a legal-compliance guarantee. Document the applicable scope and unresolved cases.
- [ ] Define short-lease reminders, proposal deadlines, late agreement/payment handling, and reopening a non-renewal intention without erasing its history.

### 2. Shared types and validation

- [ ] Add focused, dependency-light renewal modules and tests under `packages/utils/src/` with named exports.
- [ ] Define typed statuses, transitions, action permissions, date calculations, money validation, and display labels.
- [ ] Use integer centavos for client calculations and exact numeric amounts in SQL; never rely on floating-point equality for money.
- [ ] Share proposal parsing, deposit wording, payment breakdowns, and notification payload contracts across platforms.
- [ ] Keep business authorization and payable amounts authoritative in the database.

### 3. Database records and caller-bound actions

- [ ] Add the reviewed additive schema, indexes, private storage policies, RLS, explicit grants, and audit events.
- [ ] Provide narrow RPCs for request, non-renewal intention, landlord review, proposal submission/revision, tenant acceptance/decline, agreement confirmation, and authorized detail/list reads.
- [ ] Resolve identity through internal `users.id`; enforce actual tenant/landlord membership, ownership, active-account checks, and existing verification policy.
- [ ] Recheck all authorization inside definer functions. Use an empty search path and qualified names. Never add implicit admin access to private tenancy agreements.
- [ ] Lock the tenancy/renewal consistently and reject stale expected versions. Enforce one unresolved renewal per term and one completed successor.
- [ ] Prevent overlapping agreed periods and changes to immutable proposals/events. Refuse arbitrary direct writes, including forged payment/confirmation linkage.
- [ ] Keep list reads bounded and participant-scoped. Never expose signed URLs in persistent records or query keys.

### 4. Manual deposit and payment proposal

- [ ] Show the original deposit target separately from verified recorded receipts and the landlord's declared retained balance.
- [ ] Support no, partial, and full replenishment, with a reason for positive replenishment and optional supporting files.
- [ ] Label declarations **Landlord-declared; not independently verified by APT**. Never claim APT monitors deductions or the actual remaining balance.
- [ ] Validate declared retained deposit plus replenishment against the agreed target; do not assume unknown legacy deposits are zero.
- [ ] Limit advance to allowed terms and bind it to an explicit period. Apply only verified, unused credit applicable to that period.
- [ ] Show advance, replenishment, credits, and total separately; forbid unrelated extra charges.
- [ ] Revalidate changed credit/payment availability before reservation. A changed payable proposal must return for review rather than silently changing accepted charges.

### 5. Preserve agreements and evidence

- [ ] Reuse existing file picking, file-type/size validation, binary upload, private viewing, and account-retirement safeguards.
- [ ] Use renewal/proposal-specific fresh paths and private participant-only reads; keep old files referenced and readable historically.
- [ ] Verify object ownership/existence through the save RPC and validate allowed type/size at storage boundaries.
- [ ] Present all agreed details: parties/property, dates, rent, advance period, deposit treatment/replenishment, and payment conditions.
- [ ] Require landlord and tenant confirmation of the exact immutable proposal and executed agreement before payment.
- [ ] Do not delete an upload after an uncertain save unless a successful authoritative read proves it is unreferenced.
- [ ] Do not describe acknowledgment as certified electronic signing or claim automatic contract generation exists.

### 6. Extend existing payment processing

- [ ] Add renewal classification and proposal linkage without modifying old payment allocations.
- [ ] Add a caller-bound renewal bill/reservation path that calculates amounts on the server, including legacy tenancies entering renewal.
- [ ] Preserve normal rent/payment behavior and current pending protections; surface pending conflicts with a link to the existing payment.
- [ ] Reuse PayMongo hosted checkout, accepted methods, reference generation, status lookup, cancellation, webhook verification, and cash confirmation.
- [ ] Freeze payment amounts/components at reservation. Do not let clients mark online payments paid.
- [ ] Reserve before provider calls; retain uncertain reservations and reconcile before retry. Verify provider amount/currency/identity with existing safeguards.
- [ ] Prevent ordinary rent and renewal from spending the same credit or charging the same period, including concurrent attempts.
- [ ] Make verified-payment completion idempotent. Support zero-total renewal without a fake payment row.
- [ ] Label receipts/history **Lease Renewal**, with separate advance and deposit replenishment. Deposits never count as rental income.
- [ ] Audit all payment consumers so a renewal receipt is not accidentally shown as current-month rent or used to settle unrelated maintenance fees.

### 7. Notifications and scheduling

- [ ] Add milestone reminders at 60, 30, 14, and 7 days in Asia/Manila time. Default request eligibility starts at 30 days.
- [ ] Handle short leases and missed-job recovery without sending a burst of obsolete milestones.
- [ ] Insert deduplicated notification/email events transactionally through existing server-only infrastructure.
- [ ] Stop expiry reminders for completed/declined/non-renewing cases. Tailor unresolved reminders to the outstanding action and responsible party.
- [ ] Add request, intention, proposal/revision, agreement, payment, completion, and review-required templates/events. No separate dispute notifications.
- [ ] Reuse channel preferences and Android token registration; do not guarantee delivery without permission, valid tokens, or configured email delivery.
- [ ] Include explicit portal audience and renewal/tenancy/apartment identifiers. Extend both notification destination builders and tests.
- [ ] Avoid logging private message text, documents, or sensitive payment details. Email uses fixed escaped templates and private detail links, not attached evidence or signed URLs.

### 8. Web interface

- [ ] Read relevant installed Next.js documentation and verify installed HeroUI v3 APIs before changing UI code.
- [ ] Add an expiry/status card and non-blocking reminder dialog to My Rental, with account/term/milestone-scoped dismissal.
- [ ] Add request, intention confirmation, proposal review, agreement, payment, and history views under authorized tenant routes.
- [ ] Add **Discuss Charges** using the existing apartment conversation and leave proposal status unchanged.
- [ ] Add a bounded renewal-management section/list from existing landlord property management, plus details and proposal editor.
- [ ] Reuse HeroUI, `StatusChip`, `EmptyState`, confirmation dialogs, date limits, upload/viewing tools, and existing checkout layouts.
- [ ] Use `useAsyncResource`, retire account/resource callbacks, and stream independent server reads after authorization. Financial actions require fresh server validation.
- [ ] Do not alter unrelated sidebars/navigation or introduce global session context. Respect nested-overlay focus/portal rules.

### 9. Mobile interface

- [ ] Add the matching expiry/status entry in Rentals and management entry in existing landlord property screens.
- [ ] Add authorized request/review/proposal/agreement/status screens with route helpers outside `app/`.
- [ ] Use existing HeroUI Native dialogs, mounted bottom sheets, `ScreenWrapper`, keyboard behavior, date fields, and private-media resolver.
- [ ] Add **Discuss Charges** using existing apartment-specific messaging. Do not create a dispute form or treat chat as acceptance.
- [ ] Put server data in account/portal/resource-keyed React Query queries, not Zustand. Retire stale-account operations and reconcile mutation outcomes.
- [ ] Reuse existing tenancy Realtime registry and focus/foreground refresh patterns. Do not bind unpublished tables or create duplicate subscriptions.
- [ ] Provide the same actions, amounts, documents, status history, and payment behavior as web; layouts may differ.

### 10. Completion and effective terms

- [ ] Finalize only after matching agreement confirmations and verified required payment, or a verified zero balance.
- [ ] Schedule the immutable successor term and notify both parties; leave the current term effective until the boundary.
- [ ] Use an idempotent scheduled process plus authoritative read-time term resolution; correctness must not depend on a cron job firing at an exact instant.
- [ ] Recheck occupancy/ownership and period conflicts before effectiveness. Route ended occupancy or inconsistent records to review rather than overriding them.
- [ ] Update bills, rent reminders, rental presentation, and finance to use the correct period's terms and confirmed advance coverage.
- [ ] Preserve continuous tenancy relationships, historical agreements, review rules, maintenance attribution, and previous payments.
- [ ] Do not automatically vacate an expired unresolved tenancy. Any ordinary move-out action remains explicit and subject to existing pending-fee rules.
- [ ] Validate legacy billing compatibility and old-client behavior. Coordinate mobile minimum-version requirements before enabling behavior older clients cannot safely display.

### 11. Tests and documentation

- [ ] Shared unit tests: states, permitted actions, parsing, amounts, duration/date boundaries, proposal identity, deposit wording, credits.
- [ ] Local PostgreSQL contracts: all actions, grants/RLS, participant ownership, mixed roles, suspension/verification, private documents, concurrency, and payment guards.
- [ ] Test all requested scenarios: approval, tenant non-renewal, landlord decline, no/partial/full replenishment, chat discussion, revised proposal, successful/pending/failed payment, unresolved expiry, and cross-platform consistency.
- [ ] Additional regressions: duplicate requests/callbacks, stale acceptance, two sessions revising concurrently, credit reuse, zero total, late payment success, cron retries, missing legacy data, same-month overlap, month ends/leap years, preserved agreements.
- [ ] Prove ordinary rent, cash confirmation, move-in advance, maintenance, receipts, finance reports, and tenant reviews remain correct.
- [ ] Run mobile lint/Jest and web lint/typecheck/tests/build. Add dedicated local renewal database test scripts following the embedded billing-test pattern.
- [ ] Test real authorization/storage with local Supabase or an approved staging project; embedded SQL tests alone do not prove full Supabase RLS or provider behavior.
- [ ] Verify web interactions and accessibility with browser tests, and mobile account switching/background resume with focused tests.
- [ ] Verify actual cross-platform changes, test-mode provider flow, email, and Android push in approved staging. Report untested delivery clearly.
- [ ] Update `ARCHITECTURE.md`, `DESIGN.md` where durable behavior changes, database types, and an operator rollout/reconciliation guide. Do not change design tokens without a genuine design need.
- [ ] Run `graphify update .` after code changes; keep generated graph outputs ignored.

## Release gates

1. **Project/schema gate:** user confirms the active public project; inspect relevant schema read-only. Do not guess from CLI defaults or older SQL URLs.
2. **Rules gate:** date boundaries, ambiguous legacy terms, applicable legal limits, and the chosen effective-term model are documented and tested.
3. **Local/staging gate:** schema contracts, authorization/storage, both clients, old billing, and test-mode payment verification pass.
4. **Deployment gate:** obtain explicit approval for exact hosted migrations/functions and the intended project. No production writes are authorized by this plan alone.
5. Deploy backward-compatible prerequisites in the order established by compatibility tests. A new function must not require columns that have not been deployed, and a new constraint must not break still-active old function paths. Keep renewal unavailable until the coordinated release is ready.
6. Publish web/mobile, complete any necessary old-client minimum-version rollout, then enable renewal scheduling through the approved release procedure.
7. Verify deployment, known fixtures, delivery, and reconciliation. If disabling the feature, stop new entries/jobs without deleting agreements, records, or pending payments.

## Current progress

- [x] Initial local code, design, billing, signed-lease, notification, and scheduling review.
- [x] Replace the proposed formal dispute workflow with existing messaging.
- [x] Save this plan in `docs/plans/lease-renewal.md`.
- [x] Confirm the active hosted project before schema verification.
- [x] Read-only inspection of relevant hosted columns, constraints, payment/tenancy indexes and triggers, and table/storage RLS policies; no user records retrieved.
- [x] Implement shared renewal rules in `packages/utils/src/leaseRenewal.ts` with Jest coverage.
- [x] Add the additive renewal migration `supabase/migrations/20261106090000_lease_renewals.sql` (local only — not applied to hosted).
- [x] Add local PGlite SQL contract tests (`pnpm db:renewal:test`): 14/14 passing, covering requests, declines, proposals, RLS, storage, cash/provider verification, future-term activation, and scheduler deduplication.
- [x] Extend existing payment, PayMongo, email, notification, and effective-lease-term paths on web and mobile.
- [x] Add renewal entry, proposal, agreement, and payment screens on both platforms; `Discuss Charges` reuses existing chat and never changes status or accepts terms.
- [x] Verify local billing contracts still pass (`pnpm db:billing:test`), shared renewal units pass, web typecheck passes, and affected mobile contract tests pass.
- [ ] Remaining release work: full web build, full mobile/web lint and suites, staged RLS/storage/provider/email/push verification, operator reconciliation tooling, and any necessary old-client version gating.
- [ ] Deployment gates still require explicit approval for exact hosted migrations/functions and the intended project.

No implementation or hosted deployment above proves production delivery. Record verification results and remaining external configuration honestly in the completion summary.

### Read-only preflight findings (2026-11-06)

The user confirmed `ezxirkpgfpripjydcqnt` as the active app project. Schema-only queries confirmed:

- `payment_billing_kind_check` allows only `move_in`, `monthly`, and `fees`; renewal requires a reviewed extension.
- `payment_allocation_check` requires the receipt total to equal its rent/deposit/advance/maintenance components. Any credit must reduce the correct component; do not store a negative miscellaneous charge.
- `payment_one_pending_bill_idx` allows one pending versioned bill per tenancy. There are additional pending cash/online per-period indexes. Do not remove these protections to get checkout working.
- `tenancies_billing_version_check` allows only null/1. A proposed new billing version cannot be introduced without a coordinated compatibility change.
- Existing billing, cash-status, role-membership, verified-account, self-transaction, notification, fee-settlement, and tenancy-availability triggers are present. Renewal must account for every relevant guard rather than bypassing them.
- `email_outbox_template_check` and `notifications_type_check` are allowlists. Add email templates through migration; use the existing `system` notification type unless a new type is fully integrated.
- The `lease-agreements` object SELECT policy is public. Do not store renewal agreements/evidence there. `signed-leases` uses tenancy-member helpers but its existing delete/upload behavior is not an immutable renewal-history policy. Use a narrowly scoped private renewal bucket with participant-only reads and protected referenced documents.
- Tenancies have an existing ended-tenancy read policy for other landlords. Do not reuse that broad audience for private renewal proposals, evidence, or agreement history.

Later local implementation also verified the current `guard_payment_billing`, `tenancy_bill`, cash-payment guards, and landlord rent ledger definitions. Before production rollout, re-inspect hosted function definitions, grants, cron metadata, and all later finance/billing dependencies against the exact deployed project; do not mark the full schema gate complete yet.

### External rule-verification blocker

The current legal scope and limits for renewal rent increases have not been verified. Web search returned HTTP 402 and the official housing site returned HTTP 403 during this session. Neither failure proves any legal rule. Do not hardcode a remembered percentage or label existing product caps as statutory limits.

Before enabling increased renewal rent, obtain an authoritative current rule/reference and define its applicability. A conservative alternative, if approved by the user, is to ship renewals with rent unchanged or reduced and block increases until the policy is verified. That is an explicit scope decision, not a silent substitute for the requested legal validation. Deposit/advance requirements still need verified applicable rules before release.

The text of [Republic Act No. 9653](https://lawphil.net/statutes/repacts/ra2009/ra_9653_2009.html) was successfully read. Section 7 states a maximum of one month advance and two months deposit for covered leases; Section 6 authorizes subsequent regulation. Section 4's original percentage has a historical time limit and must not be reused as a verified 2026 cap. The existing conservative product limits align with the stated advance/deposit ceilings but do not establish current coverage or a current rent-increase percentage.
