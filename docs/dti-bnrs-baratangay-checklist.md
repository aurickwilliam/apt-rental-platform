# DTI BNRS Barangay Checklist — GCash eWallet for APT (CAMANAVA)

**Goal:** Get DTI Sole Proprietorship (Barangay scope) so PayMongo `gcash_ewallet` onboarding at `dashboard.paymongo.com/onboarding-channel/gcash_ewallet` → Business Type **Sole proprietorship** can be approved. Your QR Ph link `2f5XGIp` (₱100, `livemode:true`) already works without this — QR Ph is GCash-compatible — use it for rent while DTI is pending.

**Status:** Not started — use for GCash direct (redirect) upgrade. PayMongo banner: `Payment method requests are processed within 3-9 business days`.

## 1. Which type to pick (your screenshot)

- **Pick: Sole proprietorship** — "You are the sole owner ... registered with the DTI" — correct for individual landlord (APT). Requires DTI certificate.
- Do NOT pick Partnership / Corporation / One Person Corporation — those require SEC docs (Articles, By-laws), weeks longer.

Without DTI, any selection on that screen will be rejected at step 2 upload. Get DTI first.

## 2. Barangay scope — why

DTI scopes control where your trade name is protected:

- `Barangay` ₱300, `City/Municipality` ₱1,000, `Regional` ₱2,000, `National` ₱2,000+ (fees from BNRS, valid 5 years, +₱30 documentary stamp).
- For APT focused on CAMANAVA (Caloocan-Malabon-Navotas-Valenzuela), **Barangay** is cheapest/fastest and sufficient for PayMongo KYC. Upgrade to City/National later if you expand branding.

Choose Barangay = your exact barangay where business address is (e.g., Navotas, Caloocan Brgy). Must match valid ID/address proof.

## 3. Requirements before BNRS

