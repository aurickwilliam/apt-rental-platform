# Landlord Web Budget Analytics — Full Mobile Parity Plan

Status: Phases 1–5 implemented. Final acceptance (live authenticated journey, same-account web/mobile comparison, hardening) remains in Phase 6.

## 1. Goal and scope

Mirror **every existing feature and user action** in mobile's **Profit & planning** experience into the landlord web portal, including Overview, Expenses, Budget, and all related forms, confirmations, filters, and drill-downs.

**Only presentation and platform implementation change. Calculations, validation rules, data meaning, permissions, and saved records remain the same.** Use HeroUI v3 components for web controls, forms, dialogs, tabs, and tables. Adapt mobile pages and bottom sheets to responsive web layouts and modals rather than reproducing React Native UI.

Implementation destination: `/landlord/analytics`, titled **Profit & planning**, with a matching landlord navigation entry. Keep the existing `/landlord/dashboard`, revenue reports, payment workflows, and dashboard RPC unchanged. This is a complete finance experience, not just a Budget-tab port.

### Non-negotiable requirements

- [ ] All parity items in this plan are implemented and verified, not deferred after the first tab.
- [ ] Web and mobile consume the same finance RPCs and shared calculation helpers.
- [ ] No new web-only accounting formulas, guessed expenses, forecasts, or market-cost estimates.
- [ ] Missing expense review remains unknown income, never an assumed zero cost or estimated profit.
- [ ] Spending limits, reserve plans, operating expenses, capital improvements, cash receipts, and rental-period balances retain their separate meanings.
- [ ] Finance remains private to the active landlord owner; admin membership grants no additional access.
- [ ] Existing mobile behavior and current uncommitted work are preserved.
- [ ] No hosted database writes, demo population, schema changes, or deployments are required merely to build this UI.

## 2. Inspected baseline and source files

Baseline inspected on 2026-10-19 and re-reviewed 2026-10-20 on branch `feature/web-profit-analytics`. The mobile finance work that was still in the working tree at the baseline is since committed (`1af8cc46` input-alignment patch, `23713e59` option-sheet padding, `01b9ce95` budget-removal trash icon — all presentation-only; no calculation or flow changed) and `edit-budget.tsx` is tracked. The working tree is clean except the untracked local build artifact `apps/mobile/build-preview.apk`; no `*.apk` .gitignore rule covers it (housekeeping in Phase 1, not part of parity). Reinspect the working tree before implementation; do not reset, overwrite, or revert anything pre-existing.

Graphify was used first to locate finance relationships, followed by direct source inspection. References below are repository-relative.

| Area | Existing source of behavior |
|---|---|
| Main report and actions | `apps/mobile/app/landlord/analytics.tsx` |
| Expense creation, category transactions | `apps/mobile/app/landlord/add-expense.tsx`, `category-expenses.tsx` |
| Budget creation, property drill-down, editing | `apps/mobile/app/landlord/add-budget.tsx`, `budget-category.tsx`, `edit-budget.tsx` |
| Full property comparison | `apps/mobile/app/landlord/property-performance.tsx` |
| Finance presentations | `apps/mobile/components/finance/` |
| Data operations and payload | `apps/mobile/service/finance/financeService.ts` |
| Access, request scopes, mutation refresh | `apps/mobile/hooks/finance/useLandlordFinances.ts` |
| Shared rules and arithmetic | `packages/utils/src/landlordFinance.ts`, `landlordFinance.test.ts` |
| Base finance schema and RPCs | `supabase/migrations/20261016163249_landlord_profit_planning.sql` |
| Mixed-role ownership rules | `supabase/migrations/20261017064029_allow_mixed_role_landlord_finances.sql` |
| 24-month rent-indicator report | `supabase/migrations/20261018165822_add_finance_income_months.sql` |
| Landlord web shell/navigation | `apps/web/app/landlord/layout.tsx`, `apps/web/app/components/layout/AppSidebar.tsx` |
| Existing revenue dashboard | `apps/web/app/landlord/dashboard/page.tsx` and its `components/` and `lib/` |
| Web request-state convention | `apps/web/hooks/use-async-resource.ts`, `apps/web/hooks/use-user.ts` |
| Existing HeroUI modal pattern | `apps/web/app/components/settings/ChangePasswordModal.tsx` |

Read `AGENTS.md`, `DESIGN.md` (especially §11), `ARCHITECTURE.md` §12.1, and `design-tokens.json` before implementation. Reuse their design values by reference, not a second finance-specific design system. Some older architecture overview sections are stale; prefer AGENTS.md and current source when they conflict. Hosted schema remains authoritative for database facts; migration inspection here does not certify remote deployment status.

### Current web gap

The web has a revenue dashboard but no `/landlord/analytics` page or dedicated expense/budget finance UI. `@heroui/react` 3.2.6, `@internationalized/date`, and Recharts 2.15.4 are already installed. No new component or chart dependency is expected.

## 3. Web experience and component choices

### 3.1 Report layout

Use the established landlord page shell, a clear heading, applied property/month context, and an action toolbar. Keep the earnings summary above the three main tabs.

```text
Profit & planning                         Refresh | Filters (n) | Add expense
Applied property / All properties
Applied report month

[ Earnings summary + expandable calculation breakdown                     ]
[ Overview                      Expenses                         Budget    ]

Overview, desktop:
[ Needs attention                  ] [ Your monthly plan                 ]
[ Income trends — wide chart                                              ]
[ Collection health                ] [ Property performance              ]

Expenses:
[ Expense review / Mark expenses reviewed                                 ]
[ Where expenses go — category bars                                       ]

Budget, desktop:
[ Budget versus actual             ] [ Planned reserves                  ]
[ Budget suggestions and goal starters                                    ]

Planning guidelines
```

Stack the same content on smaller screens. Preserve all controls and actions; responsive layout must not remove functionality. Place Add expense in the web toolbar rather than copying the mobile floating button. Keep it readily reachable on narrow screens without covering content or the portal's mobile navigation. Mark persistent action areas with `data-fab-clearance` where needed so the notification bell cannot cover them.

