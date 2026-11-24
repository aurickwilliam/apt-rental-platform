# User Manual and Admin Manual — Plan

Status: Proposed (2026-11-17). Nothing written yet; this plan needs the decisions in §8 before drafting starts.

## 1. Goal

Two manuals for the thesis, written from the module list already in the paper (`docs/thesis-modules-update.md`):

| Manual | Reader | Platforms | Source modules |
|---|---|---|---|
| **User Manual** | Tenants and landlords (rental owners) | Android app and website | Sections I and II of the module list |
| **Admin Manual** | Administrators | Website only (admins cannot sign in on mobile) | Section III of the module list |

Each manual should let a first-time reader finish every main task without help, and let a panelist find any feature quickly.

## 2. Where they go in the paper

- Add them as appendices after Appendix F (suggest **Appendix G: User Manual** and **Appendix H: Admin Manual**), each with a divider page like the existing ones.
- Update the List of Appendices and the table of contents the same way as before (page numbers read from Word).
- Also export each as a standalone PDF so it can be handed to clients (Mr. Reynaldo P. Lorenzo Jr. and Ms. Lydia Englase) and panelists.

## 3. Shared structure for both manuals

1. Cover page and version/date (matches the paper's title page).
2. About APT: what it is, who it is for, CAMANAVA scope.
3. Getting started: devices and browsers supported, installing the Android APK, opening the website, supported cities.
4. Conventions: what a note, warning and tip look like; button names in bold; "Mobile" and "Web" tags where steps differ.
5. Chapters (below).
6. Troubleshooting and FAQ (reuse the in-app FAQ text where it still matches).
7. Glossary (Passport, Verified badge, Tenancy, Move-in cost, Advance, Deposit, Overdue, Suspended).
8. Quick reference: account statuses and what each allows; payment methods; notification types.

Each task section uses one fixed pattern so the manual stays consistent:
**Purpose → Before you start → Steps (numbered, one action per step, one screenshot per key step) → What you will see → If something goes wrong.**

## 4. User Manual outline

### Part A — Everyone
1. Create an account (email or Google), accept the Terms and Privacy Policy, confirm the email code.
2. Sign in, forgot password, lockout after wrong attempts.
3. Verify your account: choose an ID, front and back photos, live selfie with ID, status meanings (unverified, pending, verified, rejected), what is blocked until verified.
4. First-time experience: onboarding slides, personalization questions, tutorial (and replay).
5. Profile and settings: edit profile, language (English/Filipino), theme, notification settings, change password, change email (two codes), add a second role, logout.
6. APT Passport: add, replace and track documents.
7. Messages: start a chat, reply, react, pin, archive, mute, unsend, GIFs and images, block and report.
8. Notifications: in-app, push and email; what each means.
9. Updating the app (Android update prompt).
10. Reporting a listing or a person.

### Part B — Tenant
1. Find an apartment: Browse rows, search box and recent searches, filters, map search, Ava chatbot, favorites.
2. Read a listing: description, photos, map and directions, move-in breakdown, accepted payment methods, landlord profile, badges.
3. Book a visit and track it.
4. Apply: tenant information, declared preferences, Passport attached automatically, readiness checks, cancel or view history.
5. After approval: My Rental screen, signed lease, move-in payment.
6. Pay rent: methods, hosted checkout (test mode), cash with landlord confirmation, receipts, unfinished payment banner, reminders.
7. Maintenance: submit, follow status, fees.
8. Renew a lease: review the proposal, discuss charges in chat, accept.
9. Rate: review an apartment (3-month rule), view ratings landlords gave you.

### Part C — Landlord
1. Get verified before posting (what stays blocked until then).
2. Add a property: renting form, photos and cover, description, map pin, rent/deposit/advance, amenities.
3. Manage a property: edit, listing visibility, delete rules, reviews.
4. Visit requests: approve, reject with reason, reschedule.
5. Applications: read documents and declared preferences, applicant ratings, accept or reject with reason.
6. Tenancy: signed lease upload, payments and cash confirmation, overdue tenants, maintenance requests and fees, rental renewal, end tenancy, rate the tenant.
7. Money: payment methods, Profit and planning (reports, expenses, budgets, CSV), dashboard.
8. Ask for review of a hidden listing.

## 5. Admin Manual outline

1. Sign in: Google or email, two-step login, setting up the authenticator and backup codes.
2. Admin dashboard and notifications.
3. Users: tenant and landlord lists, user details, suspend (permanent, 7, 30, 90 days), reactivate.
4. Manage admin access: add or remove an admin, the authenticator-code step, what is logged.
5. Verification queues: users (ID, selfie), apartments (Verified tag), Passport documents; approve and reject with reasons.
6. Listings: view, hide with a reason, restore, review requests from landlords.
7. Reports: read, choose warn / hide listing / suspend, close; what the reporter and the reported person are told.
8. Analytics and Activity log.
9. App Updates: publish latest and required version, download link check, release history, checklist.
10. Good practice and safety: handling personal documents, never sharing the authenticator, what the audit log keeps.

## 6. How the content will be made accurate

- **One source of truth per chapter:** the module descriptions already in the paper; anything that differs from the running app is fixed in the app notes below, not guessed.
- **Run the real app with demo data:** use the demo-population accounts (`docs/demo-population.md`) so screens show believable names, listings and payments. No real people's data in screenshots.
- **Screenshots:**
  - Web: take them from the built-in browser at a fixed width (desktop 1440, mobile 390).
  - Mobile: Android phone over USB (the project already has a dev-build workflow) or the iOS simulator for layout checks.
  - Mask private details (emails, ID photos, addresses) before inserting.
  - Name files `manual-{role}-{chapter}-{step}.png` and keep them in `docs/manual/screenshots/`.
- **Walk every flow once** before writing it, in this order of risk: payments, verification, applications, renewal, admin actions.
- **Known simplifications to state clearly in the text:** online payments are PayMongo test mode; no payouts; Ava depends on an AI service with a daily allowance; map directions open Google or Apple Maps.
- **Items to confirm before printing:** code expiry time on password reset, number of onboarding slides, which payment methods are enabled in the live PayMongo account.

## 7. Work order and effort

| Step | Output | Rough effort |
|---|---|---|
| 1. Decide format and appendix letters (§8) | Agreed template | 15 min |
| 2. Build the Word template (styles for task, note, warning, screenshot caption) | Template `.dotx` | 1 hour |
| 3. Capture web screenshots for tenant, landlord, admin | ~120 images | 2–3 hours |
| 4. Capture mobile screenshots for tenant and landlord | ~90 images | 2–3 hours |
| 5. Write User Manual Parts A–C | ~45–60 pages | 4–6 hours |
| 6. Write Admin Manual | ~20–25 pages | 2 hours |
| 7. Assemble into the thesis, update lists and table of contents, export PDFs | Updated paper and two PDFs | 1 hour |
| 8. Test run: one person who has not used APT follows the manual end to end | List of confusing steps | 1 hour plus fixes |

I would do steps 3–6 for the admin manual first (smaller, web only) to settle the template, then the user manual.

## 8. Decisions needed

1. **One user manual or separate tenant and landlord manuals?** Recommended: one User Manual with a shared Part A and separate Parts B and C, so account and messaging steps are not repeated.
2. **Screenshots:** recommended real-app screenshots with demo data, both platforms, as above. The alternative is annotated mock-ups, which are faster but go out of date and may be questioned by the panel.
3. **Format:** recommended appendices G and H in the paper plus standalone PDFs. The alternative is standalone documents only.
4. **Language:** English only (recommended). A Filipino edition is possible later because the app already supports Filipino.
5. **Admin manual scope:** keep it to the web portal as it exists today (recommended); do not document features that are not built.

## 9. Not included

- Developer or deployment instructions (already in `docs/` and the thesis methodology).
- Marketing text or a user guide inside the app itself.
- Video tutorials.
