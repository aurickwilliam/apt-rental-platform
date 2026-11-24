# Settings responsive browser checks

Renders the real Settings modal, category buttons, General tab, Theme select,
Reduce Motion switch and browser preference helpers. User/profile reads and
the rental draft hook are local doubles; other tabs have placeholder bodies
so the fixture never accesses Auth, preferences, notifications or private data.
Those production tab bodies are not modified by this refinement.

From `apps/web`, with Python Playwright, Edge and an external esbuild install:

```powershell
$env:BROWSE_ESBUILD_PATH = "C:\path\to\node_modules\esbuild"
$env:SETTINGS_BROWSER_OUTPUT = "$env:TEMP\opencode\settings-responsive"
node tests/settings-responsive/build-fixture.mjs $env:SETTINGS_BROWSER_OUTPUT
python tests/settings-responsive/settings-responsive.browser.py
```

Checks 320/375/393/430/640/768/1440px:

- Mobile strip starts at the left, scrolls horizontally, and reveals each
  selected category, including an initially requested Rental Preferences tab.
- Desktop rail remains 208px wide; icons and labels share consistent axes.
- Active blue surface, category order, keyboard focus/Enter and Close/Escape.
- General descriptions wrap; Theme stacks below its copy below 640px;
  Reduce Motion remains right-aligned; rows and controls do not overflow.
- Real theme dropdown selections and Reduce Motion pointer/keyboard changes,
  including the existing localStorage value, in light and dark themes.

Screenshots go to the output directory after finite animations finish.
The fixture's CSS scanner includes nested conditional class strings so active
colors match the app. `pnpm test` runs the source/render contracts in
`lib/settings-responsive.test.mjs` without a browser.
