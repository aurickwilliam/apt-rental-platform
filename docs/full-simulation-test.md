# Full simulation test

A manual, end-to-end test of every APT process on web and mobile. Its purpose is not to confirm the happy path; it is to make every rule, guard, permission, date and money calculation fail loudly if it is wrong.

Use demo accounts and demo data only: no real personal data, no real payments, no production writes.

## How to run it

1. **Set up** the environment, data and accounts (section 1). A wrong environment manufactures fake bugs.
2. **Run the golden journeys** (section 2) on dedicated accounts. If one breaks at S1 or S2, stop and log it.
3. **Walk the feature areas** (section 3). They are independent, so they can be split across testers.
4. **Attack the rules directly** (section 4): permissions, money, dates, concurrency, failure states.
5. **Probe the suspects** (section 5), the places where docs and code most plausibly disagree.
6. **Log defects** (section 6) and check the **exit criteria** (section 7).

Ground rules:

- A check is `action → expected result`. Read the console and the network tab before recording a pass. A silent 403 rendered as an empty state is a bug.
- UI checks cannot prove a guard. Where a check says "directly", call the Supabase client or a REST endpoint, not the screen.
- Anything you cannot verify (needs live PayMongo keys, a hosted deploy, a second physical device) is **blocked**, with the reason. Never pass it by assumption.
- Separate a **bug** from a **documented gap** (section 3.1). Gaps are not defects.
- Use two browsers (normal and private) and two devices (iOS and Android) throughout.

### Result marks

| Mark | Meaning |
| --- | --- |
| `[x]` | Passed, verified in this run (note the build) |
| `[~]` | Failed; defect logged |
| `[-]` | Blocked; say why |
| `[!]` | Documented gap, expected |

### Severity

| Level | Meaning | Example |
| --- | --- | --- |
| S1 Blocker | A core journey fails, money is wrong, or data crosses a permission boundary | Tenant cannot pay rent; anon reads a mobile number; deposit counted as income |
| S2 Critical | Feature broken with no workaround, or silent data corruption | Application approved but no tenancy created |
| S3 Major | Wrong rule, or a rule enforced on one platform only | Review allowed at 2 months; fee survives a re-let |
| S4 Minor | Copy, layout, focus order, cosmetics | Wrong empty-state illustration |

Reproduce every S1 and S2 a second time (ideally by a second tester) before filing.

---

## 1. Setup

### 1.1 Record the build

Write these down once and paste them into every defect.

- Git SHA for `apps/web` and `apps/mobile`.
- Mobile build: `version` from `app.config.js`, EAS channel, OTA update ID (Settings → About, `describeRunningBuild`).
- The Supabase project the apps actually use (`NEXT_PUBLIC_SUPABASE_URL` / `EXPO_PUBLIC_SUPABASE_URL`). The CLI link can point elsewhere, so check the URL, not the link.
- Payment mode: `PAYMONGO_SECRET_KEY` set (real test-mode checkout) or unset (mock branch). Half the payment expectations depend on it.
- `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` present, and map pages load without Google's "direct loading" warning.
- `ADMIN_MFA_REQUIRED` value. If `false`, admin second-step checks are blocked.

### 1.2 Repo checks first

A red check here invalidates the run for that platform.

```bash
pnpm install                          # lockfile must not change
pnpm --filter web lint
pnpm --filter web typecheck
pnpm --filter web test
pnpm --filter mobile lint
pnpm --filter mobile test
pnpm db:billing:test
pnpm db:landlord-gate:test
pnpm db:tenant-reviews:test           # the db:* suites need embedded PostgreSQL
```

Also:

- Apply every migration to the test database; do not skip one because it looked unsafe.
- Review `pnpm db:populate --help` and the dry run, then apply demo data so journeys have history. Record the run ID.
- After any `app.config.js` change, run `npx expo prebuild --clean` in `apps/mobile` and rebuild. A stale dev client fakes permission, paste and media-library bugs.

### 1.3 Accounts

Use one account per persona. Most permission bugs are invisible when one account holds every role.

| Code | Persona | Roles | Status | Purpose |
| --- | --- | --- | --- | --- |
| `S1` | Signed-out visitor | none | none | Public surfaces, anon RLS |
| `T1` | Clean tenant | tenant | verified, passport complete | Main tenant journey |
| `T2` | Renting tenant | tenant | verified | Active tenancy, payments, reviews |
| `T3` | New tenant | tenant | unverified | Verification gates |
| `T4` | Pending tenant | tenant | pending | Review in progress |
| `T5` | Rejected tenant | tenant | rejected | Re-submission |
| `T6` | Suspended tenant | tenant | verified, suspended | Suspension notice and session kill |
| `T7` | Dual-role | tenant + landlord | verified | Portal switch, self-transaction guards |
| `L1` | Clean landlord | landlord | verified, ownership doc verified | Listings and applicants |
| `L2` | Unverified landlord | landlord | unverified | Verification wall, hidden listings |
| `L3` | Renting landlord | landlord | verified | Cash confirm, fees, tenancy |
| `L4` | Ended-tenancy landlord | landlord | verified | Vacate, fee settlement, tenant rating |
| `L5` | Suspended landlord | landlord | verified, suspended | Access and notification delivery |
| `A1` | Admin with two-step | admin | verified | Admin portal |
| `A2` | Admin without two-step | admin | verified | Second-step wall |
| `A3` | Admin + tenant | admin + tenant | verified | Mixed-role access |
| `E1` | Email-only | tenant | verified | Password change |
| `G1` | Google-only | tenant | verified | Password and email change disabled |
| `G2` | Google-linked with password | tenant | verified | Email change disabled, password change enabled |

