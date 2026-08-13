# Mobile Account Verification — Backend Cons (Deferred Work)

Companion to the UI-fix plan. Captures the backend/flow cons identified during the
verification-flow audit (2026-08). The UI fixes are done; this document lists the
backend work to be implemented later.

Related: `docs/AUDIT_REPORT.md` (architecture/performance audit).

---

## Backend Cons

### B1. Mobile number is never verified (no SMS OTP)

- `complete-profile.tsx` and `verify-mobile.tsx` collect a PH mobile number, but
  signup is verified by **email OTP only**. No SMS OTP step exists, and
  `supabase/config.toml` has no phone/SMS provider configured.
- **Why it matters:** For the PH market, phone is the primary identity. Unverified
  numbers enable fake accounts and are useless for recovery/contact.
- **Recommended fix:** Enable Supabase phone auth with an SMS provider (Twilio,
  Sinch, Vonage, or a PH aggregator). Send SMS OTP to the mobile number during
  signup as the primary channel; keep email OTP as fallback. Consider phone as a
  login identifier.

### B2. KYC flow (`verify-account/`) is UI-only — nothing is submitted

- `upload-id.tsx` keeps front/back images in local state (now a zustand store —
  see `stores/useVerificationStore.ts`); nothing is uploaded to Storage, no DB
  record, no verification service call.
- `upload-selfie.tsx` shows a **sample image**; `expo-camera` is not installed —
  no actual selfie capture.
- `success.tsx` promises "Our team will review your ID" but there is no review
  queue, no status column, and no notification path.
- **Recommended fix:** Either (a) integrate a regulated KYC provider with PH
  coverage (VerifyMe Philippines — official PhilSys eVerify partner, Onfido,
  IDfy) for automated document + liveness + face match, or (b) manual review:
  upload to a private Supabase Storage bucket (store paths, sign on read),
  a `verifications` table (`user_id`, `status`, `reject_reason`, timestamps),
  and an admin review queue.

### B3. No verification persistence layer

- No `verifications` table/migration exists in the repo; no status column on
  `public.users`. `VerificationStatus.tsx` already models the four states
  (`unverified | pending | verified | rejected`) but has no data to read.
- **Recommended fix:** Add `verifications` table with the four-state lifecycle,
  RLS keyed off `public.users.id` (per repo convention), and a
  `verification_status` view/column on `public.users`.

### B4. Forgot-password OTP flow is a stub

- `forgot-password/otp-verification.tsx` uses hardcoded `mobileNum = "1234567890"`
  and `email = "johndoe@gmail.com"`; `handleResend` sends nothing and
  `handleVerify` only navigates to `reset-password.tsx` without calling
  Supabase. This is a live security hole — password reset is not functional.
- **Recommended fix:** Real flow: look up the user, send OTP via the chosen
  method (email → Supabase `recover` OTP / SMS once B1 lands), verify the token
  before showing the reset form, then `updateUser({ password })`. Use
  `type: 'recovery'` semantics. Add the same attempt-limit + resend-cooldown UI
  patterns now present in the signup OTP screen.

### B5. Orphan `signUp` in `verify-mobile.tsx`

- `verify-mobile.tsx` performs its own `supabase.auth.signUp(...)` (line ~53),
  duplicating the signup in `complete-profile.tsx` (~line 259). The screen is
  only reachable from the dev playground.
- **Recommended fix:** Delete `verify-mobile.tsx` or repurpose it as the SMS OTP
  step once B1 lands (number input → SMS OTP → continue to email OTP / profile).

### B6. No verification gating or tiering

- Nothing enforces *when* verification is required and no progressive tiers
  (phone → email → ID) exist.
- **Recommended fix:** Tiered verification: email (signup), phone (SMS OTP),
  ID (KYC). Gate high-value tenant actions (applying to rent, viewing landlord
  contact details) on verification status; surface the pending/rejected states
  from the profile screen (already modeled in `VerificationStatus.tsx`).

### B7. No rate limiting / attempt throttling on OTP endpoints

- Client-side attempt limits were added to the signup OTP screen (max 5), but
  there is no server-side enforcement (GoTrue defaults + Supabase rate limits
  only). Resend throttling is client-side only.
- **Recommended fix:** Rely on/enforce Supabase auth rate limits and consider a
  server-side cooldown per email/phone; confirm GoTrue `sms`/`email` rate limit
  settings in `supabase/config.toml` when phone auth is enabled (B1).

### B8. KYC documents — PII handling

- When document upload lands (B2), PII (government IDs, selfies) must be stored
  in a **private** bucket with signed-URL reads, short-lived access, and a
  deletion/retention policy. Never store public URLs (AGENTS.md Supabase
  Conventions).

---

## Suggested implementation order

1. **B4** — Real forgot-password flow (security hole, unblocks password recovery)
2. **B1** — Phone/SMS OTP as primary verification channel
3. **B3 + B2** — Verification table + pick provider (automated KYC vs manual review)
4. **B5, B6, B7, B8** — Cleanup, gating, throttling, PII handling
