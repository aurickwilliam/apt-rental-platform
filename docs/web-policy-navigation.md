# Web policy navigation

Terms and Privacy share one body per document in
`apps/web/app/components/legal/TermsPolicyPage.tsx` and `PrivacyPolicyPage.tsx`.
The content, metadata, hero, section IDs and responsive contents navigation are
the same in each shell. The registration dialogs still use the policy data
directly; neither they nor native mobile routes are changed.

Both standalone policy heroes include a labelled Back button beside the Legal
badge (Back on the left, vertically centred with a 12px gap), reusing the
apartment page's HeroUI `BackBtn`. With the optional fallback,
it uses same-origin previous history (the browser Navigation API where available,
otherwise a same-origin referrer), or replaces the route with the current portal
home: tenant My Rental, landlord/admin Dashboard, or `/` for public readers.
Unknown/external history never sends the policy reader off-site. Existing
apartment callers without a fallback retain their original history-back behavior.
The Cookie hero and registration dialogs do not gain this button.

A passive window scroll subscription reveals a fixed bottom-right Back to top
control as soon as `scrollY > 0`, anywhere in the document, and hides it at the
top. `useSyncExternalStore` reads a boolean snapshot, so scrolling only changes
the rendered state when crossing the top. Server rendering keeps it hidden;
the client also handles restored scroll positions on mount. The subscription
is removed on unmount, and no end-of-document marker or observer is needed.
The shared HeroUI button focuses the document's own heading without an automatic
focus-scroll, then scrolls to the page top smoothly (instantly for reduced motion).
The heading has a programmatic focus target and visible keyboard focus, but is
not an extra tab stop. The control uses 16px bottom/right offsets plus device safe
areas and marks `data-fab-clearance`, so the existing notification bell resolver
keeps its resting placement clear. It is not mounted in registration dialogs or Cookie.

Portal routes pass `layout="portal"` to the shared body. Desktop Contents uses a
16px sticky top gap there, rather than the public layout's 80px navbar clearance.
The same offset is included in the measured-height fit check; content taller than
the available viewport remains non-sticky. Public readers (including Cookie)
keep the default 80px offset, and the narrow-screen accordion stays unchanged.

| Viewer | Terms | Privacy | Shell |
| --- | --- | --- | --- |
| Signed out | `/tos` | `/pap` | Public top navigation and footer |
| Tenant | `/tenant/tos` | `/tenant/pap` | Existing tenant sidebar/mobile menu |
| Landlord | `/landlord/tos` | `/landlord/pap` | Existing landlord sidebar/mobile menu |
| Admin | `/admin/tos` | `/admin/pap` | Existing admin sidebar/mobile menu |

`SettingsModal` passes its resolved portal to Help and Security. Their links use
`policyHref` (`lib/policy-routes.ts`), so a mixed-role account stays in its current
shell. No policy links are added to the main sidebar. Portal navigation removes
the Settings query from the destination, so the policy is not hidden by Settings.

Direct public visits use `redirectSignedInPolicy` (`lib/server-policy-navigation.ts`):
request-local `getServerIdentity`, then the existing validated `apt_portal`
preference for consumer accounts or the existing admin-first destination rule.
The preference chooses presentation only. Each destination still authorizes the
caller: `requirePortalViewer` for consumers (allowing unverified landlords for
these public-document reads), `requireAdmin` including MFA for admins.

Onboarding, missing/hidden profiles and failed profile reads retain public policy
access rather than inventing a portal or redirecting into an account-setup loop.
Recovery middleware and existing protected-route checks stay unchanged. An
unverified landlord's verification wall explicitly allows just the two policy
paths; landlord tools remain closed.

## Verification

`lib/policy-navigation.test.mjs` exercises public/portal routing, missing sessions,
onboarding, dual-role preference validation, shared content, Settings links and
authorization before rendering. `lib/landlord-verification-access.test.mjs`
checks the verification-wall exceptions and rejects similarly named tool paths.
Registration modal tests continue to verify the unchanged reader behavior.

Browser checks should cover both documents from Settings and direct public URLs,
desktop and narrow viewports, light/dark mode, sidebar collapse, contents anchors,
browser Back and sign-out. A settled portal page must contain no public top bar or
footer; narrow viewports keep the portal's own hamburger navigation.
