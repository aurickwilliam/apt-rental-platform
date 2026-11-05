# APT Capstone Defense: Team Demonstration Flow

Total time: about 18 minutes. Each block names the objective it proves, who does it, what to click and what to say. If you have less time, drop the blocks marked *optional*.

## The five objectives this demo proves

| # | Objective (from the paper) | Demo block |
|---|---|---|
| 1 | Let tenants search and filter apartments by location, price and amenities | Block 1 |
| 2 | Give rental owners a platform to list and manage properties | Block 2 |
| 3 | Integrate a secure online rental process, terms and agreements, and payment | Block 3 |
| 4 | Improve communication between rental owners and tenants | Block 4 |
| 5 | Reduce rental scams and improve trust through verification | Block 5 |

The story is one rental from start to finish: a tenant finds a unit, applies, signs, pays, reports a repair, and an admin keeps the platform trustworthy.

## Roles (fill in names)

| Role | Name | Device | Accounts used |
|---|---|---|---|
| **Narrator** (talks, never clicks) | | none | none |
| **Tenant driver** | | Phone or emulator, screen-mirrored | demo tenant (mobile app) |
| **Landlord driver** | | Laptop, browser profile 1 | demo landlord (website) |
| **Admin driver and timekeeper** | | Laptop, browser profile 2 | demo admin (website, with authenticator app) |

Rule: the narrator says what is about to happen, the driver does it, the narrator says what it proves. Do not talk over each other.

## Before the defense (do the day before and again one hour before)

1. Use **test accounts and test data only**. No real IDs, cards or phone numbers.
2. Create and sign in: one **verified tenant**, one **verified landlord**, one **admin** with the authenticator app set up. Keep each signed in on its own device or browser profile.
3. Seed what you need so you are not waiting live:
   - A **new tenant account with its ID and selfie ready to upload but not yet verified** (for Block 5).
   - A **landlord account that is not yet verified** with ownership documents ready (for Block 5), or use the one verification already pending.
   - An apartment listing with **photos, rent, amenities and CAMANAVA address** ready to open.
   - One **approved tenancy with rent due** for the payment demo, and one **ended tenancy** for the tenant rating.
4. Payments run in **test mode**. Have PayMongo's test card ready (for example 4343 4343 4343 4345) and know the e-wallet test flow. Say "test mode, no real money" out loud before paying.
5. Check the mobile app version, the website URL and the Wi-Fi. Turn on Do Not Disturb on every device.
6. **Record a backup video** of the whole flow. If the network fails, play it and keep narrating.
7. Open every page you will need in tabs, in order, before you start.

## The demo

### Block 0. Opening (1 min, Narrator)
- "APT is one website and mobile app where tenants and rental owners handle the whole rental, and admins keep it trustworthy. We will follow one rental from search to repair."
- Show the three devices and who drives each.

### Block 1. Tenants search and filter (3 min) | Objective 1 | Tenant driver
1. Open **Explore** on the mobile app. Scroll the rows briefly (recommended and filler rows).
2. Search a CAMANAVA city, then open **Filters** and set **city, budget range and an amenity** (for example pet friendly or parking). Show the result count changing.
3. Switch to **map search**. Pan the map and open a pin.
4. Open the **Ava assistant** (sparkles button) and type: "2BR under 15k sa Malabon na pet friendly". Show the replies and the matching listings.
5. Open one listing: photos, rent, deposit and advance, amenities, landlord card with the **verified badge**.
- Say: "Search, filters, map and the assistant all use the same filters. Ava only suggests filters; the listings come from our own database."
- Proves: location, price and amenity filtering.
- *Optional:* show the same filters on the website for 20 seconds to prove it works on both platforms.

### Block 2. Owners list and manage properties (3 min) | Objective 2 | Landlord driver
1. On the website, open **My Properties** and **Add property**. Fill: name, CAMANAVA city and barangay, pin on the map, photos, rent (deposit and advance options), amenities, lease duration (6 months, 1 year or 2 years). Save.
2. Open the saved listing and **edit** the rent or availability. Show the listing status.
3. Open the **Dashboard**: collected rent, occupancy, pending applications.
4. Open **Profit and planning**: expenses and budgets.
- Say: "Owners manage listings, tenants and money in one place instead of notebooks and text messages."
- Proves: listing creation and management.
- If time is short, use a **pre-filled listing** and show only the steps that matter (address, pricing, photos).