Sanity-check the matrix before testing features:

- `T3` can sign in and browse, but cannot apply, chat, request a visit or report maintenance.
- `L2` sees the verification wall on every landlord route except `/landlord/verify-required`, and `L2`'s listings are invisible to `S1` and `T1`.
- `A1` cannot sign in on mobile (admins are web-only). Record the exact behavior.
- `A3` transacts like any tenant; admin membership grants nothing and removes nothing.

### 1.4 Devices and viewports

| Target | Notes |
| --- | --- |
| iPhone, current iOS | Light and dark; Dynamic Type 100% and 130% |
| Mid-range Android | Sideloaded APK, not Expo Go; light and dark |
| Low-end Android or throttled profile | Jank and list performance |
| Desktop Chrome 1440px | Light and dark |
| Desktop Safari | Usual source of date, `Intl` and cookie bugs |
| Browser at 375px | Must stay usable without the mobile shell |
| JavaScript disabled | Landing page must still render |

### 1.5 Evidence for every failure

A short recording (or before/action/after screenshots), console or device log, the failing request with status and redacted body, the affected row (`payment`, `tenancies`, `applications`, `notifications`, `passport_documents`), and the account code, platform and build.

---

## 2. Golden journeys

Run these first, on fresh accounts, each as one continuous session. Run the tenant and landlord journeys on web and on mobile.

### J1. Tenant: sign-up to first payment to review

| Step | Expected |
| --- | --- |
| Sign up with a fresh email, valid 18+ birth date, valid `09XX` mobile, CAMANAVA address | Code screen appears; no password or code in the URL |
| Enter the emailed code; then reuse it (back button, resubmit) | Accepted once; one profile row; the reuse is refused cleanly |
| Request the code twice; enter a wrong code three times | Resend cooldown with a friendly message; inline error; no raw throttle text or stack trace |
| Complete profile and the five personalization steps | Identity and email fields locked; roles and status never sent; the last step's Yes/No start unselected and save as No when skipped |
| Verify identity | Session consumed once; status becomes `pending`; a "submitted" notification exists |
| Add a Passport document, add the same type again, then replace one | One row per type; replacement resets review state and clears the rejection reason; the old file is removed unless an application references it |
| Browse, filter, sort, page 2; then use the map | List and map return the same result set; pins are HTML overlays; camera and filters live in the URL |
| Apply to a listing, then submit twice | Readiness re-checked at submit; documents attached by reference (expired and rejected never attach); exactly one application |
| Apply to your own listing (`T7`) | Blocked by the database; message shown verbatim |
| Request a visit, then cancel | Landlord notified on both; the tenant is not notified of their own cancel |
| Landlord approves | One tenancy created; apartment leaves the public list; tenant notified |
| Open My Rental and the move-in bill | Correct landlord, apartment and due date; deposit shown as deposit, never rent; advance counts toward month 2 only after confirmation |
| Pay online (success), then reload the return URL | A pending row is reserved before the provider call; settles once; reload creates no second row and no double credit |
| Pay with a `-fail` reference, then `-expired` | Payment fails or expires; rent stays unpaid; retry works |
| Pay cash | Stays pending; landlord sees it under Cash to confirm; tenant sees "waiting for confirmation" |
| Open and save the receipt (mobile) | PNG lands in Photos; permission asked once |
| Rate the apartment at 2 months, then 3 | Blocked at 2; allowed at 3 (month-end clamped) or at lease end |
| Message the landlord from the listing and from the profile | Listing chat carries the apartment; the profile chat is a general inquiry with none |

### J2. Landlord: listing to vacate to tenant rating

