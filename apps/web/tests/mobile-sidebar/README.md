# Mobile portal drawer alignment

This isolated browser fixture renders the real `MobileSidebarNavigation`,
HeroUI Drawer/Button and APT theme switch with the app's CSS. Navigation arrays
are extracted from the three actual portal layouts. Only router, feed, Auth
sign-out and unused desktop dependencies are replaced with local test doubles;
no account or Supabase connection is used.

From `apps/web`, with Python Playwright, Edge and an external esbuild install:

```powershell
$env:BROWSE_ESBUILD_PATH = "C:\path\to\node_modules\esbuild"
$env:SIDEBAR_BROWSER_OUTPUT = "$env:TEMP\opencode\mobile-sidebar"
node tests/mobile-sidebar/build-fixture.mjs $env:SIDEBAR_BROWSER_OUTPUT
python tests/mobile-sidebar/mobile-sidebar.browser.py
```

Checks tenant, landlord and admin at 320/375/393/430px in light and dark:
common icon and label axes, 20px non-shrinking icons, 12px gaps, active tint,
trailing theme switch, bottom logout, route/overlay/sign-out callbacks and
Close. A long unbroken label checks wrapping at 320px; Escape checks focus
restoration. Screenshots are written outside the repository to the output
directory. Role-switch rows are included using a synthetic multi-role account;
this does not alter the real roles or access rules.

`pnpm test` also runs the mobile row contracts in
`lib/sidebar-sections.test.mjs`. Browser tests do not perform a real sign-out
or load destination pages; they verify that the original handlers are invoked.