### 3.2 Mobile-to-web interaction mapping

| Mobile presentation | Planned web presentation |
|---|---|
| Finance filter bottom sheet | HeroUI `Modal` with Property / Month tabs, one draft, fixed action footer |
| Add expense page / edit expense sheet | One reusable create/edit HeroUI `Modal` form |
| Add budget / edit budget pages | One reusable create/edit HeroUI `Modal` form |
| Collection ledger sheet | Large HeroUI `Modal` with status tabs, responsive table/cards, Load more |
| Expense review confirmation | HeroUI `AlertDialog` or existing HeroUI confirmation wrapper |
| Two-step expense/budget removal | HeroUI confirmation inside the editor flow; explicit Cancel / Delete or Remove |
| Calculation/planning guidelines dialog | One reusable scrollable HeroUI `Modal` |
| Category expense transactions page | `/landlord/analytics/category-expenses` with desktop table and narrow-screen cards |
| Budget category/property page | `/landlord/analytics/budget-category` with per-property rows/cards opening the budget modal |
| All-property performance page | `/landlord/analytics/property-performance` with ranked metrics and report-focus actions |
| Pull to refresh | Explicit HeroUI Refresh button; same scoped data reload |

Long, paginated drill-downs stay addressable pages; short forms and temporary decisions use modals. Returning from a drill-down restores the report scope and tab. Opening an editor from a drill-down returns to the same list after save/cancel.

### 3.3 HeroUI usage

- `Button`, `Tabs`, `Card`, `Chip`/`Badge`, `Separator`, `Skeleton`, `Spinner`, `Tooltip`, and `toast` for report controls and feedback.
- `Form`, `TextField`, `Label`, `Input`/`InputGroup`, `FieldError`, `Select`, searchable `ComboBox` or existing HeroUI selector wrapper, and `DatePicker` for forms.
- `Modal` for filters, editors, collections, and guidelines; `AlertDialog` for destructive or commitment confirmations.
- HeroUI `Table` for desktop tabular data; plain semantic layout for card content. Use explicit HeroUI actions rather than inaccessible click-only rows.
- HeroUI `ProgressBar` where suitable, driven by the existing shared progress output. Visible text must retain actual usage/overage even if the graphic caps at 100%.
- Recharts for the income visualization because HeroUI is not a chart library. Use HeroUI for its controls and accessible details. Reuse existing chart infrastructure where appropriate without copying legacy colors/fonts.
- Check the installed APIs in `node_modules/@heroui/react/dist/components/` before implementation; do not assume v2 props or invent components.
- Follow existing web tokens, Nunito/Inter roles, focus rings, radii, and dark theme. Scope any necessary HeroUI CSS overrides in `apps/web/app/globals.css`; do not fight unlayered styles with ineffective utilities.

## 4. Complete feature parity checklist

### 4.1 Entry, scope, and filtering

- [x] Add a **Profit & planning** link to desktop and mobile landlord navigation with a supported Tabler icon and intent prefetching.
- [x] Default to All properties and the current Manila calendar month.
- [x] Show the applied property name under a Filtered property caption, or All properties, followed by the applied month.
- [x] Keep applied month/property/tab in validated URL state; form drafts and unsaved financial amounts never enter the URL.
- [x] Preserve unrelated query parameters, including notification/settings triggers, when updating finance filters.
- [x] Filters opens a draft seeded from applied values, on Property, with cleared search and the applied year's month grid.
- [x] Property picker supports searchable owned properties, All properties, case-insensitive matching, clear search, selected indication, and no-results feedback.
- [x] Month picker supports year navigation and a three-column month grid covering the current and previous 23 months; future/out-of-window choices are disabled.
- [x] Indicate months with collected rent using the separate 24-month income summary for the **draft property**, not the 12-month chart window or applied property.
- [x] Map `income_months` to `incomeMonths` explicitly and validate the summary payload. An assertion does not rename JSON keys.
- [x] Retain compatibility with older payloads without `income_months`: combine bounded cached reports for the current month and 12 months earlier, as mobile does. (Web uses fresh bounded requests rather than adding a new cache.)
- [x] Show indicator-sized skeletons while the initial summary loads. On failure show Retry rent indicators without blocking month selection.
- [x] Accessible month labels distinguish rent collected, no rent collected, data unavailable, and outside report range.
- [x] Apply commits property and month together. Reset updates the draft to All properties/current month; Cancel, Escape, or dismissal discards it.
- [x] Keep a visible draft-selection summary and Cancel / Apply filters footer. Draft changes never update report headings or figures.
- [x] Count nondefault property and month filters in the filter badge and include applied selections in the accessible filter label.
- [x] Refresh the report without replacing settled same-scope content with initial skeletons.

### 4.2 Earnings summary and explanation

- [x] Before review, the headline is Collected rent; after review, it is Net operating income.
- [x] Show month to date for the current month and completed month for past reports.
- [x] Compare income only when both the active and comparison scopes are reviewed; otherwise compare collected rent. Preserve increase/decrease/no-change wording and peso delta.
- [x] Show Recorded spending and After spending & planned reserves; unavailable calculated amounts read Not calculated.
- [x] Review expenses to calculate income switches to Expenses.
- [x] View breakdown / Hide breakdown reveals collected rent, operating expenses, operating income, improvements/replacements, and planned reserves.
- [x] How these figures are calculated opens the guidelines modal rather than appending explanatory paragraphs to the card.
- [x] Disclose the excluded unclassified payment amount when nonzero.
- [x] Keep negative income and negative cash-after-plan values visible and correctly signed.

### 4.3 Overview tab