| Step | Expected |
| --- | --- |
| Create a listing | Row inserted before any upload; photos under `{apartmentId}/` in two tiers |
| Force an upload failure mid-create | Row and uploaded files roll back; no orphans |
| Use a city, ZIP or pin outside CAMANAVA | Blocked at the field and by the database; message shown as-is |
| Ambiguous city (San Fernando) without a province | Barangay list is empty rather than guessed |
| Rent below `MIN_MONTHLY_RENT`, 3-month deposit, 2-month advance | Rejected by shared rules and the DB guard |
| Description at 2,000 and 2,001 characters | Counter shows the limit; 2,001 refused; DB agrees |
| Pick "No Cooking", then "Kitchen" | The conflicting choice turns the other off; retired amenities hidden unless already picked |
| Edit an older listing with off-rule pricing, leaving pricing alone | Old amounts preserved |
| Submit for verification | `is_verified` stays false until an admin approves |
| Review an application | ID front and back visible; the selfie never |
| Approve; upload, replace and acknowledge the signed lease | One tenancy; only the landlord uploads (active tenancy only); replacing deletes the old object and resets acknowledgement; only the tenant acknowledges; an admin cannot open it |
| Confirm one cash payment, decline another | Confirm leaves pending and notifies; decline lets the tenant retry; ledger and dashboard change together |
| Resolve maintenance with a fee | Notes, status and fee written in one operation; the fee belongs to that tenancy |
| Waive a fee reserved by a pending payment | Refused, including by direct table write |
| End the tenancy with a pending fee, then settle it and end | Blocked first; then apartment returns to available and tenancy becomes `ended` |
| Rate the tenant | One review per tenancy; editing updates the same row; 0, 6 stars or 1,001 characters refused |
| Re-let to the same tenant, then to a different one | Neither inherits the old fee or balance |
| Admin hides the rating | It leaves the average and the author's edit path |

### J3. Landlord finance: expense to operating income (web)

| Step | Expected |
| --- | --- |
| Open Profit & planning; change property and month | Controls navigate immediately; no Apply button |
| Add an operating expense and a capital improvement | Operating expense appears and totals update with no reload; the improvement stays separate |
| Add a budget and a spending limit | Budget versus actual compares like with like, grouped by category |
| Edit an expense in a confirmed month | The review is invalidated; operating income returns to "needs review" |
| Confirm the month review | Operating income appears only now |
| Read every label | Collected rent is never called profit; deposits and maintenance fees are not income |
| Export CSV | Loaded rows only; cells starting `=`, `+`, `-` or `@` are neutralized |
| Refresh, switch property and return within 60s, return after 60s | Refresh hits the network; within 60s no request; after 60s (under 5 minutes) the stale value paints, then revalidates |
| Open finance as `A3`, and another landlord's data | `A3` has access only through landlord ownership; another owner's data is denied by the database |
| Cut the network, then edit | Failure is visible; nothing cached as a success |

### J4. Admin: review, moderate, publish (web)

| Step | Expected |
| --- | --- |
| Sign in without the second step; deep-link to `/admin/users` | Held at `/two-step-login`; the database also refuses |
| Wrong TOTP three times | Clear error; no bypass by deep link |
| Review an identity and a Passport document | Recorded once, audited, user notified; denial needs a reason; a verified user is never downgraded by re-submission |
| Verify an apartment | Becomes `is_verified`; an unverified landlord's listings stay hidden |
| Hide, then unhide a listing | Leaves and returns to public browse; owner, existing tenants and admins still see it |
| Suspend, then restore a tenant | Sessions deleted and user lands on `/suspended`; restore signs in again with no data lost |
| Resolve a user report | Closes with an outcome; blocks stay in place |
| Publish an app release with `http://`, or required above latest | Both refused |
| Re-save identical live values, then change one | No history row, then one history row with old and new values |
| Call an `admin_*` RPC as a non-admin | Denied, including for `A3` |

### J5. Cross-platform continuity

Two devices on the same tenant account, plus the web session.

- Chat both ways: ordered delivery, right conversation and apartment chip, unread counts update without refresh.
- Unsend on web disappears on mobile (the `message_deleted` broadcast). Reactions appear after the documented refresh, since they are not Realtime-published.
- Start a payment on one platform and finish on the other: one payment row, both reflect it.
- A notification tap deep-links to the exact screen and marks the row read. A web-only notification on mobile shows the web-only notice, never a phantom route.
- Sign out on web: mobile either keeps working or lands cleanly on sign-in. Suspend mid-session: both platforms stop with the notice and no crash loop.

### J6. Account lifecycle and security

- Change password with a wrong current password: inline error on that field. Correct change: other sessions signed out, this one stays.
- Change email: codes go to both inboxes; one code alone does not complete it; completion updates Auth and the profile row and signs out other sessions. Nothing sensitive reaches the URL.
- `G1` and `G2` see Change Email disabled with a "Signed in with Google" chip; no route bypass works.
- Forgot password on web and mobile: request, code, verify, new password, global sign-out. During a marked recovery session any other route signs the user out; a background prefetch gets a `204`, never a sign-out; a recovery older than 30 minutes is abandoned. Killing the mobile app mid-reset leaves no verified session behind.
- No account-type lookup is exposed before verification (no account enumeration).

---

## 3. Feature areas

For each area, confirm the rule on every platform listed. Platform is web (W), mobile (M) or both.

### 3.1 Documented gaps (do not file as defects)

File a defect only if the experience is worse than described: a crash, a dead link, or a route that renders nothing.