- Valid PH gov ID (UMID, Passport, Driver's License, PhilID/National ID)
- TIN (optional at BNRS but PayMongo may ask later — have it)
- Business name: 3 options prepared (e.g., `APT - A Place to Thrive`, `APT Rental Services`, `YourName Rentals`). BNRS rejects duplicates/confusing names — check via search first.
- Business address: exact barangay + city (CAMANAVA) + zip (use `@repo/hooks` PH postal validation)
- Owner details: full name, birthdate, civil status, contact, email
- Payment method: GCash / Maya / card for DTI fee

No DTI → no NPC, no BIR needed first — BNRS is standalone.

## 4. BNRS Step-by-Step (bnrs.dti.gov.ph)

1. Go to `https://bnrs.dti.gov.ph/registration` → Register account (email verify)
2. **Search BN:** Type desired name → Check territorial availability → pick `Barangay` → select Region NCR → City (e.g., Navotas) → Barangay → Continue
3. **Business Details:** Scope confirms `Barangay`, enter exact address, business area (Rental / Real Estate Leasing), capital, start date
4. **Owner Details:** Fill owner info as on ID, upload ID if prompted
5. **Review & Pay:** Confirm summary → Pay via link (GCash/Maya) → Save reference number
6. **Download:** After payment, `Transactions` → `Download Certificate` (PDF with BN, Registration No., Date, Validity 5 years, DTI seal + QR). Timeline: often **same day to 1-2 business days** if name cleared; if pending review, check email for BNRS updates.

Save PDF as `DTI_Certificate_APT_Barangay_2026.pdf` — do not commit to repo (`.gitignore` covers `.env` but not PDFs — keep private).

## 5. BIR Certificate of Registration (Form 2303) — required beside DTI

Yes — PayMongo requires **both** for Sole Proprietorship per `docs.paymongo.com/docs/account-settings-philippine-entities`:
> 1. DTI Certificate 2. Government ID 3. **BIR Certificate of Registration (Form 2303)**

Same for GCash Biz table: `Sole Proprietorship | DTI + BIR 2303 + Valid ID + 3 specimen signatures`.

### What it is
BIR Form 2303 = COR proving your Sole Prop is registered with BIR RDO where your business address (CAMANAVA barangay) sits. Must show Trade Name (matches DTI), TIN, Address, Tax Types (Percentage/Income, Registration Fee 0605).

### Steps (after DTI, before PayMongo)
1. Prepare: DTI Certificate (PDF), Valid ID, Proof of address (lease/Brgy cert), TIN. If no TIN, BIR issues one during 1901 filing.
2. Go to your **RDO** (Revenue District Office) for your barangay — walk-in is fastest (ORUS online `https://orus.bir.gov.ph` exists but slower). For CAMANAVA: Navotas/Caloocan/Malabon/Valenzuela each has its own RDO — check `https://bir.gov.ph` RDO finder with your exact barangay zip.
3. File **BIR Form 1901** (Application for Registration — Sole Proprietor) + 0605 payment (₱0 since 2024 annual fee removed, but COR still issued) + Documentary Stamp Tax. Submit at New Business Registrant Counter.
4. Pay: No annual ₱500 since Ease of Paying Taxes Act, but pay DST on COR. Bring payment via GCash/eFPS if asked.
5. Receive: **BIR 2303** printed + **Authority to Print (ATP)** / ask about Invoicing (Sales Invoice/Official Receipt) — you must issue a BIR-registered invoice for rent (QR Ph receipt alone is not a BIR invoice per `paymongo.com/blog/how-to-get-qr-ph-code`).
6. Timeline: **Walk-in: 1-3 business days** if docs complete + RDO not queued; **ORUS: 3-7 business days** plus courier. Much quicker than SEC.

Keep original COR private (`BIR_2303_APT_2026.pdf`).

## 6. After DTI + BIR — PayMongo GCash onboarding (3-9 business days)

1. PayMongo Dashboard (Live mode) → `Payment Methods` → `GCash eWallet` → `Activate` → `dashboard.paymongo.com/onboarding-channel/gcash_ewallet` step 1
2. Select **Sole proprietorship** → `Next`
3. Step 2 `Business Information`: Upload **DTI Certificate + BIR 2303** (both PDFs), Valid ID (front/back), Selfie with ID, Proof of Address, Bank/GCash payout info
4. Step 3 `Confirmation`: Submit → Email `support@paymongo.com` if stuck. Live GCash will show `Pending` then `Active` in 3-9 business days.

## 7. Interim — keep using QR Ph (no DTI/BIR needed)

- Your live link `https://pm.link/org-TuSWCTBaZ5mDp1echV2XAfwv/2f5XGIp` (`ref 2f5XGIp`, ₱100, `status: unpaid` verified 2026-08-24) accepts GCash via QR scan — tenant opens GCash → Scan QR → pays → `paymongo_get_link` flips to `paid`.
- For new rents, create links via `.opencode/opencode.json:19-26` paymongo MCP: `create_link amount <centavos> description "Rent - [Unit] - Month"` (B1: `PAYMONGO_SECRET_KEY=sk_live_...` + `PAYMONGO_ALLOW_LIVE=true` only during window, see `AGENTS.md:106`).

## 8. FAQ

- **How quick is DTI?** BNRS payment → cert often minutes-hours; worst 2 days if name flagged.
- **How quick is BIR 2303?** After DTI, walk-in RDO **1-3 days** (if complete), ORUS **3-7 days**. So DTI+ BIR total ~3-5 days walk-in, before PayMongo 3-9 days. Overall **~1.5-2 weeks** to GCash active.
- **Can I skip BIR and use QR Ph only?** Yes — your `2f5XGIp` QR Ph is live without DTI/BIR and accepts GCash scans (QR Ph is GCash-compatible). Use it for rent now; DTI+ BIR only needed for GCash direct redirect.
- **Will PayMongo reject Barangay scope?** No — PayMongo accepts Barangay DTI for sole proprietor; scope only affects DTI name protection.
- **Renewal?** DTI 5 years; BIR COR no renewal unless details change (update via 1905).
- **Cost if I pick City instead?** ₱1,000 vs ₱300 — same docs, wider protection. Pick Barangay now to save.

## 9. Verification

```bash
# DTI cert exists (private, not committed)
ls ~/Documents/DTI_Certificate*.pdf

# PayMongo GCash active
# Dashboard → Payment Methods → GCash → Active (green)
# + create_link now shows GCash option alongside QR Ph
```

**Owner actions only you can do:** DTI payment (personal ID), PayMongo uploads (selfie/bank). Do not paste DTI cert or `sk_live_...` in repo/issue.
