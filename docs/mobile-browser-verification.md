# Mobile-browser identity photo capture

APT's `/verify/mobile` flow requires a fresh browser camera capture for each
required photo: ID front, ID back (except single-sided document types such as
Passport), and a selfie holding the ID. The browser asks for camera access only
after **Enable camera**. Each photo is taken from the active video stream;
review, Retake and final confirmation remain explicit user actions.

There is no mobile gallery/file-picker alternative, hidden file input, HTML
`capture` attribute, paste handler or drag-and-drop upload. Camera failures do
not advance the flow. The shared camera component also has no implicit file
fallback. The separately supported desktop wizard retains its explicit ID
upload controls and its existing phone-handoff action; this change does not
turn all verification workflows into a server-enforced camera-only policy.

## Permission and failure handling

- Permission denial gives browser-specific site-permission guidance, including
  checking the browser's camera permission in device settings.
- Missing cameras, unsuitable settings, unsupported browsers, insecure origins,
  blocked access, playback failures and interrupted camera streams give a
  clear error and **Try camera again**, never an upload action.
- The preview must be playing, have non-zero dimensions and have a live video
  track before capture. An empty or failed frame cannot advance the wizard.
- Camera tracks stop after capture, Back, expiry and unmount. If a permission
  request resolves after its screen was retired, its returned tracks stop too.
- Retake discards the selected old image. Changing the document type discards
  all previous photos. Required-image checks and the final confirmation prevent
  incomplete submission; the submit handler also checks expiry and locks out
  duplicate clicks.

## Mobile layout and navigation

The phone page has one full-width surface rather than nested cards; larger
screens use a single centred card. A consistent header shows the current step
and progress. The flow starts at six steps; selecting Passport reduces it to
five because no back photo is required. Supported IDs and eligibility rules
are unchanged.

The ID selector uses labelled HeroUI radio rows with normal arrow-key behavior,
not pill buttons. Government/secondary headings organize the existing options.
The ID list uses native scrolling inside the available dynamic viewport, with
the sticky action bar outside the list's scroll area, including safe-area
padding so no choice sits behind it. Other steps use ordinary page scrolling.
No inputs request a software
keyboard, zoom remains enabled, and controls stay in normal document flow
rather than being fixed over the screen.

Back preserves ID selection and completed photos. Returning to a captured-photo
step shows its existing image and Continue, with Retake available if needed.
Only Retake or changing ID type discards a photo draft. Forward capture still
advances within the same existing steps; no new verification step is added.

There is no supported mobile ID-upload fallback to relabel: the camera-only
policy remains in place, including after permission denial. Desktop's separate
ID-upload workflow and existing validation remain unchanged; selfies have no
gallery alternative in either browser flow. UI refinement does not add or
replace server-side upload validation.

## Security limitations

**This is a browser UI capture policy, not liveness detection or guaranteed
identity authentication.** `getUserMedia` does not cryptographically attest
where a frame came from. Virtual cameras, browser/OS modifications, developer
tools and direct requests can defeat client-only image-provenance claims. A
person can also point a genuine camera at a screen, printout, altered document
or someone else's ID. A browser camera photo therefore does not prove physical
possession, document authenticity or that the person is the document's owner.

The server cannot reliably distinguish a camera JPEG from an existing JPEG
based on bytes, EXIF or a client-supplied "camera" flag. A stronger guarantee
would require a separately evaluated capture/liveness/identity service, not
relaxed browser permissions or trusting client metadata.

Existing authenticated session creation/claim, token ownership and expiry,
single-use consumption, private storage access, server-side required-file
checks and admin review are unchanged. No schema migration is needed. Nothing
automatically approves verification or submits a rental application.

## Local verification and device testing

The network-isolated browser fixture in
`apps/web/tests/profile-verification/camera.browser.mjs` uses Chromium synthetic
camera frames and in-memory storage/action fixtures. It exercises camera
failures and retry, successful captures, no gallery/paste/drop inputs, retake,
Back, previews/progress, Passport's exception, explicit confirmation,
incomplete confirmation, expiry and stream cleanup. See that directory's
README for commands. Error wording and no-input checks also run in the normal
web suite. Existing action tests and in-memory PostgreSQL tests cover session
ownership, expiry and single-use submission separately.

Before release, test physical Android Chrome and iPhone Safari: first permission
prompt, permanent denial and re-enabling permissions, rear/front lens choice,
rotation, backgrounding/return, camera interruption, expiry during capture,
retake, readable ID photos and the complete private upload/review path using
isolated test accounts. Browser emulation cannot establish real-camera quality,
iOS permission behavior or any identity/liveness assurance.

`responsive.browser.mjs` additionally checks 320, 375, 393, 430, 768 and 1280px
layouts, shortened viewports, last-row/footer clearance, keyboard radio
selection, preserved state, permission denial/retry, preview/retake, expiry and
axe WCAG A/AA checks on introduction, selection, denied-camera and preview
screens. These checks do not replace VoiceOver/TalkBack or real browser-chrome,
safe-area and device testing.