- [x] Needs attention shows overdue amount and tenancy count, opening the overdue collection list, or the no-overdue message.
- [x] Offer review-expenses navigation when the active scope is unreviewed.
- [x] Offer over-limit budget navigation if any individual spending budget exceeds its limit, even when grouped category totals appear within budget.
- [x] When total planned reserves are zero, Plan an emergency reserve opens creation preset to emergency/reserve and the current report scope.
- [x] Income trends defaults to 6M, supports 3M/6M/12M, and uses only available months in the report window.
- [x] Collected and Expenses series can be toggled but cannot both be hidden. Net income is optional and enabled only when every displayed month is reviewed.
- [x] Expenses in the trend are operating plus capital; net income excludes capital. Retain labeled series and non-color distinctions.
- [x] Selecting a month updates its details: collected rent, recorded spending including improvements, and reviewed income or Not calculated.
- [x] View expenses for this month applies that chart month and opens Expenses while preserving the property scope.
- [x] Handle no-activity charts, negative net values, responsive scaling, and keyboard-equivalent month selection.
- [x] Collection health shows expected rent and Collected / Not yet due / Overdue segments and labeled amounts, each opening the correct ledger status.
- [x] Show overdue aging totals at 1–7, 8–30, and 31+ days and explain that late rent is not an expense.
- [x] Handle no billable tenancies without drawing misleading zero-percent charts.
- [x] Your monthly plan shows separate summed spending limits and reserve allocations, a no-plan state, and View budgets & suggestions navigation.
- [x] Property performance defaults to collected, switches collected/expenses/net, ranks descending, and shows the top three.
- [x] Unreviewed property income remains unavailable and ranks after numeric results; preserve negative-value presentation and missing-review messages.
- [x] Selecting a property focuses the entire report. View all appears above three properties and opens the full comparison page for the applied month.
- [x] Full comparison includes every property, the same metric switches/ranking, refresh/error states, and selection returning to the report with that property/month.

### 4.4 Expenses tab, review, and transactions

- [x] Lead the tab with the review card. Its action label stays Mark expenses reviewed until review succeeds; a reviewed scope shows the completion explanation instead.
- [x] Confirmation states the applied month/property or all properties, explicitly including zero-expense properties.
- [x] Keep reviewing cancels. Confirm shows Confirming… and prevents duplicate submission; failed review stays open with an inline error; success closes with Expenses reviewed feedback.
- [x] Tab, month, or property changes close/reset the review dialog. Capture and validate the committed request scope so an old request cannot confirm a different displayed selection.
- [x] Expense additions, edits, date moves, and deletions refresh the report/review status; affected property-months become unreviewed through existing database behavior.
- [x] Where expenses go includes categories active this month or the previous comparable period; sort by current spending descending.
- [x] Each row shows category, current amount, a bar relative to the largest category, prior comparable amount, and share of current spending.
- [x] Category spending includes operating and capital. No category activity shows the existing-style empty state.
- [x] Clicking a category opens transactions for exactly its applied month/property/category. Do not add a duplicate transaction list under the Expenses chart.
- [x] Transactions display description, amount, paid date, category, property, and operating versus improvement/replacement treatment.
- [x] Clicking Edit opens the selected expense, not a blank creation form.
- [x] Transactions use bounded 30-row descending `(spent_on, id)` keyset pages, Load more expenses, refresh, distinct loading/error/empty states, and safe duplicate handling.
- [x] An unknown expense-category parameter falls back to the unfiltered scoped transactions list, matching mobile.

### 4.5 Expense create/edit/delete modal

- [x] Add expense is available from every report tab and opens a fresh form seeded from the report property/month.
- [x] Default property is the applied owned property or first owned property. Default category is maintenance unless preset; furniture/turnover default to capital, others to operating.
- [x] Date defaults to today in the current report month, otherwise that report month's first day.
- [x] Required fields: Property, Category, Expense treatment, Amount, Date paid, Description, with required markers and live-correcting inline errors after submit.
- [x] Expense categories exclude emergency and vacancy. Changing category applies mobile's default treatment; the landlord can explicitly choose operating or capital.
- [x] Amount uses `formatPesoDisplay` / `handlePesoChange`, editable decimal input and thousands separators, with a raw numeric draft for validation/persistence.
- [x] Expense amount must be positive, at most `999,999,999.99`, finite plain decimal with at most two fractional digits; reject scientific notation and negative values.
- [x] DatePicker prevents future Manila dates; `validateExpenseDate` also rejects impossible dates and dates before 2000-01-01.
- [x] Persist `YYYY-MM-DD` calendar components without converting a chosen date through UTC.
- [x] Description is trimmed, nonblank, and at most 200 characters. Validate owned property, category, and treatment rather than trusting selector values.
- [x] On edit, property is locked; category, treatment, amount, date, and description remain editable. Expense identity/owner/property are never included in update fields.
- [x] Generate one retry-stable UUID per new draft with the web crypto API. Retrying an uncertain successful insert cannot create a second expense; match mobile's owner/property-checked duplicate recovery.
- [x] Save/Cancel and dismissal are guarded while busy; invalid forms never send requests. Errors retain the draft for retry; success closes with feedback and refreshes affected views.
- [x] Delete requires explicit confirmation explaining that it is irreversible and reopens month review. Failure keeps the editor/error available; success removes the record and updates affected lists/totals.
- [x] Closing/reopening starts the correct fresh or selected-record draft, clearing old errors and deletion state; background refresh must not overwrite an open draft.

### 4.6 Budget tab and category drill-down

- [x] Render Budget versus actual, Planned reserves, and Budget suggestions as distinct sections.
- [x] Group budgets with `groupBudgetsByCategory`: one row per `(kind, category)`, preserving shared category order and never merging reserves with spending budgets.
- [x] Spending rows show summed limit and recorded spending, property count or single-property name, progress, remaining/over-budget amount, and real percentage when over budget.
- [x] Actual spending includes improvements in that property/category. Show zero-limit behavior without division by zero or fake percentages.
- [x] Budget versus actual has Add and its own no-spending-limits empty state.
- [x] Reserves show the planned monthly amount and covered properties, not funded savings or expense consumption. Add presets emergency/reserve; retain a separate empty state.
- [x] Category selection opens the per-property drill-down with the applied month, property scope, category, and plan kind.
- [x] Drill-down shows applied context, plan type, totals line and property count; sort property rows by property name.
- [x] Spending-plan property rows show actual/limit/progress/overage; reserve rows show planned amount alone. Each opens its exact saved plan in edit mode.
- [x] Drill-down supports refresh, empty/loading/error states and Back to budgets; unknown budget category produces a not-found state, unknown kind defaults to expense.
- [x] Budget not found or a deleted plan opens a recoverable missing-record state, never an empty form that silently creates another plan.