- Reporting a tenant rating shows a "coming soon" notice (W `ReportRatingButton`, M rating-card footer).
- Mobile e-wallet linking in Saved payment methods is not built.
- Web Settings → Language & Region is informational only.
- The web "Android coming soon" download state.
- There is no account-deletion flow.
- The admin portal is web-only; admins cannot use mobile.

### 3.2 Rules that must hold

| Area | Platform | Verify |
| --- | --- | --- |
| Sign-in and session | W, M | Correct portal with no wrong-shell flash; one generic wrong-password message. Unconfirmed email gets a fresh code. A confirmed email with no `users` row keeps its session and goes to finish-profile (no lockout). A suspended account sees the notice (check `get_my_suspension_status` before treating "no row" as unfinished). Sign-out clears caches and signed URLs. Admin without `aal2` is held on every admin route; backup codes work once. |
| Sign-up and profile | W, M | Duplicate email gives a friendly message. Password list matches the server rule exactly. Birth date: exactly 18 passes, 17y364d fails, 110 passes, 110y+1d fails, leap-day clamps, no `toISOString()` day shift. Mobile accepts `0917 123 4567` and `09171234567` only (not `+63`, `63`, 10 or 12 digits). Ambiguous cities require a province. A well-formed but unrecognized ZIP only warns. Edit profile seeds its draft once per account and uploads photos on Save only. `admin` is never grantable. Long, emoji, accented and RTL values render intact. |
| Identity and Passport | W, M | Verification session is single-use; ID back requires ID front; the selfie is never exposed to a landlord. One supporting document per type (picker disables it, the trigger refuses a direct insert). Replace uploads first, then calls `replace_passport_document`. Expired documents never attach or earn badges. The verified-landlord badge needs a verified, unexpired ownership document (NBI never earns it; a failed lookup shows no badge). Tenant wallet, landlord wallet and the NBI overlap follow `selectSupportingDocuments`. |
| Public site | W | Landing route connects the real anchors, is `aria-hidden`, never captures clicks, and is absent under 768px or reduced motion. With JavaScript off the page renders normally. `/#contact` from another page lands on the anchor with no scroll-jack. Static pages have no dead links. Journey and mobile demo routes are not imported by production code. |
| Browse, map, search | W, M | Every filter changes results and the count matches. List and map share one query builder, so results match. Filters and map camera live in the URL; changing a filter on the map uses `history.replaceState` and never remounts the map. Zero results has a way to clear filters. Paging is bounded and keyset-stable. Hidden, deleted and unverified-owner listings never appear publicly. Missing photos fall back to `/images/house-check.png`. Public photos are resized, not served as multi-MB originals. |
| Apartment detail | W, M | Same content from every entry path. Rent, deposit and advance add up with no rounding drift. Ratings use the mean of individual ratings and the distribution sums to the total. Apply Now gating: signed-out, own listing, pending application, unverified and incomplete passport each show their own reason. Share uses the public `/browse/<id>` URL, never `mobile://`. A hidden listing shows unavailable on the next read. |
| Favorites | W, M | One row per favorite, reflected on every surface at once; own listings refused by the database. Web Favorites reads a bounded 50 rows, one cover per listing; the 30s/120s browser reuse never shows a removed listing or another account's data. |
| Applications (tenant) | W, M | Readiness re-checked at submit. Proof of income is required unless Student/Unemployed (enforced in the database). Forged document paths and changed `tenant_id`/`apartment_id` are rejected on direct insert and update. A duplicate application is refused. Withdrawing notifies the landlord and creates no tenancy. Detail stays readable after the listing is hidden or deleted. |
| Visit requests | W, M | Date must be in the future (UI and database). Reschedule keeps one active schedule. Decline and cancel notify the right party. Approving twice in two tabs gives one approval and one notification. Unverified tenants get the verification message verbatim. |
| Applications (landlord) | W, M | Filters match counts. Approving yields exactly one tenancy and is idempotent across tabs; an applicant no longer verified is refused by the guard. Rejection reason rules are enforced. Approving another owner's listing is denied by the database. ID front and back readable, the selfie never. Past applications stay readable. |
| Listings | W, M | Web and mobile apply the same pricing, address, amenity and description rules. Required-field errors scroll to the first error with no network write. The map pin is an HTML overlay and an out-of-CAMANAVA pin is refused. Photo count limits are enforced, compressed, never base64. Slow upload then cancel leaves no orphan. Clients cannot set `is_verified`, moderation columns or `status = unverified`. Unverified landlords reach no create or edit route. Price fields with commas or symbols parse or reject consistently. |
| Tenancy and billing | W, M | New tenancies use `billing_version = 1`; historical `NULL` rows keep legacy behavior. The initial bill itemizes rent, deposit, advance and pending fees. Leases starting on the 31st or Feb 29 clamp the due day. A month due before move-in is skipped. Deposits and fees never count as rent paid or income. Ending a tenancy moves it to history. Re-letting gives a fresh bill. |
| Payments | W, M | Reference is `APT-` plus exactly eight capital letters or digits and is unique. A pending row exists before the provider call and survives a network cut. Success settles once and is persisted. Reloading the return URL changes nothing. `-fail`, `-expired` and card `0002` end failed with retry available. A tampered return reference is refused. Cash stays pending until the landlord confirms. A webhook racing a manual verify settles once. Already-paid or waived fees are refused before checkout. Another tenant cannot pay the tenancy. History filters and counts match the ledger. Saved methods store type names only. |
| Maintenance | W, M | Created against the active tenancy; no active tenancy is blocked. Resolution notes, status and fee are written atomically. The fee goes `pending → paid | waived` and never reopens; tenants cannot set `waived` or `fee_amount` directly. A fee reserved by a pending payment cannot be waived. Legacy fees with no tenancy stay unbilled. Two landlords never see each other's requests. Offline resolve shows a visible failure. |
| Signed lease | W | Landlord uploads on an active tenancy only, under `{tenancyId}/`. Tenants and admins cannot upload or read through storage. The four lease columns reject direct writes. Replacing resets acknowledgement. A guessed path on another tenancy is denied. |
| Messaging | W, M | One thread per peer and apartment; chat on your own listing is refused. Text, image, GIF and document send cleanly. Image paste stages only when the clipboard has no text (W) or via the native paste module (M, real dev build). Unsend removes it on both platforms. Read receipts, typing, pin, archive, mute and mark unread go through RPCs only. Blocking works both ways and is refused while sharing an active tenancy. Reports use the shared reason list. One Realtime channel per open conversation; refocus merges without dropping or duplicating. History pages 30 at a time with no duplicates at boundaries. A notification link resolves to the exact thread or falls back to the inbox without marking anything read. |
| Notifications | W, M | Each event produces exactly one row with the right type and recipient. Mark all read affects only the current portal. Audience rules hold: `both` reaches tenant and landlord, `account` reaches all, chat resolves to one portal or stays hidden. Admin review events reach Admin only. Same-sender chat within 15 minutes collapses; opening a group opens the newest conversation and acknowledges the group in one call. Reactions notify only the author, skip muted conversations and blocks, and respect the 15-minute cooldown. Push arrives with the app killed and the tap marks it read; suspended and unverified landlords still receive push. Sign-out then sign-in as someone else shows none of the previous feed. Sidebar dots reflect `is_read` only. The web bell avoids `data-fab-clearance` controls and parks in `data-fab-dock`. |
| Reviews and ratings | W, M | Eligibility is three calendar months (month-end clamped: Jan 31 → Apr 30) or lease end; tenant reviews also need status `ended`. Editing updates the same row. Own or never-stayed listings are refused. Ratings are integers 1 to 5 with a bounded comment. Hidden reviews leave the list, average, distribution and edit path. Tenant reviews are readable only by the author, the tenant, related verified landlords and admins, through `get_tenant_reviews`. Review lists sort in the database, page 20 at a time and clamp `?page=999`. |
| Public profiles | W, M | Signed-out landlord pages return only anon-granted display columns: verify the network body has no email, mobile, birth date or address. Signed-in viewers see the contact card. A tenant profile 404s unless that tenant applied to or rented the viewer's apartment. An empty verified-document list means "nothing visible", not "unverified". Past-stay links respect admin-hide. Landlords browsing in-portal stay in the landlord shell and see Apply Now disabled. The Report placeholder appears only on ratings the viewer did not write. |
| Landlord dashboard and units | W, M | Tiles agree with the underlying rows for the period. Cash-to-confirm opens the pending-cash list with a matching count. Confirming or declining cash updates the unit list and all-units cache together and rolls both back on failure. A property with no tenant shows an empty state. A dual-role account in the landlord portal sees only landlord data. |
| Finance and analytics | W, M | Figures reconcile between the report, property performance and category drill-downs. Category totals equal the sum of their property rows. Spending limits and reserve plans stay separate from operating cost. Drawers cannot be dismissed while saving and keep values after a failed save. Concurrent edits in two tabs reconcile or warn. A new landlord sees an honest empty state, with no NaN, infinity or `₱0` shown as profit. |
| Settings | W, M | Settings opens from `?settings=open`, closes cleanly and does not reopen on back. Notification preferences interact predictably ("Partial" only when exactly one master is on). Pet rules: at least one kind, count not below the kind count, cap shown as "4+", legacy single-string kinds normalized. Theme changes apply instantly with no wrong-theme flash. Security rows enable only for eligible identities. About shows the APK version plus update ID and channel. The suspension notice offers sign-out and renders no portal route. |
| Admin portal | W | List filters apply optimistically without remounting; search debounces. Queue counts match their lists and a reviewed item disappears everywhere. Signed documents refresh when expired. Resolving a report twice is idempotent. Analytics use Manila-day boundaries and show zero-days as zero. Every admin write appears in the activity log. Tables stay usable on a narrow viewport. |
| Ava (AI search) | W, M | Normal questions return a reply, quick replies and filters, searched through the app's own client so RLS still decides. Unparseable input, an exhausted daily allowance, a missing key and a provider outage all fall back to keyword search. `sanitizeAiFilters` strips bad types, negative prices and unknown cities. Only chat text is sent out and no message text is logged. |
| App updates and OTA | M | Below `min_version`: blocking "Update required", https links only. Below `latest_version`: dismissible, remembered per device and version. No row, network failure or malformed version fails open. iOS is never blocked by the Android gate. An OTA delivers a restart prompt and changes the update ID; a native change alters the fingerprint and the OTA is not delivered to the old APK. Development builds show no OTA prompts. |
| Mobile behavior | M | Every bottom sheet opens at a snap point with its last row visible. Sheets hosting an iOS date picker use `disableFullWindowOverlay`, so the picker shows above them. Reopened sheets reseed from the request. Android back closes only the top layer. The keyboard never hides the focused input. Pull to refresh works on every list. Deep links never produce a black screen. Cold start routes exactly once between onboarding, finish-profile, portal and suspension. A saved portal choice is validated against current roles. A failed boot prefetch resets to a retryable state. Dynamic Type 130% clips nothing. Airplane mode shows a real offline state on every tab. |
| Web behavior | W | Each route renders its shell first and streams secondary regions behind skeletons that match the loaded shape. Back and forward restore URL state. Private routes signed out redirect with a safe return path (no open redirect); wrong-role routes redirect or deny without a partial shell. Two tabs with conflicting writes reconcile or warn. The console shows no hydration or key warnings, and no swallowed 4xx or 5xx. 375px has no horizontal scroll. Safari handles cookies, dates and `Intl` correctly. |

