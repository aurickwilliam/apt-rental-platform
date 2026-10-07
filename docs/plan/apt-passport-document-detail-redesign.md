# APT Passport — Document Detail Redesign Plan

Status: Proposed (2026-10-06)
Scope: Mobile document detail only (`apps/mobile/app/document-id/[documentId].tsx`)
Goal: Make the file/image preview the visual focus, then show upload date and expiry date, status, delete, and request-verify actions in one clear scroll.

Non-goals:
- No database or RLS change.
- No new dependency.
- No change to upload flow, list screen, or admin review.

## 1. Current state (verified)

- Detail route: `apps/mobile/app/document-id/[documentId].tsx` (`PassportDocumentDetail()`).
  - Loads wallet via `usePassportDocuments()` (`hooks/passport/usePassport.ts` → `fetchPassportDocumentsWithVerification()`).
  - Resolves private signed URLs via `useDocumentUrls()` (bucket `application-documents`, or `user-verification` for linked IDs).
  - Preview via local `components/DocumentPreview.tsx` (image inline + `Linking.openURL` fallback; non-image file card).
  - Full-screen image viewer via `react-native-image-viewing`.
  - Dates: `Uploaded` (`created_at`) + `Expires` (`expires_at` or "No expiry"), expiry via `service/passport/expiry.ts:isExpiredDate()`.
  - Status: Verified (`success`) / Under review (`warning`) chips + rejection-reason and expired banners.
  - Footer actions: Request Verification (`useRequestPassportDocumentReview()`) + Delete (`useDeletePassportDocument()` + `ConfirmDialog`), hidden for linked primary IDs and under-review docs.
  - Tests: `app/document-id/detail.test.tsx` (icon, linked-ID copy, pending banner).
- Related reuse:
  - `components/display/PdfThumbnail.tsx` (first-page PDF preview with icon fallback).
  - `app/document-id/utils/fileType.ts` (`isPreviewable()`, `isPdfDocument()` — MIME type wins over URL sniffing).
  - `components/display/ConfirmDialog.tsx`, `components/display/ErrorDialog.tsx`.
  - `components/layout/ScreenWrapper.tsx` (scrollable + safe-area footer), `components/layout/StandardHeader.tsx`.
  - Status styles: `hooks/useStatusChipStyles.ts` + `statusChipSurface()`.
  - Eligibility: `isReviewEligibleDocType()` in `packages/constants/src/apartment/document-types.ts`.
- Note: `DocumentPreview.tsx` and `[documentId].tsx` have uncommitted local changes; apply this plan on top of their latest version.

## 2. Target layout

```text
┌─────────────────────────────────────┐
│ ‹  {doc_type}                       │  StandardHeader
├─────────────────────────────────────┤
│ [icon]  {doc_type}                  │  title row + status chip
│         [Unverified|Under review|   │
│          Verified|Rejected]          │
│ Short description                   │
│                                     │
│ DOCUMENT PREVIEW                    │
│ ┌─────────────────────────────────┐ │
│ │ image (4:3 contain)             │ │  images inline, tap → lightbox
│ │ — or —                          │ │
│ │ PDF first page (PdfThumbnail)   │ │  PDFs inline, tap → full doc
│ │ — or —                          │ │
│ │ file card: EXT · Tap to open    │ │  doc/docx/xls/etc fallback
│ └─────────────────────────────────┘ │
│ [Front]                             │  label only when back exists
│ [preview]                           │
│ [Back]                              │
│ [preview]                           │
│                                     │
│ DETAILS                             │
│ Uploaded              Oct 3, 2026   │
│ Expiry date           No expiry     │  explicit "Expired" label when past
│                                     │
│ [status banner / rejection reason]  │  adjacent to status, not footer-only
├─────────────────────────────────────┤
│ [Request Verification]  (primary)   │  safe-area footer
│ [Delete Document]  (danger-soft)    │
└─────────────────────────────────────┘
```

Design tokens (DESIGN.md + design-tokens.json):
- Cards: `bg-surface border border-border rounded-2xl/3xl shadow-none`, inner padding `p-4`, gaps `gap-3/4`, screen `p-5`.
- Titles: `text-foreground text-lg font-nunitoSemiBold`; labels `text-muted text-sm font-nunitoSemiBold`; body `text-muted text-sm font-inter`.
- Status chips: HeroUI Native `Chip variant="soft"` + `useStatusChipStyles` (success/warning/danger/neutral); never color alone — always icon + text.
- Buttons: primary Request Verification; `danger-soft` Delete; `ghost` icon-only viewer/flip controls; `isDisabled` + `isPending` states.
- Touch targets `h-12+`, visible focus, `accessibilityLabel` on preview open, viewer, delete, and verify actions.

