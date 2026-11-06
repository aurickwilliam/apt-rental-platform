# Settings Rental Preferences save and dismissal regression

## Confirmed causes

Before the fix, the real Settings/form/action flow with an isolated database
transport completed one write, persisted Parking and issued a recommendation
refresh, but Settings stayed open. `RentalPreferencesTab` awaited `form.save()`
without using its boolean result, and had no success-close callback. The X
worked after a settled successful write; no permanent X/focus trap was reproduced.
Failed writes retained dirty drafts and opened the existing discard confirmation
when closed, which also worked on its first open. Those dialog mechanics are kept.

The old footer was sticky **inside** the scroll area, with `pb-28` used as a
clearance workaround. A 1280×800 browser reproduction found a Home control
starting at y=679 underneath Save starting at y=676. It could intercept controls
as they scrolled past, including the Parking group. The footer is now a separate,
non-shrinking flex row outside the rental fields' scroller; other tabs keep their
original scrolling classes. No extra bottom spacer or global overlay hack is used.

The server action also previously accepted any error-free UPDATE as success,
including an update returning no matching row. It now requests only `id` from the
same caller-bound write and confirms it matches the profile it already checked.
There is no schema/RLS change or full-profile read-back.

## Save contract

- The hook synchronously locks duplicate submissions before React repaints;
  validation failures do not start a request and `finally` releases pending state.
- Success retains the existing profile-cache notification and recommendation
  refresh, then invokes the parent's close callback directly. It does not route
  through a stale dirty/saving dismissal guard.
- Errors, thrown requests and zero-row writes keep Settings open, retain drafts,
  show a footer error and allow retry. X/Escape still use the existing unsaved
  change confirmation. While a write is unresolved, dismissal remains guarded;
  there is no speculative timeout that could falsely claim a save failed.
- `BudgetRangeField`'s `commit` accepts an optional callback with the resolved
  range so submitting in the same event cannot save the caller's previous render.
  Existing callers can still call `commit()` for a boolean. Parsing, snapping,
  inclusive preset values and matching/ranking semantics are unchanged. A rejected
  budget draft also produces a visible footer error rather than only an offscreen
  field message.

## Automated coverage

`lib/settings-preferences-save.test.mjs` exercises the real action and hook:
duplicate presses before repaint, success/failure/throws/validation, lock release,
draft retention, confirmed-row checks, atomic budget submission and direct
success-close wiring. It checks that the footer is a sibling of the scroller.
`lib/recommendation-budget.test.mjs` still connects the form/action payload to a
normalized recommendation reload and verifies the exact saved budget boundary.

The browser bundles the production Settings modal, rental tab, budget/select
controls, form hook, save action, General tab, and installed HeroUI/CSS. Only
database/profile/Next/theme transports and unrelated tab content are isolated.
It tests successful save and reopen, Parking/Spots/Vehicles persistence, refresh
and invalidation, failures and zero-row writes, pending state, X/Escape/backdrop,
discard/keep editing, focus restoration, custom/invalid budgets and footer geometry
at 1280×800, 900×600, 1024×520 and 390×844. All clicks use ordinary hit testing,
not forced clicks or disabled/inert bypasses. Checkbox/switch clicks target the
real visible label, not the native visually hidden input.

These are isolated persistence tests, not verification of an identified hosted
account. No environment credentials or hosted Supabase records are used.

## Run

From `apps/web`:

```powershell
node --experimental-strip-types --test lib/settings-preferences-save.test.mjs lib/recommendation-budget.test.mjs lib/card-preferences-profile.test.mjs lib/tenant-preferences.test.mjs
$env:SETTINGS_ESBUILD_PATH = '<path to an available esbuild module>'
node tests/settings-preferences/build-fixture.mjs '<temporary output directory>'
python -m http.server 8785 --bind 127.0.0.1 --directory '<temporary output directory>'
```

In another terminal, with Python Playwright and Chromium installed:

```powershell
$env:SETTINGS_FIXTURE_URL = 'http://127.0.0.1:8785'
$env:SETTINGS_BROWSER_OUTPUT = '<temporary screenshot directory>'
python tests/settings-preferences/settings.browser.py
```

Screenshots stay outside the repository. Design values and interaction primitives
remain those in the root `DESIGN.md` and installed HeroUI; Settings is not redesigned.