---

## 4. Attacking the rules

Do these with the network panel open, calling the backend directly.

### 4.1 Permissions and RLS

| Attempt | Expected |
| --- | --- |
| `anon` selects `*` from `users` | Only display columns (id, names, avatar/background, roles, status, created date). Any email, mobile, birth date or address is **S1**. |
| `anon` reads `payment`, `chat`, `maintenance_request`, `passport_documents`, `tenant_reviews` | Zero rows |
| One tenant reads another's applications, documents or payments; one landlord reads another's units, applicants or finance | Zero rows |
| Landlord reads their applicant's ID front/back, then the selfie | Allowed, then denied. For withdrawn or rejected applicants, record the actual rule and confirm web, mobile and the database agree. |
| Non-admin calls `admin_set_user_access`, `admin_publish_app_release`, `admin_resolve_user_report`, or reads `app_release_history` | Denied |
| Admin at `aal1` calls an `admin_*` function | Denied |
| Any client calls `create_notification()` or `consume_ai_search_allowance`, or inserts into `notifications` | Denied (only `is_read` is updatable) |
| Direct writes to `conversation_preferences`, `user_blocks`, `user_reports`, `app_releases` | Denied; RPC only |
| Tenant sets `fee_status = 'waived'` or `fee_amount`; client updates the signed-lease columns | Denied |
| Client sets `is_suspended`, `roles`, `account_status`, `is_verified`, or apartment moderation columns | Denied |
| Tenant reads another tenant's `tenant_reviews` through the table | Zero rows; reads only through `get_tenant_reviews` |
| Suspended account reads its own rows | Denied by the active-account policies |
| Unverified landlord reads their own listings | Allowed for the owner, hidden from everyone else |

