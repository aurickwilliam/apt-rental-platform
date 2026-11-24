# APT Module List — Updated for the Thesis Paper

Part A lists what changed against the pasted version. Part B is the full clean text, ready to paste back into the paper (no markers). Numbers follow your original numbering; new items take the next free number so existing figure references (HIPO diagrams) stay valid.

---

## Part A — What changed

### Wording / numbering fixes (all roles)

| Where | Fix |
|---|---|
| Tenant 4.1 | "additional chargers" → "additional charges" |
| Tenant 5.4.x | Numbering skipped 5.4.3 and had two 5.4.4 items; renumbered 5.4.3–5.4.11 in order (Apartment Images moved from 5.4.10 to 5.4.3) |
| Tenant 5.5 | Removed stray backtick before the heading |
| Tenant 6.2.1 | Said "allow the **landlord** to change" in the tenant section → "tenant" |
| Tenant 6.6 / 6.8 / 6.9 | 6.9 renamed "Tenant Ratings from Landlords" (it shows ratings landlords gave the tenant, not reviews of landlords) |
| Tenant 9, 10, 11 / Landlord 10, 11, 12 | "Frequently Ask Questions" → "Frequently Asked Questions"; "Terms of Condition" → "Terms and Conditions"; "Privacy & Policy" → "Privacy Policy" |
| Landlord 3.1.2 | Heading and description were run together; split |
| Landlord 4.1 | "if the tenant switches residency" → "landlord" |
| Landlord numbering | Notifications was 9.0 and Dashboard 13.0 while the tenant side puts Notifications last; kept your order, only fixed text |
| Admin 2.3 | Title "View and Suspends User" → "View and Suspend User" |

### Descriptions updated (behaviour now differs from the paste)

| Module | What changed |
|---|---|
| Tenant 1.1 / Landlord 1.1 Registration | Two required policy checkboxes (Terms and Privacy) |
| Tenant 1.2 / Landlord 1.2 Login | Failed-attempt lockout with countdown |
| Tenant 4.1.1 Pay Monthly Rent | Tenant sees only the methods the landlord accepts; bank transfer = BPI or UnionBank |
| Tenant 4.1.2 Payment Reminder | Delivered in-app, push and email |
| Tenant 4.2 Maintenance Status | Also shows optional resolution fee (pending / paid / waived) |
| Tenant 4.3 Payment History | Failed payments show as Failed; receipt opens from the list |
| Tenant 5.2 Map Search | Pins load for the visible map area; same filters as the list; map position kept in the link |
| Tenant 5.3 Ava | English and Tagalog, landmark and distance answers, daily allowance, keyword fallback |
| Tenant 5.6 Carousel | "Recommended for You" row with reason chips; at least 9 rows |
| Tenant 5.7 Search | Last 5 opened apartments shown under the empty search box |
| Tenant 5.4.5 Review and Rate | Unlock prompt on the Rentals screen when the stay becomes eligible |
| Tenant 5.4.8 Lease Agreement | Tenant views **and confirms** the landlord's signed lease |
| Tenant 6.2 Settings | Now lists Language, Rental Preferences, Notification and Tutorial settings as submodules |
| Tenant 6.8 Public Profile | Signed-out visitors can view a landlord; verified badge, ownership documents, full reviews page |
| Tenant 8.3 Chat Interactivity | Added mute, mark as unread, report, and image paste |
| Landlord 3.4 Rental Applications | Applicant ratings preview and saved-preference snapshot |
| Landlord 3.5 Maintenance | Resolution notes with an optional fee; waive a fee |
| Landlord 3.6 Payments | Confirm or decline cash; receipts can be saved to Photos |
| Landlord 4.4 Passport | Ownership documents earn the Verified Landlord badge |
| Landlord 5.0 / 5.1 Profit | Collected revenue vs expenses; budget vs actual; month picker; CSV export |
| Admin 1.2 Add Admin | Needs a second step plus an authenticator code from the last 5 minutes |
| Admin 2.3 Suspend | Permanent, 7, 30 or 90 days; person is notified and emailed |
| Admin 3.1 Hide Listing | Landlord sees the reason and can ask for a review |
| Admin 7.0 Report | Actions: warn, hide listing, suspend; landlord review requests handled here |
| Admin 8.0 App Updates | Latest vs required version, https link check, release history |

