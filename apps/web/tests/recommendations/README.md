# Recommendation browsing regression fixture

Uses real web components and synthetic listings; no account, Supabase connection
or production writes. External esbuild and Python Playwright installations may
be reused; they are not added as application dependencies.

From `apps/web`, with esbuild and Python Playwright available:

```powershell
$env:BROWSE_ESBUILD_PATH = "<absolute path to installed esbuild>"
$env:BROWSE_BROWSER_OUTPUT = "$env:TEMP\opencode\recommendations-preview"
node tests/recommendations/build-fixture.mjs $env:BROWSE_BROWSER_OUTPUT
python tests/recommendations/browse.browser.py
```

The Python runner starts and closes its own temporary HTTP server and launches
headless installed Microsoft Edge. It checks visible default-card chips at
320/375/393/430/768/1024/1280/1440px, equal-height zero/one/two-chip cards, long
titles/locations, chips between location and aligned bottom prices, the absence
of eye controls, keyboard and touch navigation, independent favorites, updated
reasons and generic section/grid isolation. It also keeps empty, invalid and
failed recommendation states distinct, with their truthful actions and no
fallback cards. It tests first-hover and repeated
Favorite entry, full hit-area exclusion, pending timer cancellation, covered
hearts, keyboard Enter/Space, loading/resolve and mobile add/remove taps.
Desktop hover keeps supplementary
information without duplicate chips, with sidebar/right/bottom bounds and
short-screen scrolling checks. Search submission is unchanged. It saves screenshots
in the temporary output directory. No live provider or native app behavior is
certified by this fixture.