### 4.2 Self-transaction and role guards

Run each with `T7` (the highest-value account), then repeat one insert per guard with an `A3` token to confirm admins are not exempted.

- `T7` applying to, messaging, favoriting, reviewing, or creating a tenancy or payment on their own listing is refused by the database.
- An admin-only account has zero consumer access. `A3` applying to someone else's listing succeeds.
- Unverified tenant: visit, maintenance, payment, review and chat inserts are refused with one consistent message. With an active tenancy, paying and reporting maintenance are allowed.
- Unverified landlord: everything is blocked except, with an active tenancy, confirming cash and answering maintenance. Their listing and images are not public.
- A role removed mid-session fails the next guarded write with a clear message. A historical-only role never grants a new one.

### 4.3 Concurrency and duplicate submission

- Double-click and two-tab submits on every primary action (application, payment, listing, review, message, password change): one row, one notification.
- Back button then resubmit, and refresh mid-payment: refused or idempotent; the pending row still resolves.
- Two devices chatting at once: ordered, no duplicates, none lost. A Realtime event during a refetch never drops the newer arrival.
- Optimistic update then server failure: full rollback.
- A mutation finishing after sign-out or account switch: the late callback is rejected.
- Two devices confirming the same finance month: one confirmation, one history entry.
- A read starting, a write landing, then the read returning: the stale read never overwrites the fresh value.

### 4.4 Money integrity