### New modules / submodules added

**Tenant:** 1.4 Registration Policy Acceptance · 1.5 Finish Profile · 1.6 Account Suspension Notice · 2.1 Personalization · 4.2.1 Submit Maintenance Request · 4.1.4 Unfinished Payment Banner · 5.4.10 Report Listing · 5.4.11 Verified Badge · 6.2.2 Language · 6.2.3 Rental Preferences · 6.2.4 Notification Settings · 6.2.5 Tutorial Replay · 6.2.6 Change Password · 6.10 Landlord Reviews (was unnumbered in the old 6.9 text) · 6.11 Report Profile · 8.4 Block and Report User · 12.1 Email Notifications · 13.0 App Update Module · 14.0 Public Website Module

**Landlord:** 1.1.2 Registration Policy Acceptance · 1.3 Finish Profile · 1.4 Account Suspension Notice · 1.5 Verification Required Gate · 3.3.7 Listing Visibility · 3.3.8 Request Listing Review · 3.3.9 End Tenancy (Vacate) · 3.5.1 Maintenance Fee · 4.2.3 Change Password · 4.2.4 Language · 4.2.5 Notification Settings · 4.2.6 Tutorial Replay · 4.9 Report Profile · 5.2 Expense Tracking · 5.3 Property Performance · 9.1 Email Notifications · 14.0 App Update Module

**Administrator:** 1.3 Admin Profile and Security · 2.5 Manage Admin Access · 7.1 Listing Review Requests · 10.0 Dashboard Module

### Needs your confirmation (I could not verify these in code)

- Forgot Password code "valid for 5 minutes" — the app abandons an unfinished reset after 30 minutes; the 5-minute code expiry is a Supabase Auth setting I can't see from the repo.
- "Four (4) slides" in Onboarding — not checked.
- Tenant 5.4.3: your original had no 5.4.3. I filled it with Apartment Images; if a different item was meant, adjust.
- Landlord 3.1.2.1 (Property Description) is a split of your merged 3.1.2 heading.

---

## Part B — Full clean text

### I. Tenant Modules (Front-End)

The front-end software pertains to the interface tenants interact with upon launching the web and mobile application.

**1.0 Account Module**
This module handles the tenants' account creation and access to the application.

**1.1 Registration Submodule**
If the tenant does not have an account yet, this module will appear. It allows the user to create an account with email or Google sign-up by submitting the necessary personal information. The tenant must tick two boxes, agreeing to the Terms and Conditions and the Privacy Policy, before the account is created.

**1.2 Login Submodule**
If the tenant has not logged in yet, this submodule will appear. It consists of an email and password field, and tenants can also log in with a Google account. After repeated wrong attempts, sign-in is temporarily locked and a countdown shows when the tenant can try again.

**1.2.1 Forgot Password Submodule**
This submodule allows the user to securely reset their password by entering their registered email address. A 6-digit code is emailed, the user enters the code and then sets a new password. Emails that are not registered, or that belong to Google-only accounts, are told so and no code is sent.

**1.3 Verify Account Submodule**
This submodule requires tenants to verify their account by submitting the front and back photo of a valid Philippine ID (driver's license, PhilSys, passport, UMID, PRC, SSS, voter's, postal, senior citizen, PWD; or company, school, TIN as secondary). Until verified, tenants can browse, edit their profile and use favorites, but cannot apply, request visits, message or pay.

**1.3.1 Live Selfie Verification Submodule**
This submodule requires tenants to take a live selfie with the valid ID beside the face to confirm the ID belongs to the tenant.

**1.4 Registration Policy Acceptance Submodule**
This submodule shows the Terms and Conditions and Privacy Policy in a reader before sign-up. Reading does not count as accepting; the tenant must tick each box. The accepted version and date are recorded together with the profile.