## 3. Implementation steps

1. **Preview block (extend `DocumentPreview.tsx`, do not fork).**
   - Props stay: `docType, storagePath, signedUrl, loading, onPress` + pass `mimeType`.
   - Image: `expo-image` (`contentFit="contain"`, `aspectRatio 4/3`, `cachePolicy="disk"`, `transition 150`), spinner while `loading || !signedUrl`, "Preview unavailable" when unresolvable.
   - PDF: reuse `PdfThumbnail` for first-page inline preview; keep its icon fallback when native PDF is unavailable (Expo Go / unlinked module).
   - Other files: file card (`IconFileText`, `EXT · Tap to open`, chevron) → `Linking.openURL(signedUrl)`.
   - File-type detection: `isPreviewable(mimeType, storagePath)` then `isPdfDocument(mimeType, storagePath)`; use `storagePath` + `mime_type`, not the signed URL extension.
   - Full view: images → existing `ImageViewing` lightbox; PDFs/other → `Linking.openURL`.
2. **Front/back grouping.**
   - Keep `Front`/`Back` section labels only when `storage_path_back` exists.
   - Keep back-flip control pattern from `ValidIdCard.tsx` where applicable (flip button as sibling of viewer trigger, never nested).
3. **Dates block.**
   - Two `DetailRow`s: `Uploaded` = `formatDate(created_at, "medium")`; `Expiry date` = `formatDate(expires_at + "T00:00:00", "medium")` or "No expiry".
   - Expired: `isDanger` + explicit "Expired document — Upload a current copy before requesting verification." banner (keep current copy).
4. **Status block.**
   - Render all four states: Unverified (neutral), Under review (warning + "Under admin review — We'll notify you…"), Verified (success), Rejected (danger + `rejection_reason`).
   - Keep banners adjacent to the chip, above the preview.
5. **Footer actions (`ScreenWrapper footer`).**
   - Primary `Request Verification` only when `canRequestReview` (eligible type, `unverified|rejected`, not linked, not pending, not verified); label switches to "Request Review Again" after rejection; `isRequesting` → "Requesting…".
   - `Delete Document` (`danger-soft` + `IconTrash`) opens `ConfirmDialog`; keep service guards (linked primary, pending review, active-application reference).
   - Expired docs: disable verify with inline explanation instead of a post-press error.
   - Preserve `requestError` inline text, `isDeleting` state, and `ErrorDialog` fallback.
6. **Loading / empty / error.**
   - Keep skeleton/spinner for `loading || urlLoading`; keep "Document not found" + Back to Documents; keep pull-to-refresh behavior from list screen conventions.
7. **Tests (extend `detail.test.tsx`).**
   - Preview: image inline, PDF thumbnail, fallback card, missing signed URL, front/back labels.
   - Dates: formatted uploaded, "No expiry", expired styling + banner.
   - Status: all four chips, rejection reason, pending banner, no duplicate linked-ID copy.
   - Actions: eligible shows verify; pending/verified/linked hide it; rejected shows "Request Review Again"; delete hidden while under review; confirm dialog + mutation error paths.
   - A11y/theme: labels on open/verify/delete, dark mode tokens, small-screen scroll with footer visible.

## 4. Files to touch (mobile only)

- `apps/mobile/app/document-id/[documentId].tsx` — reorder into header / preview / dates / status / footer; no logic change to hooks/services.
- `apps/mobile/app/document-id/components/DocumentPreview.tsx` — add `mimeType` prop + PDF branch via `PdfThumbnail`.
- `apps/mobile/app/document-id/detail.test.tsx` — cover states above.
- No migration, no Edge Function, no web change.

## 5. Acceptance criteria

- [ ] File/image preview is visible without scrolling past actions on a standard phone.
- [ ] Image, PDF, and other files each have a correct inline preview + working open action.
- [ ] Upload date and expiry date (or "No expiry") are shown; expired shows an explicit label.
- [ ] All four statuses render with icon + text; rejection reason shows when present.
- [ ] Request Verification and Delete appear in the footer with correct eligibility, confirm, loading, and error states.
- [ ] `pnpm --filter mobile lint` and focused `jest detail.test` pass; dark mode + small screen verified.
