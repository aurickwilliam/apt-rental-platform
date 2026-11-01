# Application → profile verification browser checks

This fixture runs the production `ApplyStartModal`, `ApplicationIssues`,
`PassportProfileCard`, navigation-intent hook, `VerifyDialog`, `VerifyClient`
and verification panels with the installed HeroUI components and app CSS.
React Strict Mode is enabled.

Only Next navigation/images, application readiness, server-action transport,
private storage transport and application guidelines are fixtures. Both real
capture wizards are mounted. External
browser requests are blocked. No hosted Supabase/storage write, physical camera
capture or APK download is performed. The camera suite uses synthetic frames
and opt-in in-memory upload/submission fixtures; other suites reject writes.

Install browser tools outside the workspace (or reuse an existing temporary
installation):

```powershell
$tools = "$env:TEMP/opencode/property-modal-tools"
npm install --prefix "$tools" --no-package-lock esbuild playwright axe-core
$env:VERIFICATION_ESBUILD_PATH = "$tools/node_modules/esbuild"
$env:VERIFICATION_PLAYWRIGHT_PATH = "$tools/node_modules/playwright"
$env:VERIFICATION_AXE_PATH = "$tools/node_modules/axe-core"
$env:VERIFICATION_BROWSER_OUTPUT = "$env:TEMP/opencode/profile-verification-preview"
node apps/web/tests/profile-verification/build-fixture.mjs "$env:VERIFICATION_BROWSER_OUTPUT"
node apps/web/tests/profile-verification/navigation.browser.mjs
node apps/web/tests/profile-verification/security.browser.mjs
node apps/web/tests/profile-verification/device.browser.mjs
node apps/web/tests/profile-verification/camera.browser.mjs
node apps/web/tests/profile-verification/responsive.browser.mjs
node --test apps/web/tests/profile-verification/sessions.database.mjs
```

Run from the repository root. The default browser is installed Microsoft Edge;
set `VERIFICATION_BROWSER_CHANNEL=chromium` and install Playwright Chromium if
Edge is unavailable. Generated bundles stay outside the workspace.

Coverage:

- Apply Now → Verify account → profile's existing dialog, on the first click
- one dialog, focus inside, not inert, desktop button immediately interactive
- intent removal without an extra history entry; Back/Forward and refresh
- close without reopening, manual reopening and a new same-profile intent
- refreshing while open does not replay the consumed intent
- verified/pending profile states, rejected resubmission, pending submission
  returned by the dialog's independent check
- original apartment link retained, with explicit return and no submission
- QR generation and Android guidance still work; all three methods available
- desktop ID upload reaches the unchanged webcam capture step
- normal tenant/landlord profile buttons and direct `/verify` remain usable
- no uncaught browser errors

Pure path-validation and rendered application-action tests run in the normal
web suite: `pnpm --filter web test`.

`device.browser.mjs` checks Android, iPhone and iPad browser emulation: correct
methods, hydration from a neutral server snapshot, first-open focus and Escape,
creation of exactly one same-device session, claiming that token in the real
mobile capture wizard and reaching camera entry without scanning a QR. It also
checks returnTo/Back and approved, pending and rejected states. Emulation uses
Chromium, not real iOS Safari or physical camera hardware; permissions, lens
selection and APK installation still need device testing.

`sessions.database.mjs` uses the existing root PGlite dependency (in-memory
PostgreSQL) and the original verification-session migration to exercise actual
owner-only access, foreign-account and unauthenticated consumption refusal,
expiry and single-use consumption. It does not contact a hosted database or
apply a new migration. Production server-action tests in
`lib/verification-session-actions.test.mjs` additionally check session hashing,
ten-minute expiry, authentication, approved/pending/rejected rules, missing
captures and duplicate submission attempts with isolated transport fixtures.

`camera.browser.mjs` exercises the production mobile capture wizard with fake
Chromium camera devices: permission denial/retry, live ID front/back/selfie,
retake, document-type changes, Passport's exception, progress, Back, previews,
explicit confirmation and a successful in-memory submission. It also covers
missing cameras, hardware and playback failures, unsupported/insecure/blocked
access, interrupted tracks, failed frame encoding, late permissions after Back,
session expiry, disabled incomplete confirmation and absence of file inputs or
paste/drop capture paths. No real ID images or production records are used.
Physical-device limitations and policy scope:
`docs/mobile-browser-verification.md`.

`responsive.browser.mjs` checks the real mobile page layout and route-scoped CSS
at 320, 375, 393, 430, 768 and 1280px, plus shortened viewports. It verifies no
horizontal overflow, 44px navigation targets, last-ID/footer clearance, all
supported radio choices, keyboard arrow selection, Back preserving selection
and captures, permission guidance, retry, preview/retake and expiration. Axe
checks WCAG A/AA rules on introduction, ID selection, camera-denied and preview
screens. Screenshots are written to the temporary fixture output directory.
The existing desktop navigation suite still exercises its supported ID upload;
mobile tests assert that no file-picker fallback is reintroduced.

`security.browser.mjs` sends malicious return destinations through the real
fixture: URL schemes, protocol-relative URLs, encoded tricks, backslashes,
control characters, malformed paths and HTML/script payloads. It asserts that
invalid values create no return link, query diagnostics are escaped React text,
no script or external navigation occurs, and valid listing links still work.
The pure path tests share the same attack cases and run in the normal web suite.

The builder now renders the production neutral verification state on Node with
fixed props into `index.html`; `/hydration` hydrates that existing server markup.
No query value enters the generated HTML, and the browser fixture performs no
HTML-string insertion. The extra `hydration.cjs` build artifact stays in the
temporary output directory and is not served to browsers.