- Allocations sum to the payment amount, with no drift on `.5` amounts; one payment settles exactly one period.
- Deposits and maintenance fees are never rent paid or income; advance lands on month 2 only after confirmation.
- Collected revenue is never called profit (read every finance label). Before a month review, the UI says "needs review", not `₱0`.
- A refund reduces the settled amount without creating a second negative income row. Payout status never rewrites amounts or history.
- No float artifacts (`₱11999.999999`), consistent thousands separators.
- A 23:59 Manila payment lands on that day, not the next UTC day. Yearly ledger totals equal the sum of the monthly reports.

### 4.5 Dates and boundaries

Check each boundary on web, mobile and the database, and expect the same answer on all three.

- Due-day clamping for 29, 30 and 31 across leap and non-leap February.
- Review eligibility month-end clamping; a lease starting in the past and in the future.
- Passport expiring today (valid or expired, but consistent).
- 18th and 110th birthday today.
- Recovery marker at 30 minutes; notification grouping at 14:59 (groups) and 15:01 (does not).
- Finance cache at 60s and 5 minutes; profile cache at 30s.
- Chat day separators across midnight (Manila has no DST): none duplicated or missing.

### 4.6 Resilience, empty states and volume

- Kill the network on every list and reload: an error with retry, never an empty state pretending there is no data. Cut it halfway through every form submit: no partial write, safe retry.
- Close a modal mid-request, interrupt an upload, time out an edge function (Ava, `paymongo`, push), drop the Realtime socket, fail push-token registration, take the backend down: each degrades gracefully with a coherent message and no stuck pending checkout, orphaned row or duplicate message.
- A database rejection shows the database message, not "something went wrong". An expired token gets one refresh attempt, then a clean re-auth.
- On every screen, check four states: empty (purposeful, with a next action), first load (skeleton shaped like the content), refresh with data present (no skeleton flash), and error (distinct from empty, with retry). Also check one item, a 200-character title, and one region failing while another works. Skeletons never leak private data or show fake counts.
- Volume: 0, 1, 50, 51 and 500 rows in each major list; a row added or deleted while paging; identical timestamps with a stable id tiebreak; chat with 1,000+ messages; notifications capped at 50 without a phantom badge; 24 months of analytics; a landlord with 100 units, with the 500-row payments cap stated.
- Screens to sweep: Browse, Map, Apartment, Favorites, Applications, Visits, My Rental, Payment and history, Maintenance, Messages and conversation, Notifications, Passport, all Profiles, Analytics and tabs, Units, Tenant information, Dashboard, Admin lists, Settings.

### 4.7 Input hardening

- XSS payloads in every free-text field render as text. SQL-ish text (`'; drop table`, `%`, `_`) is literal in search.
- Emoji, combining and zero-width characters, and RTL text survive intact.
- Numeric fields: negative, zero, decimal, `1e9`, leading zeros are rejected or normalized, never stored as strings. Whitespace-only required fields are rejected.
- Exactly at and one past each limit: description 2,000, review comment 1,000, release notes 1,000.
- A non-image renamed `.jpg`, a 20MB image and a 0-byte file are rejected clearly. A huge chat paste hits a documented limit instead of freezing.

### 4.8 Accessibility and performance

- Keyboard-only pass on every web form and modal: visible focus, logical order, Escape closes, focus returns to the trigger.
- Icon-only buttons have accessible names; errors are announced and tied to their fields; muted text meets contrast; status color is never used alone.
- Screen reader pass on Browse → Apartment → Apply and Payment → Receipt. Decorative graphics are hidden. Mobile touch targets are at least 44pt.
- Performance: no route blocks on a secondary query; 50 cards load no multi-MB originals; 200 map pins stay smooth; low-end Android cold start and 1,000-message chat scroll hold up; three full journeys without reload show no channel or subscription growth; a page load makes one profile request, not several.

### 4.9 Parity: web versus mobile

Confirm the rule is identical even where layout differs. Any different outcome is a defect unless it is a documented gap.

| Capability | Rule that must match |
| --- | --- |
| Sign-up, OTP, finish-profile | Validation, messages, database writes |
| Password recovery, change password, change email | Code flow, no account lookup, eligibility, field errors, sign-out scope |
| Identity verification and Passport | Single-use session, one per type, reset on replace |
| Browse, map, favorites | Same result set, bbox rules, write and invalidation |
| Apply, visits, listings | No upload step, docs by reference, readiness re-read, same pricing, address, amenity and description rules |
| Tenancy, payments, maintenance | Same bill shape, reference shape, pending-row rule, fee machine, waive rules |
| Chat, notifications | Reactions, blocks, unsend, grouping, audience filtering, deep links |
| Reviews, public profiles | Eligibility, limits, visibility, link rules |
| Finance, settings, Ava | Same figures and stored values; same sanitization and fallback |

Intentional differences (not defects): admin portal and Profit & planning layout are web-only; the app-update gate is Android-only; rating reports are a placeholder on both; mobile e-wallet linking and web Language & Region are not built.

