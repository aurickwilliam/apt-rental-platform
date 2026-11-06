# Mobile legal policies

`LegalPolicyScreen` renders the existing Settings Terms and Privacy routes with
`ScreenWrapper` and `StandardHeader`. `LegalPolicySection` presents numbered
headings, paragraphs, lists, lettered subheadings and labelled callouts using the
existing mobile theme tokens. Policy text is selectable, and headings are
announced to screen readers. Privacy and Terms readers end after the policy
sections, without a Questions/contact footer, including during registration.

Standalone Settings readers show a HeroUI Native outline “Back to top” button
after any downward scroll and hide it at the top (including negative overscroll).
It floats outside `ScreenWrapper` at bottom-right, 16pt inside the bottom/right
safe areas; extra content padding keeps the final text reachable above it.
The screen owns the `ScreenWrapperScrollRef` and uses its `scrollTo` API, checking
the current reduced-motion preference on each press. A failed preference read
uses no animation, and a response after unmount cannot scroll a retired screen.
The arrow is decorative; the button has a visible label and an accessible hint.
Registration uses `LegalPolicyContent` directly, so its dialogs never gain this
floating control or a second scroll handler.

Content lives in `constants/legal/`, outside Expo Router's route directory.
The web's `tos/data/tos-sections.ts`, `pap/data/pap-sections.ts` and
`lib/registration-policies.ts` remain the wording and revision reference.
Mobile keeps its own data with no web runtime imports or network requirement.
`constants/legal/policies.test.ts` checks all content and metadata against those
web files; update the mobile copies when the reference policies change.

Settings screens and `LegalPolicyContent` remain read-only. Registration's
`RegistrationPolicyAcceptance` owns separate checkbox controls and opens
`RegistrationPoliciesDialog` without leaving the form. Neither reading the
shared content nor closing that dialog accepts a policy. See
`docs/mobile-registration-acceptance.md` for the registration contract.

Keep required markers after the full linked policy names, suppressing the
introductory Label's automatic marker without removing the checkbox's required
state. The reader disables `Dialog.Content` swipe-to-dismiss and bounds its
Gesture Handler ScrollView inside a local gesture root with explicit flex/min-height
styles, Android nested scrolling and interruption disabled. Its title, instruction
and Close stay outside that scrolling body. Registration alone disables text
selection to avoid competing with slow swipes; shared content defaults to selectable.
Reading progress retains offsets across late layout callbacks and checks the end
marker, not decorative padding, including final drag/momentum samples.
