# Review-unlock modal browser checks

These checks mount the production `ReviewUnlockGate`, installed HeroUI components and freshly compiled production CSS. Only review eligibility and Next navigation are replaced. The fixture does not load Next.js or `.env` files, and external browser requests are blocked. No account, tenancy or review data is changed.

Install `esbuild` and `playwright` in a temporary directory, not the workspace. With Node.js and Edge installed, run the following in PowerShell (adjust `$tools` to that directory):

```powershell
$tools = "$env:TEMP/opencode/review-modal-tools"
npm install --prefix "$tools" --no-package-lock esbuild playwright
$env:REVIEW_ESBUILD_PATH = "$tools/node_modules/esbuild"
$env:REVIEW_PLAYWRIGHT_PATH = "$tools/node_modules/playwright"
$env:REVIEW_BROWSER_OUTPUT = "$tools/preview"
node apps/web/tests/review-unlock/build-fixture.mjs "$env:REVIEW_BROWSER_OUTPUT"
node apps/web/tests/review-unlock/modal.browser.mjs
```

The browser script manages its own local HTTP server. `REVIEW_BROWSER_CHANNEL` defaults to `msedge`; set it to `chrome` to use installed Chrome. Screenshots are written to the fixture output directory.

Coverage: 13 viewport sizes from 320px to 1920px, including the 639/640px and 767/768px boundaries, landscape and short windows, in both light and dark themes. Tests use touch taps at phone widths, long unbroken apartment names, viewport bounds, unobstructed 44px controls, scrolling without moving the actions, review navigation, dismissal persistence, close/Escape/backdrop dismissal and keyboard focus containment. A normal apartment name is also checked while resizing the same open modal through all 13 sizes in both themes. This is an isolated UI check, not an authenticated end-to-end or database authorization test.

`pnpm --filter web test` includes lightweight structure/style checks in `lib/review-unlock-layout.test.mjs`; the browser suite is the interaction and actual-layout regression check.
