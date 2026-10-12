# Admin "Report a Bug" Link — Plan

Status: Proposed (2026-10-12). Blocked on one decision: where admin bug reports should go (see §3).
Scope: Web admin settings only (`apps/web/app/components/settings/tabs/HelpTab.tsx`, admin branch).
Goal: Give admins a way to report problems with the platform itself (admin tools misbehaving), without sending them to customer support.

Non-goals:
- No change to the tenant/landlord "Report a Problem" row (still disabled, "Coming soon").
- No in-app bug-report form, database table, or edge function.
- No new dependency.

## 1. Background

- Admin Help & Support used to show "Report a problem · support@apt-rental.ph" (a `mailto:` link). Admins are the people who answer customer support, so the link pointed back at themselves, and it was removed along with the FAQ and the "APT — A Place to Thrive" card (commit pending on `refactor/admin-settings`).
- Admins can still hit **platform bugs**: verification queue not loading, a user access action failing, wrong data in the activity log. Those are for the developers, not customer support.
- Admin Help currently shows: Terms and conditions, Privacy Policy, Cookie policy, Learn more about APT.

## 2. When this is needed

- Only worth building once there are admins who do **not** work in the codebase. If the sole admin is the developer, they can file the issue directly and this plan can stay unbuilt.

## 3. Decision needed — destination

| Option | Link target | Good when | Trade-off |
|---|---|---|---|
| A. GitHub Issues | `https://github.com/aurickwilliam/apt-rental-platform/issues/new` | Admins have GitHub accounts | Needs access to the repo (private repos hide the form from non-members); issue titles and bodies may be seen by contributors |
| B. Developer email | `mailto:<developer address>` | Admins are not on GitHub | Unstructured reports; no tracking |
| C. Form or chat channel | Google Form / Discord channel URL | Several non-technical admins | One more external tool to maintain |

Recommendation: **A** if admins use GitHub, otherwise **B**. Do not reuse `support@apt-rental.ph`.

## 4. Implementation (after the decision)

1. In `HelpTab.tsx`, add an admin-only row above the policy links, using the existing `linkClassName` style:
   - A: `<a href=ISSUES_URL target="_blank" rel="noopener noreferrer">` with `IconExternalLink`.
   - B: `<a href="mailto:...">`.
2. Put the destination in one named constant (not inline) — prefer `NEXT_PUBLIC_ADMIN_BUG_REPORT_URL` so it can change without a code release; fall back to hiding the row when unset.
3. Label it "Report a platform bug", with a one-line hint such as "Something wrong in the admin tools? Tell the developers."
4. Keep Tabler icons only (`IconBug` suits this row).
5. Do not include user data, ids or emails in the link or its query string.

## 5. Verification

- `pnpm --filter web typecheck` and `pnpm --filter web lint`.
- Sign in as an admin, open Settings → Help & Support: the new row appears, opens the chosen destination in a new tab (A/C) or the mail client (B), and is visible in both light and dark themes.
- Sign in as a tenant and a landlord: the row does not appear.
- With the env var unset (if used): the row is hidden and nothing else changes.

## 6. Docs

- If an env var is added, list it in the web app's env documentation and `.env.example`.
- No AGENTS.md or DESIGN.md change expected.
