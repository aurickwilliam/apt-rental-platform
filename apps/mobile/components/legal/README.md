# Mobile legal policies

`LegalPolicyScreen` renders the existing Settings Terms and Privacy routes with
`ScreenWrapper` and `StandardHeader`. `LegalPolicySection` presents numbered
headings, paragraphs, lists, lettered subheadings and labelled callouts using the
existing mobile theme tokens. Policy text is selectable, and headings are
announced to screen readers.

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