### 4.7 Budget creation, editing, suggestions, and removal

- [x] Reuse one HeroUI form for spending budgets and planned reserves, both create and edit.
- [x] Seed month/property/category/kind from the launching action; validate presets before use. Default kind is expense and fallback category maintenance.
- [x] Required fields: owned Property, Plan type, Category, and monthly amount. Label the amount Monthly spending limit or Planned allocation this month according to kind.
- [x] Spending categories exclude emergency/vacancy; reserves can use all `FINANCE_CATEGORIES`. Switching to spending with a reserve-only category resets to maintenance.
- [x] Monthly plan amount permits zero; use the same maximum, decimal validation and peso editing helpers as mobile.
- [x] Optional fields are Amount still needed / annual bill and Months to spread this amount over. A supplied target must be positive and its months a whole number from 1 to 600.
- [x] Default months to saved value or 12 for insurance/taxes, otherwise 6. Without a target, save both target/months as null; do not invent a goal from the default months field.
- [x] Show the transparent monthly suggestion/basis from the existing shared helper; Use suggestion changes only the local monthly amount until Save.
- [x] Existing goal-based suggestions show category title, property, Based on your entries, amount/month, explanation, and Review suggestion.
- [x] Review suggestion opens the existing saved plan with only the validated suggested monthly amount overridden; preserve saved goals and locked identity fields. It must not save automatically.
- [x] Preserve all four goal starters: Insurance & property tax → insurance/reserve; Furniture & appliances → furniture/reserve; Vacancy & late payments → vacancy/reserve; Next tenant turnover → turnover/reserve.
- [x] Set a goal opens creation with its category/kind and applied scope. Retain guidance about known bills/replacement needs/essential costs without invented market figures.
- [x] Edit locks Property, Plan type, Category, and month. Amount and optional goal remain editable. Removal is offered only for an existing plan and requires explicit confirmation.
- [x] Save through the same property/month/category/kind upsert RPC. Repeated creation for that identity updates the existing plan rather than making a duplicate.
- [x] Save/remove has pending guards, retained errors/drafts, success feedback, and refreshes category totals, suggestions, overview plan totals and cash-after-reserves.
- [x] Preserve the current UI boundary: the shared helper supports reviewed-history averages, but mobile does not currently supply that history to its suggestions UI. Do not introduce history-based suggestions only on web.

### 4.8 Collection ledger and guidelines

- [x] Collection modal uses Collected / Not due / Overdue tabs with the applied billing month and status-as-of-today context.
- [x] Display property, tenant, selected amount (collected for Collected, outstanding otherwise), due date, and overdue aging label.
- [x] Use existing `landlord_rent_ledger`, status filtering, ascending-ID keyset pagination, 30-row pages, Load more, loading/error/retry/empty/close states.
- [x] Open property & tenancy links to the corresponding existing web property detail; it must not navigate to a mobile route or mutate payments.
- [x] Planning guidelines and How these figures are calculated share one reusable dialog with fixed title/close/footer and a scrollable body.
- [x] Preserve all guideline subjects: collected rent, operating income, improvements/reserves, expense review, payment dates/comparison, planning limits, and report inclusion/exclusions.
- [x] Include the non-tax/advice disclaimer, no-transfer/no-savings behavior, removed-listing exclusion, lease-end limitation, and current PayMongo test-funds notice. Got it closes the dialog.

## 5. Exact calculation and data contract

### 5.1 Reuse these sources, do not rederive them on web

| Concern | Shared/server authority | Required parity |
|---|---|---|
| Report totals, comparisons, categories, plan actuals | `get_landlord_finances(p_month, p_apartment_id)` | Same authenticated RPC, month as `YYYY-MM-01`, optional property |
| Rental-period dues/status | `landlord_rent_ledger` | Same due-day clamping, lease boundaries, confirmed payments, partial balances, aging |
| Expense review | `confirm_landlord_finance_month` + expense trigger | Same per-property/month confirmation and invalidation |
| Plan persistence | `save_landlord_finance_budget` | Same unique owner/property/month/category/kind upsert |
| Income and after-plan amount | `financeIncome`, `financeAfterReserve` | Import, do not copy arithmetic into JSX |
| Progress and grouping | `budgetProgress`, `groupBudgetsByCategory` | Same percentages, overages, ordering and aggregation |
| Suggestions | `suggestFinanceBudget` | Same inputs, rounding and explanations |
| Dates, report window, route parsing | `manilaToday`, `shiftFinanceMonth`, `financeMonthFromParam`, category/kind parsers | Independent of browser timezone |
| Validation and money input | `parseFinanceAmount`, `validateExpenseDate`, `budgetCategoryOptions`, `isBudgetCategoryAllowed`, peso helpers | Same accepted values and raw payloads |

### 5.2 Arithmetic invariants

Let `C` = report cash collected, `O` = recorded operating expenses, `K` = recorded capital spending, and `R` = sum of reserve-plan amounts in the applied scope.

