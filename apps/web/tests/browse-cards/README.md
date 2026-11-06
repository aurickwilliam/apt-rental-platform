# Web apartment-card regression

This fixture bundles production Browse rows/grid, ApartmentCard, hover hook,
preview, saved-preference chip rules and the installed HeroUI with production
CSS. Only Next navigation/images and profile/Favorite transports are replaced.
It does not read environment files or write to Supabase.

## Behavior

- One list-level consumer reuses the existing account-keyed `useUser` cache.
  Confirmed Settings/onboarding preference saves invalidate that cache once and notify its
  consumers; the existing router refresh reloads recommendation rows.
- Chips and preview summaries are exclusive to `RECOMMENDED_SECTION_ID` (`for_you`),
  never inferred from a title or an apartment match. Hover identity includes the
  source section, so the same apartment cannot carry its summary to a city row.
  Generic/search/filter grids never supply preference labels.
- Chip rules come from `buildPersonalizedRowSpecs` in `@repo/utils`. Scoring and
  ranking are unchanged. City uses its saved exact identifier; budget and bedroom
  labels use exact inclusive bounds, not soft-score near matches. Pet/parking
  rows define amenity preferences: all matching earns “Matches amenities”; a
  partial match is named “Pet-friendly” or “Parking available”. Default/skipped
  preferences and unknown listing fields make no claims. Fixed discovery RPC
  responses that omit amenities cannot earn an amenity chip; no extra per-card
  read or backend change is added to guess them.
- `PreferenceMatchChips` renders at most two primary chips below location and a
  subtle “+N more” count (with the remaining matches in its accessible label).
  The Recommended preview uses one count and a concise full match breakdown,
  not a repeated chip cluster. Empty context renders nothing, including spacing.
  Both use existing APT surface/text tokens.
- Preview content uses 16px padding: an 18px semibold Nunito title (at most two
  lines) with a muted 13px location, then 24px semibold monthly rent and a smaller
  “/ month” suffix beside its rating. A horizontal 12px specification row uses
  consistent 14px icons. Only the Recommended match explanation has a subtle
  separator, a small check icon and the dynamic sentence “Matches N of your
  preferences”, followed by its muted breakdown. The width stays 320px; placement
  allows for taller titles and short viewports can scroll. Standard cards are unchanged.
- A mouse must stay over non-control card content for 450ms. Control entry
  cancels dwell; body re-entry starts a new dwell. Leaving allows a 150ms grace,
  then a 160ms pointer-transparent exit. New cards, page/row scrolling, Escape
  and apartment navigation retire timers immediately. A preview's internal
  scroll remains usable in a short viewport.
- Opening retains the expanding design with a 240ms ease-out, a small 4px shift
  and scale bounded to 0.97–1. Reduced motion disables movement. Placement stays
  inside the Browse region and viewport.
- Navigation and Favorite are sibling HeroUI buttons, not nested interactive
  elements. The redundant visible Close/X button is omitted; Escape, pointer
  leave and scroll still dismiss. Navigation never waits for hover. The fixed preview
  checks the actual hit stack and yields when it covers an underlying Favorite;
  no global pointer-event workaround or raised source-heart z-index is used.

## Run

From `apps/web`, set `BROWSE_ESBUILD_PATH` to an available esbuild module outside
the app (or one already installed), then build into a temporary directory:

```powershell
$env:BROWSE_ESBUILD_PATH = '<absolute path to esbuild module>'
node tests/browse-cards/build-fixture.mjs '<temporary output directory>'
python -m http.server 8769 --bind 127.0.0.1 --directory '<temporary output directory>'
```

In another terminal, with Python Playwright and Chromium installed:

```powershell
$env:BROWSE_FIXTURE_URL = 'http://127.0.0.1:8769'
$env:BROWSE_BROWSER_OUTPUT = '<temporary screenshot directory>'
python tests/browse-cards/browse.browser.py
```

The browser covers real pointer timing, immediate navigation, independent hearts,
source-heart handoff through the expanded overlay, pointer-transparent closing,
source/preview grace, rapid card changes, scrolling, Escape, keyboard,
saved-profile changes, sign-out, recommendation/city/grid exclusions (including
the same apartment in both sections), long titles, large prices, absent match
summaries, reduced motion and touch.
The screenshots are fixture evidence, not a claim of hosted account testing.

Focused unit regressions:

```powershell
node --experimental-strip-types --test lib/recommended-context.test.mjs lib/card-preference-matches.test.mjs lib/card-preferences-profile.test.mjs lib/hover-preview.test.mjs lib/favorites-ui.test.mjs lib/browse-rows-fetch.test.mjs lib/tenant-preferences.test.mjs lib/profile-request-cache.test.mjs
```
