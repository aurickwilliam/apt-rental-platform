# Property Details → Edit dialog browser checks

`modal.browser.mjs` mounts the production `PropertiesTableSection` (the table,
`PropertyDetailsSheet` and `EditPropertyModal`) with the installed HeroUI
components and the real `app/globals.css`. Only Supabase transport, Next
navigation/images/lazy imports, the Google Maps picker and the verification
server action are fixtures. Every external browser request is blocked, so the
checks make no hosted Auth, database, storage or Maps call and change no data.

## Why this exists

The table's overflow-menu **Edit** action opens the details drawer and the edit
dialog in the same commit. React Aria's `ariaHideOutside` pass for the drawer
then ran after the dialog's and marked the dialog's overlay `inert`. On that
first open the dialog looked normal but could not receive input: clicks landed
on `body`, which React Aria treated as an outside press and closed the dialog.
A second open worked only because the dialog then mounted in a later commit and
its own hiding pass became the last one.

The fix mounts the nested dialog inside the drawer's overlay layer
(`UNSTABLE_portalContainer`), so the drawer's pass keeps everything inside its
own layer visible and only hides the drawer content behind the dialog. The
suite asserts that behavior on the first open, after Save, and on repeat opens.

## Run

Install the tools in a temporary directory, not this workspace:

```powershell
$tools = "$env:TEMP/opencode/property-modal-tools"
npm install --prefix "$tools" --no-package-lock esbuild playwright
$env:PROPERTY_MODAL_ESBUILD_PATH = "$tools/node_modules/esbuild"
$env:PROPERTY_MODAL_PLAYWRIGHT_PATH = "$tools/node_modules/playwright"
$env:PROPERTY_MODAL_BROWSER_OUTPUT = "$tools/preview"
node apps/web/tests/property-details-modal/build-fixture.mjs "$env:PROPERTY_MODAL_BROWSER_OUTPUT"
node apps/web/tests/property-details-modal/modal.browser.mjs
```

```sh
tools="${TMPDIR%/}/property-modal-tools"
npm install --prefix "$tools" --no-package-lock esbuild playwright
PROPERTY_MODAL_ESBUILD_PATH="$tools/node_modules/esbuild" \
PROPERTY_MODAL_PLAYWRIGHT_PATH="$tools/node_modules/playwright" \
PROPERTY_MODAL_BROWSER_OUTPUT="$tools/preview" \
  node apps/web/tests/property-details-modal/build-fixture.mjs "$tools/preview"
PROPERTY_MODAL_PLAYWRIGHT_PATH="$tools/node_modules/playwright" \
PROPERTY_MODAL_BROWSER_OUTPUT="$tools/preview" \
  node apps/web/tests/property-details-modal/modal.browser.mjs
```

The script serves the fixture itself and launches the installed Microsoft Edge
(`PROPERTY_MODAL_BROWSER_CHANNEL` overrides the channel; run
`npx playwright install chromium` and set it to `chromium` where Edge is not
available). Screenshots are written to the output directory.

`build-fixture.mjs` compiles `app/globals.css` with the installed Tailwind
compiler, so a production `next build` is not required. It writes `fixture.js`,
`styles.css` and `index.html` to the output directory.

## What it checks

- first open from the table Edit action: one dialog, not `inert`, the drawer
  content is `inert`, and the Name input passes a real `elementFromPoint` hit
  test
- keyboard focus enters the dialog and stays inside it while tabbing
- typing, clicking inside, and opening/selecting a dropdown work immediately
- Cancel closes and discards the draft; the drawer becomes interactive again
- Escape closes and returns focus to the pencil button
- Save writes the edited pricing to the fake client and updates the drawer
- reopening after Save and switching apartments show the right values
- the close button works and the dialog keeps `role="dialog"` with its heading
- a second page session repeats the same-commit open twice
- no uncaught browser errors

This checks UI behavior only. Supabase authorization, the real route and the
mobile app are outside this fixture.