**1.5 Finish Profile Submodule**
If a tenant signs in with Google for the first time, or stopped sign-up after confirming the email, this submodule lets them complete the profile (name, birth date, mobile number, address, role) instead of being locked out.

**1.6 Account Suspension Notice Submodule**
If an administrator suspends an account, this submodule explains that the account is suspended, shows the reason and, for a temporary suspension, when it ends.

**2.0 Onboarding Module**
Upon opening the application for the first time this module will appear. It shows a four (4) slide welcome screen with the functions and capabilities of the application.

**2.1 Personalization Submodule**
After onboarding, tenants may answer short questions about budget, preferred cities, bedrooms, pets, parking, smoking and household needs. The answers are optional and are used to personalize the Explore recommendations and can be changed later in Settings.

**3.0 Tutorial Module**
After the first login, this module guides new users step by step through the app. The progress is saved per account, so it does not repeat on every device, and it can be replayed from Settings.

**4.0 My Rental Module**
Once logged in, this module appears upon opening the application/website. It shows the rent summary, lease progress, maintenance status, payment history and quick actions.

**4.1 Monthly Rent Summary Submodule**
This submodule displays the monthly rent of the tenant: the current billing period, due date, amount, any additional maintenance charges, and a button to pay.

**4.1.1 Pay Monthly Rent Submodule**
This submodule allows tenants to pay through GCash, Maya, QR Ph, bank transfer (BPI or UnionBank), debit/credit card (without 3-D Secure) or cash confirmed by the owner. Only the methods the landlord accepts are offered. Online payments run in PayMongo test mode, so no real money moves.

**4.1.2 Payment Reminder Notification Submodule**
This submodule notifies the tenant 3 days before the due date, on the due date, and when the rent is overdue, in the app, by push notification and by email. A failed payment attempt shows an on-screen message (no notification).

**4.1.3 Payment Receipt Notification Submodule**
This submodule notifies the tenant that the payment was received, including cash payments once the landlord confirms them, as feedback that the payment went through.

**4.1.4 Unfinished Payment Submodule**
If the tenant leaves the payment page without paying, a banner shows the unfinished payment with options to check it or cancel it, so the tenant is never charged twice for the same month.

**4.2 Maintenance Request Status Submodule**
After submitting a maintenance request, this submodule lets tenants follow its status (pending, in progress, resolved, cancelled), read the landlord's notes and see any resolution fee.

**4.2.1 Submit Maintenance Request Submodule**
This submodule allows tenants with an active rental to report a problem in the unit with a description and photos.

**4.3 Payment History Summary Submodule**
This submodule lets tenants view their recent payments in summary, with status (including Failed). Opening a payment shows a digital receipt that can be shared and saved.

**4.4 Quick Actions Submodule**
This submodule gives shortcuts to common tasks. Tenants can choose and replace up to five quick actions.

**4.5 Applications Submodule**
This submodule allows tenants to view the tenancy applications they submitted, and to cancel a pending one.

**4.5.1 Book a Visit Request Submodule**
This submodule allows the tenant to propose a date and time to visit a property. The landlord can approve, reject with a reason, or reschedule.

**4.5.2 Application History Submodule**
This submodule allows the tenant to view past applications regardless of status: Approved, Pending, Rejected, Cancelled.

**4.6 Rental Renewal Submodule**
This submodule allows the tenant to review the landlord's renewal proposal, discuss the charges through chat, and accept it to extend the lease. Renewal rent may stay the same or go down.

**5.0 Explore Module**
This module allows the tenant to search for a specific property.

**5.1 Filter Apartment Submodule**
This submodule gives multiple filter options to narrow down results based on the tenant's preferences.

**5.2 Advance Map-Based Search Submodule**
This submodule lets tenants explore the area on a map showing price pins of available apartments. Moving the map loads the listings in view, using the same filters as the list. Tapping a pin shows the apartment card.

**5.3 Ava AI Chatbot Search Submodule**
This submodule lets tenants chat with Ava, the APT Virtual Assistant, to find rental listings. Ava answers in English or Tagalog, remembers the conversation, understands landmarks (for example "near a school") and ranks by real distance. When the AI service is unavailable or the daily allowance is used, a keyword search takes over.

