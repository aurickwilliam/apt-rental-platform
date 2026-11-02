# Web Edit Profile modal regression

This isolated fixture renders production `ProfileForm`, HeroUI and the real
global styles. Only Next navigation, the server action and unused photo modules
are replaced. External requests are blocked; no environment files, accounts,
credentials or database writes are used. The cover fixture keeps the real
file validation, JPEG compression, upload orchestration and removal flow;
only storage/profile transport and Next's image adapter are substituted.

Install `esbuild` and `playwright` in a temporary tools directory, not the app.
Run from the repository root in PowerShell (replace the example paths):

```powershell
$env:PROFILE_ESBUILD_PATH='C:/temporary/tools/node_modules/esbuild'
node apps/web/tests/edit-profile/build-fixture.mjs C:/temporary/profile-preview
$env:PROFILE_PLAYWRIGHT_PATH='C:/temporary/tools/node_modules/playwright'
$env:PROFILE_BROWSER_OUTPUT='C:/temporary/profile-preview'
node apps/web/tests/edit-profile/modal.browser.mjs
node apps/web/tests/edit-profile/cover.browser.mjs
node apps/web/tests/edit-profile/avatar.browser.mjs
```

Uses installed Microsoft Edge in headless mode. Covers unchanged saved details,
focus and return focus, locked fields, pristine/reverted drafts, nested discard
confirmation, dropdown interaction, validation, failed-save draft retention,
successful save and reopen, save-time dismissal lock, responsive light/dark
layouts and the unchanged standalone editor. Screenshots are saved in the
temporary fixture output directory. The action is simulated; hosted persistence
and server revalidation are not exercised.

The cover suite additionally checks file selection and preview without changing
the page banner, cancellation and reopening, invalid file errors, JPEG output,
save and removal failures/retries, dismissal locks, nested confirmation, the
empty-cover fallback and responsive light/dark layouts.

The avatar suite checks the saved photo's view-only modal, mouse/touch/keyboard
activation and focus restoration, separate camera-modal editing, local preview
isolation and cancellation, file validation and JPEG compression, failed-save
and removal retries, busy-state dismissal locks, nested removal confirmation,
the non-selectable initials fallback and responsive light/dark layouts. Viewing
never writes or uploads.