1. **Recorded spending:** `O + K`.
2. **Net operating income:** `roundToCents(C - O)` only after every scoped property/month is reviewed; otherwise null.
3. **After spending & planned reserves:** `roundToCents(income - K - R)` only when income is available; otherwise null. Reserve subtraction is planning, not proof of money transferred.
4. **Headline:** income when available, otherwise collected rent. Never label collected rent as profit.
5. **Comparison delta:** income minus prior comparable `(collected - operating)` only if both scopes are reviewed; otherwise current collected minus prior comparable collected. No new percentage-change formula.
6. **Budget actual:** server-returned `spent` for that property/month/category, including both operating and capital expenses.
7. **Category group:** sum amounts and spending only for plans of the same kind/category. Use the returned scoped plans, not expenses from another property or unplanned categories.
8. **Budget progress:** `spent > amount` means over; percent is `Math.round(spent / amount * 100)` if amount is positive, otherwise null; difference is `Math.abs(amount - spent)`; visual width caps at 100. A zero limit with spending is over budget with a full bar and no percentage.
9. **Goal suggestion:** `Math.ceil(target_amount / months_remaining * 100) / 100`; rounds up to a cent. Never replace this with ordinary rounding.
10. **Reviewed-history helper branch:** only for spending budgets with at least three supplied reviewed months, rounds the average up to a whole peso; do not activate it without matching mobile inputs.
11. **Category share:** current category amount divided by total current displayed category spending, displayed to zero decimals. Its bar width is relative to the largest category, not that share.
12. **Performance:** collected = `C`, expenses = `O + K`, net = reviewed `C - O`; descending numeric order, unknown net after known amounts, unknown ties by property name.
13. **Aging labels:** no days late = not_due; 1–7, 8–30, and 31+ days retain the shared boundaries.

Do not add extra intermediate rounding or derive calculations from formatted peso strings. Preserve numeric payloads and call the existing helper for its exact rounding.

### 5.3 Cash-month and rental-period separation

- Cash totals count paid rows linked to a tenancy and rental period, by recorded payment date through the report cutoff; unclassified paid rows are excluded and disclosed.
- Operating and capital costs use `spent_on`, not creation time. Reserve plans are not rows in the expense ledger.
- Current-month comparisons use equal elapsed Manila days, capped to the preceding month's end. Past-month comparisons use the preceding full month.
- The selectable report window is 24 months. Trend data contains up to 12 months ending at the selected month and can be shorter at the history boundary.
- Income indicators span the entire current 24-month selection window and follow the draft property independently of the selected chart/report month.
- Collection health is the selected rental billing period evaluated as of today, not cash deposited during that calendar month. A partial paid balance can contribute to collected totals while its ledger row remains overdue/not due until fully paid.
- Ledger collected is capped at expected rent; outstanding never goes below zero. Pending/rejected payment attempts do not create rent dues. A due date equal to today is not overdue.
- Use the existing due-day clamping/move-in/lease-end rules and removed-listing exclusions from the RPC. Do not rebuild a competing ledger in browser code.

## 6. Implementation structure and state flow

### 6.1 Proposed file map

These are intended targets, not instructions to create every helper regardless of need. Reuse/extend existing components first; keep presentation platform-specific and pure rules shared.

```text
apps/web/app/landlord/analytics/
  page.tsx                       # Server access boundary and page entry
  loading.tsx                    # Shape-matched route skeleton
  AnalyticsClient.tsx            # Scoped report composition
  components/                    # HeroUI finance cards/charts/modals, direct imports
  category-expenses/page.tsx      # Scoped paginated expense list
  category-expenses/CategoryExpensesClient.tsx
  budget-category/page.tsx        # Scoped category → property plans
  budget-category/BudgetCategoryClient.tsx
  property-performance/page.tsx   # Full comparison and report-focus navigation
  property-performance/PropertyPerformanceClient.tsx
apps/web/hooks/use-landlord-finances.ts
apps/web/service/landlordFinanceService.ts
apps/web/lib/landlord-finance-access.ts
apps/web/lib/landlord-finance-params.ts
apps/web/lib/landlord-finance-fixtures.test.mjs  # exists (parity fixtures, Phase 1); Phase 2 may add landlord-finance.test.mjs
packages/utils/src/landlordFinance.ts  # Only necessary shared, pure additions
```

If the drill-downs reuse most components, keep them in the route's `components/` rather than promoting one-off finance components to a global library. Use `apps/web/service/` (singular), the existing project convention.

### 6.2 Access and requests

- Reuse `@repo/supabase/server` for server access checks and the supported web browser client (`@repo/supabase/browser` / `@supabase/ssr`), never the mobile default client.
- Server guard verifies the authenticated user and active, nonsuspended landlord membership, resolves internal `public.users.id`, and protects all finance routes. A mixed admin/landlord can access their own finances; admin-only, tenant-only, signed-out, and suspended access cannot read/mutate this feature.
- Do not introduce an unrelated verified-account requirement; finance ownership/membership rules are the authorization model.
- Client session awareness reuses `useUser()`/the shared profile cache rather than adding parallel profile requests or a global session context.
- Mirror the existing transport operations and column-scoped writes. Match zero-row failure detection (`select(...).single()`) for save/delete rather than reporting success when nothing was changed.
- Calls remain session-bound, RLS-protected, and caller-owned. Never use service-role credentials or add a broad admin bypass.
- Keep read/error normalization safe; do not log descriptions, payment references, financial drafts, or full RPC payloads.

### 6.3 Shared rules without mobile imports

- Do not import `apps/mobile` components, hooks, services, Expo crypto, React Query, or portal stores into web.
- Move dependency-free finance payload/types and duplicated pure normalization/validation/presentation derivations into `@repo/utils` only when both platforms need them; update mobile imports minimally and cover with regression tests.
- Candidate shared extractions include report decoding, expense/budget form validation/default rules, comparison derivation, and performance ranking. Prefer one shared implementation where the same business decision would otherwise be duplicated.
- Platform transport stays in its app service; any shared request helper must accept an explicit typed client/dependency and must not import the mobile singleton.
- Do not refactor unrelated dashboard/auth/navigation behavior as part of this work.

### 6.4 Resource ownership, refresh, and races