---

## 5. Suspect register

Where documentation and code most plausibly disagree, or where a rule exists on one side only. Probe these first; each must be answered, not just "looked at".

1. **Web online checkout persistence.** `apps/web/app/tenant/payment/constants.ts` still has `mockSessionIdForReference`, `mockSessionStatus` and `mockPaymentForSuccess`, and `mockPaymentForSuccess` is returned for any reference starting with `pay_`. Prove whether a web online payment creates and settles a real `payment` row. A success receipt with no row is **S1**.
2. **Mock branch versus edge function.** With `PAYMONGO_SECRET_KEY` unset, web and mobile must produce the same persisted outcome, not just the same screens.
3. **Client mirrors of database rules.** `canUseLandlordFeatures`, `isLandlordAccessBlocked` and `evaluateApplicationReadiness` must match the database. A UI that allows what the database rejects is S3; the reverse may hide an S1.
4. **Rent period math.** `@repo/utils` `rentPeriod.ts` must match `notify_rent_due_status()`; compare the app's "next due" with the notification text for one tenancy.
5. **Mirrored rules.** Web `lib/tenant-preferences.ts` duplicates `@repo/constants` pet rules; `apartmentPricing.ts` mirrors `guard_apartment_pricing()`. Test the same input on both and every pricing boundary against the database.
6. **Legacy chat notifications.** Rows without `recipientPortal` resolve at read time. None may appear in both portals, and a deleted apartment must not throw.
7. **Realtime publication drift.** `chat_reactions` is unpublished. Confirm the channel still joins for the valid bindings.
8. **`billing_version` split.** Every new tenancy must be `1`; a new `NULL` silently runs legacy billing.
9. **Signed-lease column grants.** `authenticated` holds table-level UPDATE on `tenancies`, so only a trigger protects the four lease columns. Test all four directly.
10. **Dual-role self-dealing.** `T7` through every guard.
11. **Suspension versus "no profile".** Suspended accounts are invisible under RLS; no path may send them to finish-profile.
12. **Anon column grant.** One `select *` on `public.users` in a public page leaks email and mobile. Check the response body of every public route.
13. **Sheets with native modals.** Test every mobile sheet that hosts a picker.
14. **Native config.** Media-library save and image paste only work after prebuild and rebuild. A dev-client-only failure is environment, but a missing permission string is a real defect.
15. **Manila dates.** Any `toISOString()` on a date-only value shifts the day before 08:00. Sweep birth dates, review eligibility, due dates and receipts.

---

## 6. Logging defects

File one defect per cause, not per symptom. Link duplicates to the first filed ID.

- A failure caused by the test environment (stale dev client, wrong Supabase project, unapplied migration) is not a product bug: fix the environment and note it.
- A defect that reproduces for one account only is still filed; say what makes that account special.
- Every `[~]` has a defect ID.
- If a rule changes during testing, update the rule and the code, not the test.

```text
BUG-<nnn>: <one-line title>

Severity:   S1 | S2 | S3 | S4
Platform:   Web | Mobile (iOS/Android) | Both
Persona:    account code from section 1.3
Build:      git SHA + app version / OTA ID
Area:       route or RPC (for example /tenant/payment, guard_rental_application_insert)

Preconditions:  exact data state (tenancy id, application id, status)
Steps:          1. ... 2. ... 3. ...
Expected:
Actual:
Evidence:       recording, console, request and response (redacted), row state after
Reproducible:   always | 2/3 | intermittent (describe the race)
Suspect:        file or function, if known
```

---

## 7. Schedule and exit criteria

### Suggested schedule

Two testers over five days, split by journey rather than platform so both see cross-platform behavior.

| Day | Tester 1 | Tester 2 |
| --- | --- | --- |
| 1 | Setup, J1 | Setup, J2 |
| 2 | J5, J6, sign-in through Passport | J3, J4, finance and admin areas |
| 3 | Public site through applications | Landlord, tenancy, lease |
| 4 | Messaging, notifications, reviews, profiles | Settings, Ava, updates, platform behavior |
| 5 | Permissions, guards, concurrency | Money, dates, resilience, sweeps |

Finish with a joint pass: parity (4.9), the suspect register, and a re-test of every S1 and S2 after fixes.

### Done when

- Every check is passed, blocked with a reason, or a documented gap.
- No open S1 or S2; each fix has been re-tested.
- Every defect has a fix or an accepted-risk decision with an owner.
- The parity matrix has no unexplained divergence, and every suspect is answered.
- J1 to J6 pass end to end on both platforms, in one continuous run, on the final build.
- CI is green on the tested commit (mobile lint and Jest; web lint, typecheck and tests) plus the three `db:*` suites.
- No test-only code, mock bypass or debug route ships in the final build.
- The build identity recorded in 1.1 is the build that passed.
- Findings that imply a permanent rule change are written into `AGENTS.md`, `DESIGN.md` or the matching `docs/*.md`, not only into this document.