### Block 3. Secure rental process, terms and payment (4 min) | Objective 3 | Tenant and Landlord drivers
1. **Tenant** (mobile): open the listing, **Book a visit**, then **Apply**. Point out that **APT Passport documents attach automatically** (no re-uploading) and the application shows its status.
2. **Landlord** (web): open **Applications**, open the application, review the attached documents, and **Approve**. A tenancy starts.
3. **Landlord** (web): open the tenancy and **upload the signed lease**. **Tenant** (web or app as supported): open **My Rental** and confirm the lease. Say this is the agreed terms on record.
4. **Tenant** (mobile): open **Payments**, show the **move-in bill** (first month, advance, deposit), choose a method the landlord accepts, and pay with the **test card or e-wallet**. Return to the app and show the **receipt**.
5. **Landlord** (web): open **Payments** and show the payment as paid. Optionally show a **cash payment** that the landlord confirms.
- Say: "Documents, terms and payment are in one flow, and every payment has a reference and a receipt."
- Proves: secure online rental process, agreement and payment.

### Block 4. Communication (3 min) | Objective 4 | Tenant and Landlord drivers
1. **Tenant** (mobile): open **Messages** and send a message to the landlord about the unit.
2. **Landlord** (web): show the message arriving live and the **notification**. Reply.
3. **Tenant**: create a **maintenance request** (category, description, photo).
4. **Landlord**: open the request and **update the status** (optionally add a repair fee).
5. **Tenant**: show the status change and the notification.
- Say: "No more calls and texts that get lost. Messages, requests and updates are recorded in the app."
- Proves: structured two-way communication and repair tracking.

### Block 5. Fewer scams through verification (3 min) | Objective 5 | Tenant and Admin drivers
1. **Tenant** (mobile): start **identity verification** on the new account: ID front, ID back and live selfie. Submit. Show the pending status.
2. **Admin** (web): sign in with the **second step (authenticator code)**. Open **Verifications**, review the ID and selfie, **approve**. Mention rejection needs a reason.
3. **Tenant**: show the account now **verified** and what it unlocks.
4. **Admin** (web): open the **pending listing**, approve it, and show that an admin can **hide** a listing.
5. **Landlord** (web): show the **landlord verification wall** on the unverified landlord account (cannot list until verified), and the **verified badge** a verified landlord gets.
6. *Optional:* **Landlord** rates the tenant after the ended tenancy (tenant profile, rating and comment), and **reports** a user from a conversation.
- Say: "Nobody can list or transact until identity is checked, an admin reviews it, and landlords with verified ownership documents get a visible badge."
- Proves: verification, admin review and trust features.

### Block 6. Closing (1 min, Narrator)
- Recap in one breath: "Search, list, apply, sign, pay, communicate, repair and verify: all five objectives in one rental."
- Invite questions. The admin driver keeps the timer; the narrator has a prepared answer for the revenue model and limitations (CAMANAVA only, online only, payments in test mode).

## Timing summary

| Block | Minutes | Cumulative |
|---|---|---|
| 0 Opening | 1 | 1 |
| 1 Search and filter | 3 | 4 |
| 2 List and manage | 3 | 7 |
| 3 Apply, sign, pay | 4 | 11 |
| 4 Communicate and repair | 3 | 14 |
| 5 Verify | 3 | 17 |
| 6 Closing | 1 | 18 |

## If something fails

| Problem | What to do |
|---|---|
| Wi-Fi drops | Switch to phone hotspot; if still down, play the backup video and keep narrating |
| Payment page is slow | Say "test mode"; show the receipt of a payment you already made |
| A screen is empty | Open the pre-made tab or account you prepared for that block |
| Authenticator code is rejected | Wait for the next code; the admin driver keeps a backup code |
| A bug appears | Stay calm, say "we note this as a known limitation", move to the next block |
| Running late | Skip the *optional* items, then shorten Block 2 to a pre-filled listing |

## Likely questions to rehearse

- Is any real money used? (No, payments are in test mode.)
- Who sees my ID? (Only you and the admin who reviews it; files are private.)
- What stops a fake landlord? (Verification, ownership documents, admin review, and the database blocks unverified landlords.)
- What happens to cash payments? (Recorded when the landlord confirms them.)
- How will APT earn? (Use the commission model you decided on and say it is proposed.)
