# Identity Verification — Recommended Provider (Future Work)

Companion to `docs/verification-backend-cons.md` (B2: "KYC flow is UI-only — nothing is
submitted"). This document captures the recommended third-party verification path for the
tenant ID verification flow (`apps/mobile/app/(auth)/verify-account/`). The current flow is
**UI-first**: it captures document photos and a selfie locally (zustand store, `file://` URIs)
and never performs a real identity check.

Related: `docs/verification-backend-cons.md`, `DESIGN.md`.

---

## What the current capture flow actually verifies

- **Frame Quality Check** (`hooks/verification/useFrameQualityCheck.ts`) is a *capture-quality
  gate*, not document verification — EXIF-based blur/glare proxies + geometric fill ratio only.
- Nothing inspects the ID itself: no authenticity check, no OCR, no face-matching, no liveness.
- No submission layer exists (no Storage upload, no `verifications` table, no review queue).

## Requirements for a real verification provider

- **PH document coverage**: PhilSys/PhilID, LTO Driver's License, Passport, UMID, PRC, SSS,
  Voter's ID, Postal ID, Senior Citizen, PWD, Company/School/TIN IDs.
- Startup-friendly pricing (low initial volume, PH peso exposure).
- DPA (Philippine Data Privacy Act) posture — on-device processing minimizes PII exposure.
- Landlord-trust value: verified tenants reduce application risk.

## Recommended path (3 tiers)

### Tier 1 — MVP: PhilSys eKYC (official) + human review

- **PSA PhilSys eKYC / PhilSys Check** — the official, BSP-recognized verification of the
  PhilID (QR + biometric). Access via PSA B2B partnership or an aggregator such as
  **Mynth.ai** (PH eKYC middleware used by local fintechs).
- Applies to the **National ID only**. All other ID types fall back to **manual review**
  (upload to private Supabase Storage, store paths and sign on read, `verifications` table +
  admin review queue — see `docs/verification-backend-cons.md` B2/B3).
- Cheapest trustworthy start; matches the existing "Our team will review your ID" UX copy.

### Tier 2 — Scale: on-device document scan + liveness + face match

- **Microblink BlinkID** — on-device document scanning: OCR, tamper/MRZ checks, PH coverage
  (incl. PhilID and LTO license). One-time annual SDK license; no per-verification server cost.
- **FaceTec ZoOm** — 3D liveness (anti-photo/video/deepfake spoof), server-verified sessions.
  De-facto standard in PH fintech.
- **Face match** — BlinkID extracts the ID face; compare against the selfie via
  `AWS Rekognition CompareFaces` (cents per call).
- Drops into the existing `live-capture.tsx` capture screens (guide frames + quality sampling
  get replaced by the SDK's own guidance). PII stays on-device (DPA-friendly).

### Tier 3 — Enterprise / regulatory scale

- **Full-service KYC SaaS**: Sumsub, Onfido, Jumio, Veriff — PH doc support, document
  authenticity + liveness + face match in one API call. ~$0.30–$2.00 USD per verification,
  volume-decreasing. Fastest to production, most expensive at scale, PII leaves the device.
- **Self-hosted**: Regula Document Reader + Face SDK — excellent PH coverage, on-prem
  (strongest privacy posture), one-time license (~tens of k$). Justified only at high volume.

## Decision notes

- A rental platform is **not a regulated financial institution** — no BSP eKYC mandate
  applies; manual human review is legally sufficient. These tools reduce review cost and
  improve landlord trust, not compliance exposure.
- Liveness + face-matching the selfie against the ID is the highest-value automated check for
  this use case (prevents stolen-ID submissions); full document authenticity scanning is the
  second increment.
- Passport NFC/ICAO eMRTD chip reading (Regula eMRTD SDK) is possible but overkill for MVP.