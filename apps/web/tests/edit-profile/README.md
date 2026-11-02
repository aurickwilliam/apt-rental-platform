# Web Edit Profile modal regression

This isolated fixture renders production `ProfileForm`, HeroUI and the real
global styles. Only Next navigation, the server action and unused photo modules
are replaced. External requests are blocked; no environment files, accounts,
credentials or database writes are used.

Install `esbuild` and `playwright` in a temporary tools directory, not the app.
Run from the repository root in PowerShell (replace the example paths):

```powershell
$env:PROFILE_ESBUILD_PATH='C:/temporary/tools/node_modules/esbuild'
node apps/web/tests/edit-profile/build-fixture.mjs C:/temporary/profile-preview
$env:PROFILE_PLAYWRIGHT_PATH='C:/temporary/tools/node_modules/playwright'
$env:PROFILE_BROWSER_OUTPUT='C:/temporary/profile-preview'
node apps/web/tests/edit-profile/modal.browser.mjs
```

Uses installed Microsoft Edge in headless mode. Covers unchanged saved details,
focus and return focus, locked fields, pristine/reverted drafts, nested discard
confirmation, dropdown interaction, validation, failed-save draft retention,
successful save and reopen, save-time dismissal lock, responsive light/dark
layouts and the unchanged standalone editor. Screenshots are saved in the
temporary fixture output directory. The action is simulated; hosted persistence
and server revalidation are not exercised.