- Build web data hooks on memoized loaders and `useAsyncResource`; React Query and Zustand remain mobile-only.
- Identity of a resource includes the current account/internal owner, applied month, optional property, and list category/status. Clear/remount account-scoped clients on account change and reject late results from the former account.
- Keep initial loading distinct from refreshing. Retain same-scope settled data on refresh; do not display prior-scope amounts as if they belonged to newly applied filters.
- URL state owns applied report filters/tab; local state owns filter drafts, modal selection, editor drafts, chart controls, and pending/error state. Reopening forms reseeds once; background data changes do not reset an active draft.
- Fetch transaction/collection pages only when their page/modal is active. Keep cursors scoped and discard superseded page responses after filter/status changes.
- After expense mutation, invalidate/reload affected report windows, review flags, expense lists and income-summary resources for that owner; handle old and new months on a date move. A report window may contain the edited month even if it is not its final month.
- After budget mutation, refresh affected report/budget-category/plan-summary views; after review, refresh reviewed income, comparisons, performance and trend eligibility.
- Invalidate inactive cached scopes if a small cache is used; otherwise let unmounted resources load fresh. Do not add a global caching framework just for this feature.
- Cross-device realtime finance subscriptions are not required by current mobile behavior. Provide refresh/reopen parity; do not claim live push updates unless implemented and tested separately.

## 7. Loading, failure, accessibility, and responsive requirements

- [ ] Initial skeleton matches earnings summary, rows, tabs, and selected tab content rather than copying dashboard stat tiles. No misleading zero values while loading.
- [ ] Header actions remain visible but disabled until required report/ownership data is ready.
- [ ] Separate no-properties state with a create-property action, access restriction, initial report failure with Retry, inline list/pagination failures, empty data, and missing plan/category states.
- [ ] Missing finance table/RPC returns the existing deployment-needed support message; never substitute dummy data, fake totals, or the legacy revenue dashboard.
- [ ] Background refresh failure retains valid same-scope content with a visible retry notice. Page-count/pagination failures preserve already loaded rows.
- [ ] Every modal has a heading, meaningful label, predictable Escape/backdrop behavior, focus trapping/restoration, scrollable body, and reachable footer.
- [ ] Block dismissal/submission conflicts during save/delete/review. Confirmations do not create an uncontrolled stack of focus-trapping dialogs; return focus to the triggering editor action.
- [ ] Use one active editor at a time. Account changes or access loss close editors and clear sensitive drafts/results.
- [ ] Charts have labeled values and keyboard alternatives; unknown/negative/over-budget states never depend on color alone.
- [ ] Required fields and errors are programmatically associated; invalid submit focuses the first invalid field. Icon-only actions have labels; pending/error outcomes are announced.
- [ ] Desktop tables remain usable with keyboard and narrow-screen card alternatives; long names and large peso amounts do not obscure actions.
- [ ] Verify light/dark themes and narrow/medium/wide viewports, including mobile navigation and notification-bell clearance. Keep motion minimal and honor reduced-motion preferences.

## 8. Continuous implementation sequence

Do not stop at a tab or phase. Complete all feasible items, then run the full acceptance checklist.

### Phase 1 — Freeze contracts and establish parity fixtures

- [x] Work on a feature branch; inspect and preserve all pre-existing edits (done: `feature/web-profit-analytics` is created and checked out, and this plan is committed on it).
- [x] Ignore or remove `apps/mobile/build-preview.apk` (a `*.apk` .gitignore rule now covers it).
- [x] Re-read current mobile finance files/tests and mark any changes since this baseline before porting (post-baseline commits are presentation-only — input patch, option-sheet padding, removal trash icon — and zero calculation or flow drift).
- [x] Create fixtures for shared arithmetic, report decoding, valid/invalid forms, reviewed/unreviewed scopes, grouped plans, and partial rent collections (`packages/utils/src/landlordFinanceFixtures.ts`; asserted identically by the mobile Jest suite and `apps/web/lib/landlord-finance-fixtures.test.mjs`).
- [x] Extract only necessary shared pure rules/types so web and mobile cannot diverge in calculations and validation (now in `@repo/utils/landlordFinance`: payload types + `decodeFinanceReport`, income-summary fallback, keyset pages, performance ranking, comparison sentence, form defaults/goal entry; `landlordFinance.ts` stays import-free because `scripts/db-populate` and web node tests import it directly).
- [x] Verify backend dependencies against the active app's project before any remote investigation; no remote mutation/deployment is authorized by this plan (verified read-only against in-repo migrations: `get_landlord_finances`, `landlord_rent_ledger`, `save_landlord_finance_budget`, `confirm_landlord_finance_month`, both tables, grants and mixed-role RLS; no remote queries were run).

### Phase 2 — Web entry and resource layer

- [x] Add route/access boundary, URL parsing, navigation, loading shell, typed web service and scoped hooks. (server guard `lib/landlord-finance-server.ts` (`requireLandlordFinanceViewer`), pure access/params in `lib/landlord-finance-access.ts` + `-params.ts`, nav entry in `app/landlord/layout.tsx`, route `app/landlord/analytics/` (page + loading + AnalyticsClient + skeleton), transport `service/landlordFinanceService.ts`, hooks `hooks/use-landlord-finances.ts`)
- [x] Implement report, indicator fallback, paginated expense/collection reads, expense save/delete, budget save/delete, and review operations. (report via `useAsyncResource` with `financeErrorMessage` mapping, gated income-month fallback loader, keyset lists on the pure pages controller `lib/landlord-finance-pages.ts`, five write operations each with pending/error state, transport mirrors the mobile service line for line)
- [x] Add account-transition, request-race, stale-scope, and error handling tests before wiring forms. (17 node tests in `lib/landlord-finance.test.mjs` covering scope-change supersede, overlapping reload, same-key idempotent open, single-flight load-more with stale discard, first-page error + retry, page-error row retention, refresh row retention, reset; `financeErrorMessage` fixtures added to both shared runners)

### Phase 3 — Shared report context and Overview