**5.4 View Available Property Submodule**
This submodule allows the tenant to view an available property.

**5.4.1 View Property Description Submodule**
This submodule shows the property name, amenities and inclusions, rental price, payment terms, exact address, size, lease duration, deposit and advance months, floor level, number of occupants, bathrooms, bedrooms and furnishing.

**5.4.2 Map Location Submodule**
This submodule shows the exact pin of the property and lets the tenant see nearby landmarks and establishments.

**5.4.3 Apartment Images Submodule**
This submodule shows the landlord's photos in a carousel that can be zoomed in and out; the first photo is the listing's cover.

**5.4.4 Apply Rental Submodule**
This submodule allows the tenant to apply to rent a property. The tenant confirms their information and answers questions about pets, smoking, parking and disabilities in the household; the answers are saved with the application so the landlord sees what was declared at the time. An account that is not verified, a listing the tenant owns, a pending application or an active rental blocks the application, with an explanation.

**5.4.4.1 Submit APT Passport Submodule**
This submodule is the container of the tenant's legal documents. Valid, unexpired documents are attached to the application automatically; no upload step is needed.

**5.4.5 Review and Rate Submodule**
This submodule lets tenants review a property with a star rating, comment and photos. A tenant can review only after 3 months in the lease or when the lease ends. A prompt on the Rentals screen invites the tenant when the stay becomes eligible.

**5.4.6 Apartment Direction Submodule**
This submodule opens Google Maps or Apple Maps with Drive, Motorcycle, Walk/Bike or Transit modes. There is no in-app routing.

**5.4.7 Landlord Profile Card Submodule**
This submodule shows the landlord of the apartment. Tapping it opens the landlord's public profile with a button to message the landlord about this apartment.

