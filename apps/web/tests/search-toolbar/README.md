# Search toolbar browser regression

Manual browser suite for the tenant Browse search toolbar. It renders the real
`app/browse/components/SearchContainer` (bundled with esbuild and the app's
Tailwind CSS) and measures it at phone, tablet and desktop widths.

It is separate from `pnpm test` because it needs a browser and a one-off
esbuild install; the source-level contract is already covered by
`lib/search-toolbar-responsive.test.mjs`.

## What it checks

- **320 / 360 / 375 / 391px**: full-width pill above right-aligned actions.
- **392 / 393 / 430px**: compact single row, with a flexible pill and unchanged
  44px buttons / 4px gaps (8px in the fallback and on desktop). The short hint
  is "Search by apartment name...", truncated with an ellipsis to fit; the
  editable field stays at least 154px empty and 118px with
  Clear visible. No overlap or
  horizontal scrolling. The switch measures 336px of usable hero width,
  not a device name; a constrained-container case checks this independently.
- **640 / 768 / 1024 / 1440px**: one row again, unchanged from the pre-fix
  desktop layout, with the full native placeholder painted.
- Typing a long query scrolls the caret into view, Clear stays inside the pill,
  focus shows the ring, Tab follows visual order, and Enter submits apartment,
  city and barangay search terms. All three actions respond. A reduced-height
  viewport preserves the draft and focus; this simulates keyboard space but
  does not test a physical phone's virtual keyboard.
- Light and dark themes keep the same geometry and a readable hint.

Screenshots are written to the output directory.

## Prerequisites

- Python Playwright with a Chromium install. The suite launches Edge with
  `channel="msedge"`; change that line if you use another Chromium channel.
- A local `esbuild` install. Any esbuild package directory works.

## Build the fixture

Run from `apps/web` (PowerShell):

```powershell
$env:BROWSE_ESBUILD_PATH = "C:\path\to\node_modules\esbuild"
$env:BROWSE_BROWSER_OUTPUT = "$env:TEMP\opencode\search-toolbar"
node tests/search-toolbar/build-fixture.mjs $env:BROWSE_BROWSER_OUTPUT
```

`build-fixture.mjs` bundles `fixture-app.jsx`, compiles `app/globals.css`, and
scans `SearchContainer.tsx`, `browse-layout.ts` and the fixture for the utility
classes it should keep. If a shared row/hero class goes missing from the CSS,
desktop measurements become meaningless, so add any new class source to that
scan list.

## Run

```powershell
$env:BROWSE_BROWSER_OUTPUT = "$env:TEMP\opencode\search-toolbar"
python tests/search-toolbar/search-toolbar.browser.py
```

A passing run prints four `PASS` lines and exits `0`.

## Fixture notes

- Filter and Ava are same-shape stand-ins so the toolbar can be measured
  without their drawers; the map entry and the in-pill magnifier are real.
- The router, image, dynamic-import and favorites doubles come from
  `tests/recommendations/fixture-transports.jsx`; the fixture owns the
  `#fixture-actions` status line.
- Append `?dark=1` to exercise the dark theme.
- No Supabase project, account or production data is touched.
