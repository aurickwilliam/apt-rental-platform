# Finance Overview browser checks

`overview.browser.py` mounts the actual finance components and hooks in an isolated browser fixture. Only session identity, finance transport, and Next navigation are replaced with in-memory fixtures. All external browser requests are blocked: **no hosted Auth, database, payments, or storage calls are made**.

This checks UI behavior, not Supabase authorization or a full authenticated Next.js journey. The server guards have pure access tests and the real routes must also pass `pnpm --filter web build`. Live same-account web/mobile comparison remains an acceptance check for the completed feature.

Install test tools in a temporary directory, not this workspace (no permanent dependency required):

```sh
work="${TMPDIR%/}/apt-finance-browser"
mkdir -p "$work"
python3 -m venv "$work/python"
"$work/python/bin/pip" install playwright
"$work/python/bin/python" -m playwright install chromium
npm install --prefix "$work/tools" esbuild
pnpm --filter web build
FINANCE_ESBUILD_PATH="$work/tools/node_modules/esbuild" \
  node apps/web/tests/finance/build-fixture.mjs "$work/preview"
FINANCE_BROWSER_OUTPUT="$work/preview" \
  "$work/python/bin/python" .agents/skills/webapp-testing/scripts/with_server.py \
  --server "python3 -m http.server 4387 --bind 127.0.0.1 --directory $work/preview" \
  --port 4387 -- "$work/python/bin/python" apps/web/tests/finance/overview.browser.py
```

Coverage: draft Apply/Reset/Cancel/Escape; property search; month bounds and indicator failure/retry; URL preservation/back; earnings review gating and guidelines/focus restoration; trend controls and keyboard month selection; billing-period versus cash totals; collection status/amounts and page failure/retry; reserve validation, goal-free payload, retained draft on save failure; review failure/retry; full comparison and negative income; refresh retention versus stale-scope hiding; account-access loss; 390/768/1280px light/dark screenshots and overflow checks.

Phase 4 (expenses) adds: the expenses review card with confirm dialog and success toast; "Where expenses go" bars opening `/landlord/analytics/category-expenses` (the fixture serves report, comparison and this drill-down route through its navigation shim — direct entries go through the same pushed-history path, so the static server only needs `index.html`); keyset "Load more" and trail exhaustion (fixture page size 2); cross-property rows naming their property; the shared expense editor (validation, disabled property while editing, drafts surviving a failing save, two-step quiet delete, "Expense saved" toast — the fixture mounts the app's `Toast.Provider`, so toasts render like the real app); per-month review invalidation on expense writes including a date move reopening both months; first-page refresh failure with retained rows and retry; and empty category/month states.

Fixture transport notes: `financeTest.reviewedMonths` is the per-month review store (writes reopen months per the database trigger rules), `financeTest.expensePageSize` is deliberately 2, and `financeTest.expenseFail` fails list reads and expense writes together. Screenshots are written to `FINANCE_BROWSER_OUTPUT`.