- [x] Implement filter modal, earnings summary/breakdown/guidelines, all Overview cards/charts/actions, collection ledger modal, and full property-performance page. (`app/landlord/analytics/components/`, guarded `property-performance/`; includes reserve creation and review confirmation needed by Overview actions, with destination-tab report summaries; broader editing remains in Phases 4–5.)
- [x] Verify cash totals and rental-period totals are presented as different measures, not forced to match. (Browser fixture intentionally uses ₱50,000 cash receipts versus ₱10,000 billing-period collections / ₱70,000 expected rent; UI retains distinct descriptions and amounts. Isolated browser coverage and runnable setup: `apps/web/tests/finance/README.md`.)

Phase 3 verification: web lint/typecheck/build and 307 node tests pass; mobile lint and 148 Jest suites / 1,176 tests pass; population-command tests pass (18 pass, 2 opt-in database tests skipped). The browser fixture passes filter, indicator, chart, ledger, reserve/review, refresh/stale-scope, empty-state, account-loss and 390/768/1280px light/dark checks with external requests blocked. A live authenticated Next.js journey and same-account web/mobile comparison are not claimed by those isolated checks and remain final acceptance work. The finance-only signed formatter also corrects loss display on mobile; arithmetic is unchanged.

`graphify update .` was attempted after the implementation; extraction completed, but the existing shrink guard refused to overwrite 8,996 stored nodes with 8,653 extracted nodes. No forced rebuild or label overwrite was performed; pre-existing graph output remains dirty.

### Phase 4 — Expenses and review

