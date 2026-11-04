# Tenant rental-management browser regression

Run from `apps/web`, with Python Playwright, Edge and a local esbuild install:

```powershell
$env:BROWSE_ESBUILD_PATH = "C:\path\to\node_modules\esbuild"
$env:RENTAL_BROWSER_OUTPUT = "$env:TEMP\opencode\tenant-rental"
node tests/tenant-rental/build-fixture.mjs $env:RENTAL_BROWSER_OUTPUT
python tests/tenant-rental/tenant-rental.browser.py
```

The fixture renders real My Rental, application cards/filter controls,
application details/accordions/cancel modal, Maintenance page/form/history,
the real maintenance-selection hook and real cancellation/reconciliation hooks.
Auth, reads, financial figures and mutation transports are synthetic. External
requests are blocked; no Supabase URL or credentials are loaded.

Coverage:

- 320/375/393/430/768/1280/1920px with no horizontal overflow.
- Repair entry links, no-tenancy absence, all five application statuses,
  multiple cards, filter selection, newest/oldest sorting and empty lists.
- URL-backed filter/sort survive a reload (with unrelated params preserved),
  card links carry a canonical validated return target, Back uses browser
  history only for a fresh in-tab list visit, and direct/unsafe `from` values
  fall back to `/tenant/my-rental`; list scroll is restored once.
- Missing card photos and the detail hero fall back without empty image boxes.
- Four application accordions, listing destination derived from the
  application, existing visit statuses and conditional retry.
- Cancel first-click confirmation, Keep, pending-write lock/Escape refusal,
  failed cancellation, keyboard retry and success-only navigation.
- Maintenance empty states/history without an active lease, real selection
  among multiple owned rentals and form submission to that selected fixture
  tenancy/apartment. Photos/notes/statuses remain production UI components.
- Dark theme and runtime errors. Screenshots are written outside the repo.

This is not a live RLS or billing test. Actual authorization is covered by the
isolated PGlite suite in `scripts/maintenance-authorization/`; billing remains
covered by the existing suites. Refer to `docs/tenant-rental-management.md`
before any production release, especially the Supabase GitHub integration hold.