**5.4.8 Lease Agreement Submodule**
This submodule lets tenants view the signed lease uploaded by the landlord (terms and conditions, dos and don'ts and other rules) and confirm they have read it. Replacing the file resets the confirmation.

**5.4.9 Move-In Breakdown Submodule**
This submodule shows the breakdown of the move-in cost: security deposit, advance rent and monthly rent, plus the payment methods the landlord accepts.

**5.4.10 Report Listing Submodule**
This submodule lets a signed-in tenant report a listing (for example scam or wrong information) with a reason, for administrator review.

**5.4.11 Verified Badge Submodule**
This submodule shows trust badges: Verified apartment (approved by an administrator) and Verified landlord (approved ownership documents in APT Passport).

**5.5 Favorites Submodule**
This submodule shows the apartments the tenant saved to view later.

**5.6 Apartment Carousel Submodule**
This submodule shows Netflix-style horizontal rows of apartments grouped by characteristic. A tenant with saved preferences sees a "Recommended for You" row with short reasons (for example Within budget) and rows for each preference; otherwise standard rows such as Top Rated, Verified and New are shown.

**5.7 Search Submodule**
This submodule is a search box to find an apartment by name, city or barangay. Focusing the empty box shows the last five apartments the tenant opened.

**6.0 Profile Module**
This module lets the tenant view their profile and information.

**6.1 Edit Profile Submodule**
This submodule allows the tenant to change the profile picture, background photo and address. Name, verified identity and email are locked.

**6.2 Settings Submodule**
This submodule holds the tenant's preferences and account security.

**6.2.1 Change Email Submodule**
This submodule lets the tenant change their email (email accounts only; Google accounts show it disabled). The tenant confirms the current password, then a 6-digit code is sent to both the old and the new email. The new email is recognized only after both codes are confirmed.

**6.2.2 Language Submodule**
This submodule lets the tenant switch the app between English and Filipino.

**6.2.3 Rental Preferences Submodule**
This submodule lets the tenant update the saved preferences from Personalization (budget, cities, bedrooms, pets, parking, smoking, disabilities).

**6.2.4 Notification Settings Submodule**
This submodule lets the tenant choose which kinds of notifications they receive and, on the web, where the notification button appears.

**6.2.5 Tutorial Replay Submodule**
This submodule replays the first-time tutorial on demand.

**6.2.6 Change Password Submodule**
This submodule lets email-account tenants change their password after confirming the current one (Google accounts show it disabled). Other devices are signed out afterward. Also in Settings: light/dark theme and logout.

**6.3 Verification Status Submodule**
This submodule shows the account status (verified, pending, rejected or unverified) and what the tenant can do in each state. It is also the gateway to apply for verification.

**6.4 APT Passport Submodule**
This submodule lets the tenant compile documents, IDs and other legal papers into a passport used on applications. One document per type; a new copy replaces the old one and resets its review.

**6.5 Logout Submodule**
This submodule logs the tenant out and returns to the sign-in page.

**6.6 Add Role Access Submodule**
This submodule lets a tenant add the landlord role to lease a property.

**6.7 Personal Information Submodule**
This submodule displays the tenant's personal information.

**6.8 Tenant & Landlord Public Profile Submodule**
This submodule lets the tenant view a landlord's profile before applying: verified status, ownership documents, listings and rating summary. Signed-out visitors can see the display information; contact details are for signed-in users.

**6.9 Tenant Ratings from Landlords Submodule**
This submodule shows the ratings and comments the tenant received from past landlords.

**6.10 Landlord Reviews Submodule**
This submodule shows all reviews of a landlord, sorted by most recent, highest or lowest rating, 20 per page, with the stay each review is based on.

**6.11 Report Profile Submodule**
This submodule lets the tenant report a landlord profile for administrator review.

**7.0 About Module**
This module shows information about the APT (A Place to Thrive) website and mobile application, its developers, the build number and the version number.

**8.0 Messaging Module**
This module allows tenants to message landlords.

**8.1 Inquire to Rental Owners Submodule**
This submodule lets tenants message possible rental owners about an apartment, or send a general inquiry from the landlord's profile.

**8.2 Chatting with Landlord Submodule**
This submodule lets tenants message their own landlord about the current apartment, maintenance and other issues.

**8.3 Chatting Interactivity Submodule**
This submodule allows reply, reaction, archive, pin, mute, mark as unread, unsend, GIFs and image paste, improving communication between landlord and tenant.

**8.4 Block and Report User Submodule**
This submodule lets a tenant block a person from messaging them, or report the person for administrator review. Blocking is refused while the two share an active tenancy.

**9.0 Frequently Asked Questions Module**
This module shows frequently asked questions to guide new users.

**10.0 Terms and Conditions Module**
This module shows the dos and don'ts the tenant should follow in using the system.

**11.0 Privacy Policy Module**
This module shows how the system protects and uses the tenant's information.

**12.0 Notifications Module**
This module shows recent updates for the tenant portal, including a push notification and an unread count. Messages from the same sender are grouped, and opening one goes to that conversation.

**12.1 Email Notifications Submodule**
This submodule emails the tenant about rent due and overdue, payments, verification results, application decisions and maintenance updates, following the tenant's notification settings.

**13.0 App Update Module (Mobile)**
This module tells Android users when a newer version exists, and blocks the app with an "Update required" screen when the installed version is below the minimum. Small fixes arrive as over-the-air updates with a restart prompt.

**14.0 Public Website Module (Web)**
This module covers the pages visitors see without signing in: landing page, public apartment browsing, For Owners, About, FAQ, download, and legal pages.

---

### II. Landlord Modules (Front-End)

The front-end software pertains to the interface rental owners interact with upon launching the web and mobile application.

**1.0 Account Module**
This module handles the landlord's account creation and access to the application.

**1.1 Registration Submodule**
If the landlord does not have an account yet, this module will appear. It allows the landlord to create an account with email or Google sign-up by submitting the necessary personal information. The two policy checkboxes (Terms and Privacy) are required.

**1.1.1 Verify Account Submodule**
After registration, the landlord submits the front and back photo of a valid Philippine ID (driver's license, PhilSys, passport, UMID, PRC, SSS, voter's, postal, senior citizen, PWD; or company, school, TIN as secondary). This confirms the legitimacy of the landlord and the property being rented.

**1.1.1.1 Live Selfie Verification Submodule**
This submodule requires a live selfie with the valid ID beside the face to confirm the ID belongs to the landlord.

**1.1.2 Registration Policy Acceptance Submodule**
Same as the tenant policy acceptance: the policies open in a reader, reading does not count as accepting, and the accepted version is recorded.

**1.2 Login Submodule**
If the landlord is not logged in, this module will appear, with an email and password field and Google sign-in. Repeated wrong attempts trigger a temporary lock with a countdown.

**1.2.1 Forgot Password Submodule**
This submodule resets the password by email: a 6-digit code is emailed, the user enters it and sets a new password.

**1.3 Finish Profile Submodule**
A landlord who signed in with Google for the first time, or stopped sign-up midway, completes the profile here instead of being locked out.

**1.4 Account Suspension Notice Submodule**
Shows that the account is suspended, the reason and, for a temporary suspension, the end date.

**1.5 Verification Required Gate Submodule**
Until the landlord account is verified, listings, applications, visits, payments, finance records and landlord chat are closed and a "verification required" screen explains how to continue. Payments and maintenance of a running tenancy stay available. Listings of an unverified landlord are not public.

**2.0 About Module**
This module shows information about the APT website and mobile application, along with its developers.

**3.0 Property Management Module**
This module handles posting properties, visit requests, managing properties and managing tenants.

**3.1 Add Property Submodule**
This submodule allows the landlord to post a new available property that tenants can see and apply to.

**3.1.1 Fill-Up Renting Form Submodule**
Before posting, the landlord fills up the renting form so the post has the necessary details. Addresses are limited to the CAMANAVA area.

**3.1.2 Submit Property Photos Submodule**
The landlord uploads photos of the property and chooses the cover photo.

**3.1.2.1 Property Description Submodule**
The landlord writes a description (up to 2,000 characters) of the property, its amenities and rules.

**3.1.3 Map Pin Location Submodule**
This allows landlords to drop a pin on Google Maps. The pin must fall inside the selected city.

**3.1.4 Monthly Rent Submodule**
This allows the landlord to enter the monthly rent, the security deposit (none, 1 or 2 months) and the advance rent (none or 1 month).

**3.1.5 Amenities Submodule**
This allows the landlord to pick the amenities. Conflicting choices (for example No Cooking and Kitchen) switch each other off.

**3.2 Handle Property Visit Request Submodule**
This submodule lets landlords see visit requests, then approve, reject with a reason, or reschedule, to manage their schedule.

**3.3 Individual Property Submodule**
This submodule lets landlords manage each property.

**3.3.1 Payment Monitoring Submodule**
This submodule shows the history and tracks the monthly payments of the tenant, and alerts the landlord if the tenant is overdue.

**3.3.2 Edit and Remove Property Submodule**
The landlord can edit property information and delete a property. A property with an active tenancy cannot be deleted until the tenancy ends.

**3.3.3 Review and Ratings Submodule**
Landlords can view the reviews and ratings that past and current tenants posted.

**3.3.4 Rate Tenant Submodule**
This submodule allows the landlord to rate a tenant from 1 to 5 stars with an optional comment (up to 1,000 characters) once the tenant's lease has ended. One review per lease; it can be edited later.

**3.3.5 Signed Lease Submodule**
This submodule allows the landlord to upload the lease agreement signed by both parties (PDF or image, up to 10 MB) and see whether the tenant has confirmed it.

**3.3.6 Rental Renewal Submodule**
This submodule allows the landlord to propose a renewal (new dates, rent that stays the same or decreases, deposit and advance terms) and revise it after the tenant discusses it in chat. The renewal is final only when the tenant accepts.

**3.3.7 Listing Visibility Submodule**
This submodule lets the landlord switch a listing between Available and Under Maintenance, which hides or shows it to tenants. It is not allowed while the unit is occupied.

**3.3.8 Request Listing Review Submodule**
If an administrator hides a listing, the property page shows the reason and a Request Review button. The administrator then restores the listing or keeps it hidden with an explanation.

**3.3.9 End Tenancy Submodule**
This submodule lets the landlord end an active tenancy once all pending maintenance fees are settled or waived. Ending it makes the property available again and opens the tenant rating.

**3.4 View Rental Application Submodule**
This submodule shows the rental applications for the property, with the applicant's declared pets, parking and smoking details and a preview of the ratings other landlords gave the applicant.

**3.4.1 View Legal Documents Submodule**
Landlords can view the legal documents the tenant submitted with the application: the ID's front and back and the Passport documents.

**3.4.2 Accept/Reject Application Submodule**
The landlord accepts or rejects the application. A rejection needs a reason, and the tenant is notified in the app and by email.

**3.5 Manage Maintenance Request Submodule**
This submodule lets landlords manage and respond to tenants' maintenance requests with status and resolution notes.

**3.5.1 Maintenance Fee Submodule**
When resolving a request the landlord may add a fee, saved together with the resolution. The fee is added to the tenant's bill and the landlord can waive it while it is pending.

**3.6 Payments Submodule**
This submodule lists all recent payments across the landlord's units with status and overdue tenants. The landlord confirms or declines cash payments and can save a receipt to Photos.

**4.0 Profile Module**
This module lets landlords view their profile and information.

**4.1 Edit Profile Submodule**
Allows the landlord to change the profile picture, background photo and address.

**4.2 Settings Submodule**
This submodule holds preferences and account security for the landlord.

**4.2.1 Payment Methods Submodule**
The landlord chooses which methods tenants can use for rent (GCash, Maya, QR Ph, bank transfer, card, cash). At least one must stay on; turning one off does not affect existing payments.

**4.2.2 Change Email Submodule**
Same flow as the tenant: current password, then a 6-digit code to both the old and new email (email accounts only).

**4.2.3 Change Password Submodule**
Email-account landlords change their password after confirming the current one; Google accounts show it disabled.

**4.2.4 Language Submodule**
Switch between English and Filipino.

**4.2.5 Notification Settings Submodule**
Choose which notification types to receive. Light/dark theme and logout are also in Settings.

**4.2.6 Tutorial Replay Submodule**
Replay the first-time tutorial on demand.

**4.3 Verification Status Submodule**
Shows the landlord's account status (verified, pending, rejected, unverified) and what each allows; also the gateway to apply for verification.

**4.4 APT Passport Submodule**
The landlord compiles ownership documents, IDs and other papers to prove legitimacy. An administrator-approved, unexpired ownership document earns the Verified Landlord badge on the landlord's profile and listings.

**4.5 Logout Submodule**
Logs the landlord out and returns to the sign-in page.

**4.6 Add Role Access Submodule**
Lets a landlord add the tenant role to rent a property.

**4.7 Personal Information Submodule**
Displays the landlord's personal information.

**4.8 Tenant & Landlord Public Profile Submodule**
Lets the landlord view a tenant's profile, verified documents and past ratings before approving an application. A tenant profile is visible only if the tenant applied to or rented one of the landlord's properties.

**4.9 Report Profile Submodule**
Lets the landlord report a tenant profile or a chat partner for administrator review.

**5.0 Profit Analytics Module**
This module shows collected rent and expenses for a chosen month and property, so the owner can see the financial result of the rental. Collected revenue is never relabeled as profit; profit is shown only after the month's expenses are reviewed.

**5.1 Profit Budgeting Submodule**
Lets the landlord set spending limits and reserve plans by category and compare budget with actual spending.

**5.2 Expense Tracking Submodule**
Lets the landlord record, edit and review expenses per property and month, and export the loaded rows to CSV.

**5.3 Property Performance Submodule**
Shows how each property performs and where money is spent by category.

**6.0 Tutorial Module**
After the first login, this module guides new users step by step.

**7.0 Onboarding Module**
Upon first opening the application, a four (4) slide welcome screen shows the app's functions.

**8.0 Messaging Module**
This module allows landlords to message tenants.

**8.1 Chatting with Tenants Submodule**
Communication with current tenants inside the app.

**8.2 Chatting with Possible Tenants Submodule**
Communication with people who inquire about a listed apartment.

**8.3 Chatting Interactivity Submodule**
Reply, reaction, archive, pin, mute, mark as unread, block, report, unsend, GIFs and image paste.

**9.0 Notifications Module**
Shows recent updates for the landlord portal, including push notifications and an unread count.

**9.1 Email Notifications Submodule**
Emails the landlord about new applications, overdue rent, cash to confirm, verification results and maintenance requests.

**10.0 Frequently Asked Questions Module**
Frequently asked questions to guide new users.

**11.0 Terms and Conditions Module**
The dos and don'ts the landlord should follow in using the system.

**12.0 Privacy Policy Module**
How the system protects and uses the landlord's information.

**13.0 Dashboard Module**
Shows graphs and data that help the landlord assess and manage properties.

**14.0 App Update Module (Mobile)**
Prompts Android users to update, and blocks the app below the minimum supported version.

---

### III. Administrator Modules (Web Admin Portal)

The Web Admin Portal allows authorized administrators to manage users, verify identities and listings, review reports and monitor system activity through the website. It is not available on the mobile application.

**1.0 Account Module**
Handles administrator access and security.

**1.1 Admin Login Submodule**
Authentication through a Google account or email, followed by two-step login with a third-party authenticator app.

**1.2 Add Admin Users Submodule**
Authorized administrators can add or remove other admins. Each change needs a second step with an authenticator code from the last 5 minutes, cannot target one's own account, and is recorded in the activity log.

**1.3 Admin Profile and Security Submodule**
The admin views their profile and manages the authenticator devices and backup codes used for two-step login.

**2.0 User Management Module**
Centralizes control over tenant and rental owner accounts.

**2.1 View Tenants List Submodule**
A database-style list of all registered tenants.

**2.2 View Landlords List Submodule**
A list of all registered rental owners.

**2.3 View and Suspend User Submodule**
Admins can suspend an account when a report needs action: permanently or for 7, 30 or 90 days, with a reason. The person is notified in the app and by email, and a temporary suspension lifts itself when it ends. Admins can also reactivate.

**2.4 View User Information Submodule**
Shows the user's personal information and relevant activity.

**2.5 Manage Admin Access Submodule**
From a user's account page an admin can grant or remove the admin role under the rules in 1.2.

**3.0 Listing and Apartment Module**
Controls property listings to protect against spam, scams and rule-breaking content.

**3.1 View and Hide Listing Submodule**
Admins view listings and can hide one from tenant search, with a reason, when it is reported or found inappropriate or fraudulent. Hidden listings are not deleted; the landlord is notified and can request a review.

**4.0 Analytics Module**
Collects system statistics for insights: growth, usage patterns and potential issues.

**5.0 Verification Module**
Validates user credentials and prevents fake accounts.

**5.1 Verify Landlord User Submodule**
Checks the valid ID (front and back), the live selfie with ID and other documents before a landlord can post listings.

**5.2 Verify Tenant User Submodule**
Checks the same items before a tenant can apply, visit, message or pay.

**5.3 Verify Apartments Submodule**
Approve or reject the Verified tag on a listing; approved listings show a trust badge.

**5.4 Verify Documents Submodule**
Verify documents in a user's APT Passport; approved ownership documents give landlords the Verified Landlord badge.

**6.0 Activity Module**
A log of all admin activity for history checking.

**7.0 Report Module**
Shows reports about apartments, tenants, landlords and chat users, open ones first. For each report the admin chooses an action: warn, hide the listing or suspend the account. The reporter gets a generic "report reviewed" notice and never learns the outcome.

**7.1 Listing Review Requests Submodule**
Handles landlords' requests to review a hidden listing: restore it, or keep it hidden with a reply by notification and email.

**8.0 App Updates Module**
Lets admins publish the latest version and the minimum required version of the Android app with an https download link and release notes. The link is checked, and every change is kept in a release history.

**9.0 Notifications Module**
Shows recent updates for the administrator portal.

**10.0 Dashboard Module**
The admin landing page, with key counts and trends for users, listings, verification queues and reports.