- [x] Implement review confirmation, expense-category bars, transaction drill-down, and create/edit/delete modal. (`ExpensesTab` mirrors the mobile review card with the same confirm copy/toast, bar list mirrors the mobile "Where expenses go" chart and opens `category-expenses` routes via `financeCategoryHref`; the drill-down is `app/landlord/analytics/category-expenses/` with a guarded server page that revalidates the typed category through the shared `parseFinanceCategoryParams`, a keyset paged list beside the report, property naming on cross-property rows, and an empty state; `ExpenseEditorModal` mirrors mobile `ExpenseEntrySheet` — shared validation/date bounds/treatment defaults from `@repo/utils`, property locked while editing, two-step quiet delete, drafts surviving failures, focused first invalid field — and toasts "Expense saved" on success like mobile's page handlers; the report toolbar gains a matching "Add expense" create editor, both write paths clear their union-guard errors and refresh lists, and busy operations block applied-scope navigation. The Budget tab stays Phase 3's readable summary, now grouped by the shared `groupBudgetsByCategory` rule; the grouped progress chart and editors follow in Phase 5.)
- [x] Verify date moves affect both months and that no income remains calculated after its review is invalidated. (The fixture transport mirrors the DB trigger rules: per-month `reviewedMonths`, and insert/edit/delete reopen the review for both the source and destination month of a row's date. Browser coverage: after a delete and after an October row moved to `2026-09-28`, the Overview falls back to "Not calculated" with the review action reappearing, both months read as reopened, and the moved row is listed only in its destination month.)

Phase 4 verification: web lint/typecheck/build and the extended node tests (19 pass, adding drill-down category parsing and `financeCategoryHref` pure rules) pass; the browser fixture passes a Phase 4 interaction block end to end (twice consecutively): review card copy and toast, category bar → URL/headers, keyset "Load more" and trail exhaustion, cross-property naming, editor open with disabled property select, invalid amount/description/date error messages, failing save keeping the draft then retrying, delete's two-step confirm, review invalidation for delete and both-month date move, destination-month visibility, list refresh failure with retained rows + retry, and empty category/empty-month states — external requests blocked. The fixture now mounts the app's `Toast.Provider` (toasts were silently unrendered before) and tracks per-month review state like the database triggers. Live authenticated journey and same-account web/mobile comparison remain final acceptance work.

`graphify update .` was attempted after the implementation. Extraction completed, and the shrink guard again refused to replace the stored graph with the smaller raw extraction (8,683 extracted vs 9,091 stored; the same pre-existing shortfall Phase 3 saw, not caused by this phase's one deleted file). No forced rebuild or label overwrite was performed. The tool still wrote its fail-closed merge — 9,121 nodes built at the current commit, carrying code nodes for every Phase 4 file and dropping the deleted `ReportTabSummary.tsx` — so the graph reflects this phase even though the raw extraction was rejected.

### Phase 5 — Budgets and reserves

- [x] Implement grouped budget/reserve sections, category/property drill-down, create/edit/remove modal, suggestions, and all goal shortcuts. (`BudgetTab` now mirrors mobile's `BudgetProgressChart` in three sections — "Budget versus actual" (grouped by the shared `groupBudgetsByCategory`, one row per kind/category with the summed limit, recorded spending, property count or name, progress, remaining/over amount and a real percentage when over), "Planned reserves" (planned amount and covered properties, with its own empty state and an emergency/reserve Add preset), and "Budget suggestions" (the shared goal-based suggestion with title, property · "Based on your entries", amount per month, basis and "Review suggestion", plus all four goal starters with mobile's guidance copy); the new guarded `/landlord/analytics/budget-category` route revalidates the typed category and kind through the shared `parseFinanceBudgetParams` (unknown kind reads as spending limits) and lists each property's plan with actual/limit/progress/overage, reserves showing the planned amount alone, a totals line, refresh, empty/loading/error states, a missing-category state and Back to budgets; `PlanBudgetModal` is now one create-and-edit form — identity fields (property, plan type, category, month) lock while editing, the goal fields and transparent suggestion stay editable, "Use suggestion" changes only the local amount until Save, removal is offered only for an existing plan and needs explicit confirmation, and a plan removed while its editor is open shows a missing-record state instead of silently recreating it.)
- [x] Verify locked identity fields, zero budgets, overages, suggestion review versus save, repeated upserts, and null goal persistence. (Browser fixture coverage: the group row hides a single over-limit plan (₱4,200 of ₱3,000 → over by ₱1,200, 140% used) while the drill-down shows it, a zero limit shows "₱ 0 remaining" with no percentage, editing a saved plan locks property/plan type/category and keeps its month, saving the same plan again updates that row instead of adding a second one, a plan saved without a goal keeps its target and months null, "Review suggestion" opens the saved plan with the suggested amount without saving on its own, removal is two-step and removes the plan, and an unknown category or kind falls back to the missing-category state or spending limits.)

Phase 5 verification: web lint/typecheck/build and the node tests (311 pass, adding the budget kind/parse/href rules) pass; mobile lint and 148 Jest suites / 1,176 tests pass; population-command tests pass (18 pass, 2 opt-in database tests skipped). The browser fixture passes a Phase 5 block end to end (three consecutive clean runs): the three Budget sections, group rows with the shared arithmetic (including the zero limit and the grouped-versus-single overage difference), the category drill-down with its per-property rows, totals line, missing-category and unknown-kind states, the plan form's locked identity fields, goal suggestion, "Use suggestion", two-step removal, repeated upsert, and both plan empty states. The fixture's plan transport now mirrors the database upsert (one plan per property/month/category/kind) and reports only the applied scope's plans. The expense editor's date field also gained a real label/control pairing, and the browser suite now clears that field with key events because an empty programmatic fill can be swallowed by React's value tracker. Live authenticated journey and same-account web/mobile comparison remain final acceptance work.

`graphify update .` was attempted after the implementation. Extraction completed, and the shrink guard again refused the raw extraction (8,703 extracted vs 9,121 stored — the same pre-existing shortfall seen in Phases 3 and 4). No forced rebuild or label overwrite was performed, per the standing decision to leave the guard armed. The stored graph therefore still predates this phase's new drill-down route, and stays dirty as the pre-existing output does.

### Phase 6 — Hardening and finish

- [ ] Complete every empty/error/loading state, focus path, responsive layout, and account/role test.
- [ ] Update ARCHITECTURE.md §12.1 and DESIGN.md §11 to document actual web parity and presentations; update AGENTS.md only for durable changed conventions. No token changes are expected.
- [ ] Run all verification below, fix introduced regressions, and run `graphify update .` after implementation edits.
- [ ] Re-read this plan and mobile source to confirm no feature/action was dropped. Report unresolved blockers explicitly instead of marking them complete.

## 9. Verification and acceptance

### 9.1 Calculation fixtures — identical outputs on web/mobile

| Fixture | Required result |
|---|---|
| C=50,000, O=11,500, K=3,000, R=7,500, reviewed | Income ₱38,500; after spending/reserves ₱28,000 |
| Same amounts, unreviewed | Income and after-plan amount null / Not calculated; headline collected rent |
| C=50,000, O=60,000, reviewed | Negative income −₱10,000 remains visible |
| Limit 3,000; spent 4,200 | Over by ₱1,200; 140% used; bar width 100% |
| Limit 0; spent 0 | Remaining 0, no percentage, empty bar |
| Limit 0; spent 500 | Over by ₱500, no percentage, full bar |
| Goal 12,000 / 12 | Suggested ₱1,000 per month |
| Goal 100 / 3 | Suggested ₱33.34, not ₱33.33 |
| Same category in two properties plus a reserve | Spending sums across those plans; reserve stays separate |
| 2026-10-16 16:30 UTC | Manila date 2026-10-17, regardless of browser timezone |
| Current day exceeds prior month length | Previous comparison ends at the previous month's last day |
| 1, 7, 8, 30, 31 days late | Correct shared aging boundaries |
| Part-paid rent and failed checkout attempts | Paid amount reduces balance once; failures do not add dues |

Also test oldest allowed month, shorter chart windows, leap days, due day 31, move-in after due day, ended leases, deleted properties, unclassified receipts, and a selected property with zero costs but no review.

### 9.2 Automated coverage

- [ ] Web `node:test` coverage in `apps/web/lib/*.test.mjs` for shared helpers used by web, parameter parsing, report decoding, form rules, comparison/ranking, scoped refresh/race helpers, and pagination/idempotency behavior where dependency injection permits.
- [ ] Keep shared Jest/fast-check finance tests passing; extend shared-rule tests for extracted behavior and preserve mobile finance component/screen/service tests.
- [ ] Browser interaction checks for filters Apply/Reset/Cancel, indicator retry, URL/back navigation, every tab/action, forms/validation/deletion, review failure/retry, suggestions, pagination, focus, chart keyboard controls, and responsive/theme states.
- [ ] If a browser-test runner is not already installed, use the available Playwright testing workflow without adding a permanent dependency silently; record runnable checks and clearly label any manual-only verification.
- [ ] Test owner A versus owner B, mixed admin/landlord, landlord/tenant, admin-only, tenant-only, signed-out, suspended, sign-out/account switch while a read is pending, and access loss while an editor is open.
- [ ] Run local finance SQL regression coverage if a disposable local database is available, especially if any shared backend change becomes necessary. Use `supabase/test-support/landlord-finances-bootstrap.sql` only in an empty disposable database, never a hosted project.
- [ ] Compare web and mobile against the same authorized fixture account, report month/property, and data snapshot. Match every displayed amount and saved payload, not just a screenshot of the headline.

### 9.3 Commands after implementation

```bash
pnpm --filter web lint
pnpm --filter web typecheck
pnpm --filter web test
pnpm --filter web build
pnpm --filter mobile lint
pnpm --filter mobile exec jest --runInBand
graphify update .
```

Run `pnpm db:populate:test` as well if generator/shared-rule changes touch its dependencies. Do not run hosted demo-population writes for this feature. Report environmental build/database/browser blockers and tests not run rather than claiming they passed.

## 10. Definition of done

The landlord can complete every mobile finance journey on web using HeroUI controls and appropriate web modals/pages. All three tabs and their supporting views are present; records are shared across platforms; calculated numbers and accepted inputs agree; expense review and owner-only access remain enforced; the existing dashboard/payment experience is unchanged; and automated plus browser checks substantiate parity.

Completed phase work is tracked above. Remaining phases and acceptance checks stay open until implemented and verified.
