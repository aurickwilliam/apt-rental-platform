# Design Document: ID Verification Capture

## Overview

This revision removes the Physical ID / Digital Document format branch from step 2 of the mobile verification flow (`apps/mobile/app/(auth)/verify-account/upload-id.tsx`) and makes camera capture the only way to provide an ID photo. Selecting an ID on step 1 (`select-id.tsx`) now navigates straight into the existing `Live_Capture_Screen` (`live-capture.tsx`) for the first required capture step; step 2 becomes a review/progress screen that tracks which captures are done and which remain, and gates the "Continue to Selfie" control on all of them being present.

The camera capture mechanics — `useCameraPermission`, `useFrameQualityCheck` (EXIF-proxy blur/glare heuristics + geometric fill ratio), `GuidedFrameOverlay`, permission-denied/restricted/error views, auto-capture-once-per-session guard, capture-in-progress guard, and the retake/review step — are unchanged in their internal behavior. What changes is what parameterizes them: instead of a hardcoded `field: 'front' | 'back'` route param and a store shaped around exactly two named slots, both `live-capture.tsx` and `upload-id.tsx` now consult a **Capture_Sequence** — an ordered, per-ID-type list of capture steps — so a one-step ID (Passport) and a two-step ID (every card-style ID) go through the same code path without special-casing either.

This design removes, rather than adapts, the following from the prior implementation: `DocumentFormat`, `documentFormat` (store field), `DocumentFormatSelector`, `applyFormatSwitchClearing()`, the `'image'`/`'file'` variants of `IdCaptureResult`, the digital-document branch of `upload-id.tsx`, and `UploadDocumentField`'s `acceptedFileMimeTypes` prop (reverted from the shared component — see "Shared component impact" below). None of these are preserved merely because they previously existed.

## Architecture

```mermaid
flowchart TD
    A[select-id.tsx: tap an ID] --> B[getCaptureSequence(selectedId)]
    B --> C[live-capture.tsx: first incomplete step]

    C --> C1[Camera permission gate]
    C1 -->|granted| C2[CameraView + Guided_Frame sized to step's aspect ratio]
    C1 -->|denied| C3[PermissionDeniedView]
    C1 -->|restricted| C3b[PermissionRestrictedView]
    C2 --> C4[useFrameQualityCheck sampling loop]
    C4 -->|pass + stable 1s| C5[Auto-capture]
    C2 --> C6[Manual shutter]
    C5 --> C7[Capture review: Retake / Use Photo]
    C6 --> C7
    C7 -->|Use Photo| D[useVerificationStore.setCaptureResult(stepId, result)]

    D --> E[upload-id.tsx: review/progress screen]
    E -->|tap an incomplete or complete step| C
    E -->|all steps captured + confirmed| F[upload-selfie.tsx]
```

### Screen/route structure

- `apps/mobile/app/(auth)/verify-account/select-id.tsx` — **unchanged**. Still renders `VALID_IDS`/`SECONDARY_IDS`, calls `setSelectedId(id)`, and pushes to `upload-id`. No changes to this file are made by this design; step 2 is responsible for immediately forwarding to capture (see below), keeping `select-id.tsx`'s existing behavior/tests intact.
- `apps/mobile/app/(auth)/verify-account/upload-id.tsx` — **redesigned**. On mount, if the Capture_Sequence for `selectedId` has zero completed steps *and* the screen has not already redirected once this mount, it immediately navigates to `live-capture.tsx` for the first step (implementing Requirement 1.1's "immediately open live camera capture" without adding a second screen the tenant has to look at first — see "Why upload-id.tsx still exists as a route" below). Once at least one step is captured, or the tenant navigates back from `live-capture.tsx`, `upload-id.tsx` renders as the review/progress screen: one row per Capture_Step showing its label and completion state, a "Continue to Selfie" button gated on every step being complete, and the existing confirmation checkbox.
- `apps/mobile/app/(auth)/verify-account/live-capture.tsx` — **redesigned route params, same internal mechanics**. Takes `idType` (the Selected_Id_Type) and `stepId` (the specific Capture_Step being captured) via `useLocalSearchParams`, replacing the old `field: 'front' | 'back'` param. Everything else — `useCameraPermission`, `useFrameQualityCheck`, `GuidedFrameOverlay`, the permission/error views, the capture-in-progress and auto-capture-triggered guards, the retake/review sub-state — is unchanged in behavior; only the piece of data identifying "which capture is this" and "what aspect ratio should the guided frame use" changes shape.

### Why `upload-id.tsx` still exists as a route (and isn't skipped entirely)

Requirement 1.1 says selecting an ID "immediately" opens capture — it does not say step 2 disappears. `upload-id.tsx` remains necessary as:
1. The landing point after each capture (`router.back()` from `live-capture.tsx` returns here), so the tenant needs a screen that shows overall progress across a multi-step Capture_Sequence and lets them jump to a specific remaining (or completed, for retake) step.
2. The screen that hosts the confirmation checkbox and the "Continue to Selfie" gate — these are not per-capture-step concerns and have nowhere else to live within the existing four-step `_layout.tsx` stack (`select-id` → `upload-id` → `upload-selfie` → `success`/`failed`, unchanged).

The "immediate" requirement is satisfied by `upload-id.tsx` auto-forwarding to `live-capture.tsx` on first mount for a given `selectedId` (via a `useEffect` keyed on `selectedId` and "has zero captured steps"), so the tenant never has to tap anything on step 2 before seeing the camera — they land on step 2 for a single render frame (or not at all, perceptually, since the redirect fires before paint settles) and are then in the camera. This mirrors the existing `expo-router` navigation pattern already used between `select-id.tsx` and `upload-id.tsx` (`router.push`), rather than introducing a new modal/skip-screen mechanism.

### Shared component impact: reverting `UploadDocumentField`

`UploadDocumentField.tsx` (`apps/mobile/components/inputs/UploadDocumentField.tsx`) is a shared component also used by `apps/mobile/app/document-id/upload.tsx`. The `acceptedFileMimeTypes` prop was added to it specifically to support this feature's now-removed digital-document path (restricting `pickFile()` to PDF-only for this caller). With that caller gone:

- The `acceptedFileMimeTypes` prop, its JSDoc, and the parameter default are removed from `UploadDocumentField.tsx`.
- `pickFile()` reverts to using the component's own `ACCEPTED_FILE_TYPES` constant (PDF + Word doc mime types) unconditionally, exactly as it behaved before this prop was introduced.
- `pickImage()`, the `UploadedDocument` union, the `maxFileSizeMB` check, the BottomSheet-based "Add document" picker UI, and every other part of the component are untouched — this is a scoped reversion of one prop and the branch of logic it controlled, not a rewrite of the component. `document-id/upload.tsx` (the component's only remaining caller) does not pass this prop today and is unaffected by its removal.
- `expo-image-picker` and `expo-document-picker` remain dependencies of the project — they are used independently by `UploadImageField.tsx`, `UploadFileField.tsx`, `UploadDocumentField.tsx` (for `document-id/upload.tsx`), and `chat/[conversationId].tsx`. This design removes this feature's *usage* of the picker path, not the packages themselves.

### `app.json`: `NSPhotoLibraryUsageDescription` stays

Per direct inspection, `ImagePicker.launchImageLibraryAsync` is called independently by `UploadImageField.tsx` (used in `third-process.tsx`, `edit-main.tsx`, `add-apartment/index.tsx`) and by `chat/[conversationId].tsx`'s `handlePickImage`. `NSPhotoLibraryUsageDescription` in `app.json`'s `ios.infoPlist` is therefore required independently of this feature and is **not removed** — it was arguably mis-attributed to this feature in the prior design (the string predates or is independent of this feature's own now-removed picker usage), but it is genuinely needed by other, unrelated features and must stay.

`NSCameraUsageDescription`, the Android `android.permission.CAMERA` entry, and the `expo-camera` config plugin block in `app.json` all remain exactly as they are — camera capture is not only preserved but is now the sole capture mechanism, so this configuration is more necessary than before, not less.

## Components and Interfaces

### Capture-sequence configuration (new)

A new module, `apps/mobile/app/(auth)/verify-account/constants/captureSequences.ts` (route-scoped — this mapping is specific to the verification flow's vocabulary of ID types and capture steps, with no other caller, matching the existing convention of route-local files such as `utils/gating.ts`), defines the Selected_Id_Type → Capture_Sequence mapping:

```typescript
export interface CaptureStepConfig {
  /** Stable identifier for this step, persisted as the key in the store's captures map. */
  id: string;
  /** Tenant-facing label, e.g. "Front", "Back", "Identity Page". */
  label: string;
  /** Guided_Frame aspect ratio (width / height) for this step. */
  aspectRatio: number;
}

export const CARD_ASPECT_RATIO = 3.375 / 2.125; // CR80, unchanged from the prior design
export const PASSPORT_ASPECT_RATIO = 125 / 88; // ICAO TD3 booklet page — confirmed passport identity-page aspect ratio

const CARD_SEQUENCE: CaptureStepConfig[] = [
  { id: 'front', label: 'Front', aspectRatio: CARD_ASPECT_RATIO },
  { id: 'back', label: 'Back', aspectRatio: CARD_ASPECT_RATIO },
];

const PASSPORT_SEQUENCE: CaptureStepConfig[] = [
  { id: 'identity-page', label: 'Identity Page', aspectRatio: PASSPORT_ASPECT_RATIO },
];

const SEQUENCE_BY_ID_TYPE: Record<string, CaptureStepConfig[]> = {
  Passport: PASSPORT_SEQUENCE,
  // All other VALID_IDS/SECONDARY_IDS entries fall back to CARD_SEQUENCE below.
};

/**
 * Returns the ordered Capture_Sequence for a Selected_Id_Type. Falls back to
 * the standard two-step card sequence for any ID type not explicitly listed
 * (i.e. every current VALID_IDS/SECONDARY_IDS entry except Passport) — this
 * mapping (Passport = single identity-page step; all other current ID types
 * = standard front/back CR80 sequence) is a confirmed product decision, per
 * requirements.md's Resolved Product Decisions.
 */
export function getCaptureSequence(idType: string | null): CaptureStepConfig[] {
  if (idType == null) return [];
  return SEQUENCE_BY_ID_TYPE[idType] ?? CARD_SEQUENCE;
}
```

This is the "generic mechanism for which capture step is next" called for by the product pivot: neither `live-capture.tsx` nor `upload-id.tsx` hardcode `front`/`back` anywhere — both call `getCaptureSequence(selectedId)` and operate over whatever length list it returns. Adding a new ID-specific sequence (e.g. if Passport turns out to need two captures, or a future ID type needs three) is a one-line addition to `SEQUENCE_BY_ID_TYPE`, not a change to either screen's rendering or gating logic.

**This mapping's content is a confirmed product decision** — Passport uses a single identity-page step at the confirmed `PASSPORT_ASPECT_RATIO` (125/88), and every other current ID type uses the standard front/back sequence at `CARD_ASPECT_RATIO`, per requirements.md's Resolved Product Decisions. The code structure above remains data-driven and extensible by design: any future change to this mapping (e.g. a new ID type, or a revised aspect ratio) is a data change (editing `SEQUENCE_BY_ID_TYPE`/`PASSPORT_ASPECT_RATIO`), not a structural one.

### `useVerificationStore.ts` (store shape redesign)

```typescript
export interface IdCaptureResult {
  uri: string;
  width: number;
  height: number;
}

export type VerificationData = {
  selectedId: string | null;
  /** Keyed by CaptureStepConfig.id (e.g. "front", "back", "identity-page"). */
  captures: Record<string, IdCaptureResult>;
};

export type VerificationStore = VerificationData & {
  setSelectedId: (id: string | null) => void;
  setCaptureResult: (stepId: string, result: IdCaptureResult) => void;
  clearCaptureResult: (stepId: string) => void;
  reset: () => void;
};

export const initialVerificationState: VerificationData = {
  selectedId: null,
  captures: {},
};

export const useVerificationStore = create<VerificationStore>((set) => ({
  ...initialVerificationState,
  setSelectedId: (selectedId) => set({ selectedId }),
  setCaptureResult: (stepId, result) =>
    set((state) => ({ captures: { ...state.captures, [stepId]: result } })),
  clearCaptureResult: (stepId) =>
    set((state) => {
      const { [stepId]: _removed, ...rest } = state.captures;
      return { captures: rest };
    }),
  reset: () => set({ ...initialVerificationState }),
}));
```

Design rationale, evaluated against this repo's Zustand conventions (flat state + setter actions, `reset()` returning to `initialState`, as seen in `useApartmentFormStore` and the prior `useVerificationStore`):

- **`documentFormat`, `frontResult`, `backResult` are removed entirely** — there is no format concept left to store, and hardcoding two named fields (`front`/`back`) is exactly the shape this pivot needs to stop doing, since Passport's Capture_Sequence has a different step count and different step ids (`identity-page`, not `front`/`back`).
- **`captures: Record<string, IdCaptureResult>`** (keyed by `CaptureStepConfig.id`) is chosen over `captures: IdCaptureResult[]` (an array indexed by position) because:
  - A map keyed by stable step id is robust to Capture_Sequence reordering or a step being retaken out of order — `captures['back']` means the same thing regardless of when it was set, whereas `captures[1]` is only meaningful if the caller also tracks which index corresponds to "back" for this particular ID type.
  - Presence-checking ("is this step done?") is a direct key lookup (`captures[step.id] !== undefined`) against the Capture_Sequence's step ids, rather than needing to zip an array of results against an array of step configs by position.
  - This still satisfies "flat state + setter actions" — `captures` is one flat field, `setCaptureResult`/`clearCaptureResult` are plain setters following the existing `set((state) => ...)` pattern already used elsewhere in this store family (e.g. `useApartmentFormStore`'s `addAdditionalPhoto`/`removeAdditionalPhoto`).
- **`clearCaptureResult`** is new — needed for the retake flow (Requirement 2.7): when the tenant retakes an already-captured step, the design re-captures and overwrites via `setCaptureResult` (an overwrite, not a clear-then-set, so there's no intermediate "step momentarily looks incomplete" flicker); `clearCaptureResult` exists for symmetry and for a future "remove this capture" affordance, but the retake path described in this design uses direct overwrite via `setCaptureResult`, not `clearCaptureResult` + `setCaptureResult`.
- **`selectedId` is unchanged** — `select-id.tsx`'s `setSelectedId` call and `success.tsx`'s `reset()` call both continue to work with no changes to those two files (confirmed by direct inspection — neither reads `frontResult`/`backResult`/`documentFormat` today, so removing those fields does not affect them).
- **`IdCaptureResult` simplification**: the prior three-variant discriminated union (`{ kind: 'camera' | 'image' | 'file' }`) collapses to a single non-discriminated shape, `{ uri, width, height }`. Justification: this flow is camera-only by construction now — there is no second producer of a capture result, so a `kind` discriminant would carry no information (it would always be `'camera'`). Per the ground truth (confirmed via repository-wide search), `IdCaptureResult` has no consumers outside this flow's own store/screens/tests, so this is a safe, non-breaking simplification with no external impact. If a future requirement reintroduces a second capture source, a discriminant can be reintroduced at that time without this design pre-emptively carrying dead type surface today.

### `getCaptureProgress` (new pure helper)

```typescript
export interface CaptureProgress {
  steps: Array<{ step: CaptureStepConfig; result: IdCaptureResult | null }>;
  isComplete: boolean;
}

export function getCaptureProgress(
  sequence: CaptureStepConfig[],
  captures: Record<string, IdCaptureResult>,
): CaptureProgress {
  const steps = sequence.map((step) => ({ step, result: captures[step.id] ?? null }));
  return { steps, isComplete: steps.every((s) => s.result !== null) };
}
```

Placed in `apps/mobile/app/(auth)/verify-account/utils/gating.ts` (replacing `applyFormatSwitchClearing`/`computeCanContinue` — see below), this is the single function both `upload-id.tsx` (to render per-step rows and decide whether to auto-forward to `live-capture.tsx`) and any future consumer consult to answer "what's left." It has no notion of "front"/"back" — it operates over whatever `sequence` the caller passes, uniformly for a 1-step or N-step ID.

### `computeCanContinue` (redesigned, presence-driven, no `kind`)

```typescript
export function computeCanContinue(
  sequence: CaptureStepConfig[],
  captures: Record<string, IdCaptureResult>,
  isConfirmed: boolean,
): boolean {
  return getCaptureProgress(sequence, captures).isComplete && isConfirmed === true;
}
```

This replaces the prior `computeCanContinue(frontResult, backResult, isConfirmed)`. The prior "kind-agnostic" framing is now moot — there is only one kind of result — so the property this function must satisfy shifts from "kind doesn't matter" to "presence across an arbitrary-length sequence is what matters," which is the generalization this pivot requires (see Correctness Properties).

**`applyFormatSwitchClearing` is deleted, not adapted.** There is no format to switch between, so there is nothing to clear on a format switch. No replacement function is introduced for it.

### `live-capture.tsx` route params (redesigned)

```typescript
interface LiveCaptureParams {
  idType: string;
  stepId: string;
}
```

Replacing the old `{ field: 'front' | 'back' }`. `live-capture.tsx`:
1. Reads `idType`/`stepId` via `useLocalSearchParams` (same `expo-router` pattern already used, e.g. by `document-id/upload.tsx` and the prior `live-capture.tsx`).
2. Resolves the current `CaptureStepConfig` via `getCaptureSequence(idType).find((s) => s.id === stepId)`, and uses its `aspectRatio` to size the `GuidedFrameOverlay` (see below) instead of the previously hardcoded CR80 constant.
3. On "Use Photo," calls `setCaptureResult(stepId, { uri, width, height })` (dropping the `kind: 'camera'` wrapper, since `IdCaptureResult` no longer needs a discriminant — see store section above) and then `router.back()`, unchanged in navigation behavior from the prior design.

Everything else in `live-capture.tsx` — permission gating (`useCameraPermission`), the quality-check wiring (`useFrameQualityCheck`), the capture-in-progress guard, the auto-capture-triggered guard, the manual shutter, the retake/review sub-state machine, and the camera-error view — is unchanged in behavior. The only other code change inside this file is that `GuidedFrameOverlay` and `useFrameQualityCheck` are now given the current step's `aspectRatio` rather than an implicit CR80 constant (see next section).

### `GuidedFrameOverlay` / `computeGuidedFrameRect` (generalized to accept an aspect ratio)

The existing `computeGuidedFrameRect(viewportWidth, viewportHeight)` and the `GuidedFrameOverlay` component both hardcode `CR80_ASPECT_RATIO` internally today. This design adds an `aspectRatio` parameter to both:

```typescript
export function computeGuidedFrameRect(
  viewportWidth: number,
  viewportHeight: number,
  aspectRatio: number = CARD_ASPECT_RATIO,
): GuidedFrameRect { /* unchanged geometric algorithm, parameterized on aspectRatio instead of the CR80 constant */ }

interface GuidedFrameOverlayProps {
  viewportWidth: number;
  viewportHeight: number;
  aspectRatio?: number; // defaults to CARD_ASPECT_RATIO
}
```

`computeFillRatio` is unchanged (it already takes a `GuidedFrameRect`, which is aspect-ratio-agnostic by construction — it only cares about the resulting rectangle's area, not how that rectangle's ratio was derived). The default parameter value means every existing card-style call site is unaffected unless it explicitly passes a different ratio; `live-capture.tsx` is updated to pass the current `CaptureStepConfig.aspectRatio` explicitly rather than relying on the default, so Passport's confirmed `1.42:1` (125/88) ratio actually takes effect for that ID type.

`useFrameQualityCheck`'s fill-ratio heuristic already receives `guidedFrameRect` as an option (computed by the caller) rather than computing it internally, so no change is needed inside `useFrameQualityCheck.ts` itself beyond the caller (`live-capture.tsx`) now passing a rect computed with the step's `aspectRatio`.

### `upload-id.tsx` (redesigned as a review/progress screen)

- Reads `selectedId` and `captures` from the store; computes `sequence = getCaptureSequence(selectedId)` and `progress = getCaptureProgress(sequence, captures)`.
- On mount, if `Object.keys(captures).length === 0` (no captures made yet for this session) and `sequence.length > 0`, immediately calls `router.push` to `live-capture.tsx` with `idType=selectedId&stepId=<first step's id>` — implementing the "immediate camera entry" requirement. This check is `captures` being empty rather than `progress.isComplete` being false, so that returning to step 2 after completing some (but not all) steps does **not** re-trigger the auto-forward — the tenant should land on the progress screen once any progress exists, and only auto-forward on a truly fresh session for this ID.
- Renders one row per `progress.steps` entry: label, a checkmark/thumbnail if `result !== null`, a camera icon/prompt if `result === null`; tapping any row (complete or incomplete) navigates to `live-capture.tsx` for that `step.id` (Requirement 2.6/2.7 — retake and first-capture use the identical navigation path, differing only in whether a thumbnail is shown beforehand).
- `canContinue = computeCanContinue(sequence, captures, isConfirmed)` replaces the prior kind-based computation.
- No `DocumentFormatSelector`, no "Add document" bottom sheet, no `UploadDocumentField`, no gallery/file picker affordance anywhere on this screen.

## Data Models

### `IdCaptureResult`

```typescript
interface IdCaptureResult {
  uri: string;
  width: number;
  height: number;
}
```

Non-discriminated (see store section for the collapse rationale). Every value on this flow's data path now originates from `expo-camera`'s `takePictureAsync`, which always produces a JPEG still with this exact shape (plus optional `exif`, not persisted here).

### `CaptureStepConfig` / Capture_Sequence

See Components and Interfaces above. `CaptureStepConfig[]` is not persisted in the store — it is derived on demand from `selectedId` via `getCaptureSequence`, since it is static configuration, not session state. Only the *results* (`captures: Record<string, IdCaptureResult>`) are session state.

### Storage/upload data shape (out of scope for implementation, noted for forward-compatibility)

Unchanged in spirit from the prior design: `IdCaptureResult`'s `uri` and implied `image/jpeg` content type remain sufficient for a future, separate upload feature to follow the existing private-bucket + signed-URL convention (`chatService.ts`'s pattern: upload by path, store the path, sign on read) without a shape change. The `captures` map's string keys (`front`, `back`, `identity-page`, ...) double as a natural storage-path segment (e.g. `verification/{userId}/{idType}/{stepId}.jpg`) if a future upload step wants one, though designing that path scheme is explicitly deferred, not decided, here.

## Correctness Properties Assessment

Two areas retain pure-function logic with genuine input variation worth property-testing; one area from the prior design (format-switch clearing) is removed because there is no longer a format to switch. One new area of variation is introduced by generalizing from a fixed 2-step sequence to an arbitrary-length sequence.

### Acceptance Criteria Testing Prework

2.3/2.4 Continue-gating requires every Capture_Step in the sequence to have a result, and the checkbox to be confirmed
  Thoughts: Pure function over an arbitrary-length sequence of steps and a captures map that may have any subset of step ids present, plus a confirmation boolean. The generalization from "exactly 2 named fields" to "N steps, keyed by id" is exactly the input variation this pivot introduces — a genuine universal property over sequence length and capture-subset combinations, not a restatement of a fixed formula.
  Classification: PROPERTY

2.1 Capture_Sequence is deterministic per Selected_Id_Type
  Thoughts: `getCaptureSequence` is a pure lookup function; for any given `idType` string it always returns the same sequence. This is worth stating as a property (idempotence/determinism) because the sequence is consulted independently by both `live-capture.tsx` and `upload-id.tsx`, and if it were ever accidentally non-deterministic (e.g. object identity churn causing spurious re-renders, or a mutation leaking between calls), that would silently break the "both screens agree on what's left" invariant the whole design depends on.
  Classification: PROPERTY

3.2 Guided_Frame matches the current Capture_Step's configured aspect ratio (generalized from the prior fixed-CR80 property)
  Thoughts: Pure geometric function over arbitrary viewport dimensions AND an arbitrary positive aspect ratio (previously fixed to CR80). This is a direct generalization of the prior design's Property 3 — same geometric algorithm, now also varying the ratio itself, which matters because Passport's ratio differs from the card ratio.
  Classification: PROPERTY

2.6/2.7 Tapping any step (complete or incomplete) navigates to `live-capture.tsx` for that step
  Thoughts: This is a navigation/rendering concern verified by asserting `router.push` was called with the expected params for a given tap target — valuable, but not a "for all inputs" universal property; it's example-based per row/state.
  Classification: EXAMPLE

3.4/3.5 Auto-capture stability timing, camera permission states, camera error handling
  Thoughts: Unchanged from the prior design's classification — stateful timing/FSM behavior over enumerated states, better covered by specific fake-timer/mocked scenarios than randomized generation.
  Classification: EXAMPLE

**Property Reflection**: The continue-gating property and the capture-sequence-determinism property are independent (one is about a derived boolean given a sequence+captures+confirmation; the other is about the sequence lookup itself being stable) — no overlap. The guided-frame-aspect-ratio property is a direct generalization of the prior design's Property 3 (same property, wider input space) rather than a new, distinct property — it is retained under the same conceptual property with its statement widened, not duplicated as a separate property. The prior design's Property 2 (format-switch clearing) has no analog here and is dropped entirely, since there is no format to switch.

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Continue-gating requires every capture step to be present and confirmed

For any Capture_Sequence (a list of one or more Capture_Steps with distinct ids) and any `captures: Record<string, IdCaptureResult>` mapping an arbitrary subset of those ids (or none, or extra unrelated ids) to results, and any boolean `isConfirmed`, the computed `canContinue` value SHALL equal `true` if and only if every step id in the Capture_Sequence is present as a key in `captures` AND `isConfirmed === true`; it SHALL equal `false` if any step id in the Capture_Sequence is absent from `captures`, regardless of `isConfirmed`.

**Validates: Requirements 2.3, 2.4**

### Property 2: Capture sequence lookup is deterministic

For any Selected_Id_Type string (including values not present in the configured mapping) and any `null` value, calling `getCaptureSequence` twice with the same input SHALL return sequences that are element-wise equal (same step ids, labels, and aspect ratios in the same order); calling it with `null` SHALL always return an empty sequence.

**Validates: Requirements 2.1**

### Property 3: Guided frame preserves its configured aspect ratio across all viewport sizes

For any positive camera preview viewport width and height, and any positive aspect ratio value, the computed Guided_Frame rectangle SHALL have a width-to-height ratio equal to the given aspect ratio (within floating-point tolerance), and the resulting fill ratio (guided frame area ÷ preview viewport area) SHALL always be greater than 0 and less than or equal to 1.

**Validates: Requirements 3.2**

## Error Handling

- **Camera permission denied**: unchanged from the prior design — `PermissionDeniedView` renders an explanation + `openSettings()` control; re-checked via `useFocusEffect` on screen refocus.
- **Camera permission restricted** (OS policy): unchanged — `PermissionRestrictedView` renders an explanation with no settings-link control.
- **Camera init/session error**: unchanged — `onMountError` sets local `cameraError` state; the screen renders an error message + "Retry" button that remounts the `CameraView` and resets the capture-in-progress/auto-capture-triggered guards (per the existing `resetCameraLifecycleState` pattern already implemented).
- **Unknown or unconfigured `idType`**: new case introduced by this design's generalization. If `getCaptureSequence(idType)` is called with an `idType` not present in `SEQUENCE_BY_ID_TYPE` and not `null`, it falls back to `CARD_SEQUENCE` (documented fallback, not an error state) rather than throwing or returning an empty sequence — this keeps `upload-id.tsx` and `live-capture.tsx` renderable even if `selectedId` somehow doesn't exactly match a `VALID_IDS`/`SECONDARY_IDS` entry (defensive default, since `selectedId` is a free-form string in the store's type, not a literal union).
- **`stepId` not found in the current sequence**: if `live-capture.tsx` is opened with a `stepId` that `getCaptureSequence(idType)` does not contain (should not happen via normal navigation, since `upload-id.tsx` only ever constructs links from `progress.steps`), the screen renders the existing camera-error-style view with a message indicating the capture step could not be found, rather than crashing on an undefined `CaptureStepConfig`.
- **Async upload loading/success/failure** (Requirements 5.3-5.5 per the renumbered requirements.md): unchanged from the prior design — formally out of scope, not merely unimplemented.

## Testing Strategy

**Unit tests** (example-based, per the prework classification above):
- `useVerificationStore`: `setCaptureResult` stores/overwrites a result under the given `stepId`; `clearCaptureResult` removes a key; `reset()` clears `selectedId` and `captures` back to initial state.
- `getCaptureSequence`: returns `CARD_SEQUENCE` for every current `VALID_IDS`/`SECONDARY_IDS` entry except `Passport`; returns `PASSPORT_SEQUENCE` for `Passport`; returns `[]` for `null`.
- `getCaptureProgress`: given a sequence and a partial `captures` map, correctly reports per-step completion and overall `isComplete`.
- `live-capture.tsx`: permission branches (denied/restricted/undetermined/granted) — unchanged coverage from the prior design, now asserting against `idType`/`stepId` params instead of `field`; camera error + retry; capture review (Retake discards and resets guards; Use Photo calls `setCaptureResult(stepId, ...)` with the correct `stepId`); manual shutter and auto-capture both route through the single `capturePhoto()` function; duplicate-capture prevention; guard reset after Retake; capture-before-ready no-op; rejected `takePictureAsync` surfaces the error view; double-invocation guard.
- `GuidedFrameOverlay/computeGuidedFrameRect`: passing an explicit `aspectRatio` produces a rectangle matching that ratio (not just the CR80 default) — regression coverage for the new parameter, in addition to the property test below.
- `upload-id.tsx`: auto-forwards to `live-capture.tsx` for the first step when `captures` is empty and a sequence exists; does NOT auto-forward once any capture exists; renders one row per sequence step with correct complete/incomplete state; tapping a row (complete or incomplete) navigates to `live-capture.tsx` with the correct `idType`/`stepId`; renders no `DocumentFormatSelector`, no `UploadDocumentField`, and no gallery/file picker affordance anywhere.
- `UploadDocumentField`: regression tests confirming the reverted component still behaves exactly as it did before the `acceptedFileMimeTypes` prop existed (PDF + Word doc accepted by default via `pickFile()`; `pickImage()` unaffected; size validation and cancellation handling unchanged) — protecting `document-id/upload.tsx`, the component's remaining caller, from regressing during the reversion.

**Property-based tests** (minimum 100 iterations each, using `fast-check`):
- Property 1 (continue-gating over arbitrary sequences/captures) — tag: **Feature: id-verification-capture, Property 1: Continue-gating requires every capture step to be present and confirmed**
- Property 2 (capture sequence lookup determinism) — tag: **Feature: id-verification-capture, Property 2: Capture sequence lookup is deterministic**
- Property 3 (guided frame aspect ratio, generalized) — tag: **Feature: id-verification-capture, Property 3: Guided frame preserves its configured aspect ratio across all viewport sizes**

**Integration/manual-verification notes** (unchanged from the prior design, not automatable via unit/property tests):
- Real on-device blur/glare accuracy (EXIF-proxy heuristics) still requires manual device testing; this is an inherited, unchanged limitation, not a new gap introduced by this pivot.
- The Passport aspect-ratio value (`PASSPORT_ASPECT_RATIO = 125 / 88`) is confirmed per requirements.md's Resolved Product Decisions; automated tests confirm the geometry math is applied correctly given whatever ratio is configured. If a future visual/UX review determines a different ratio is preferable for the passport identity-page Guided_Frame, correcting it remains a single-constant change: `aspectRatio` is a per-`CaptureStepConfig` field, and `computeGuidedFrameRect`, `GuidedFrameOverlay`, and `useFrameQualityCheck` all consume it generically (via the `guidedFrameRect` option/prop), with no Passport-specific branching in any of those functions — so updating `PASSPORT_ASPECT_RATIO`'s single value is the entire scope of any such future correction.

## Resolved Decisions (Previously Open Questions)

Per requirements.md's Resolved Product Decisions, the product decisions this design previously deferred are now confirmed:
1. **Passport capture-step count is confirmed as exactly one.** Passport's Capture_Sequence is the single `identity-page` step ("Identity Page") defined by `PASSPORT_SEQUENCE`. `SEQUENCE_BY_ID_TYPE`/`PASSPORT_SEQUENCE` remain structured so that adding a second step in the future (e.g. `{ id: 'signature-page', ... }`) would require no change to `getCaptureSequence`'s callers — this is a durable architectural affordance, not an indication that a second step is anticipated or needed.
2. **The Passport Guided_Frame aspect ratio is confirmed as `PASSPORT_ASPECT_RATIO = 125 / 88 ≈ 1.42`**, derived from ICAO TD3 booklet-page dimensions. This satisfies requirements.md's hard constraint that correcting the ratio later requires no architectural changes: `PASSPORT_ASPECT_RATIO` is a single named, exported constant (not inlined into `PASSPORT_SEQUENCE`'s literal), consumed only through the generic `aspectRatio` field of `CaptureStepConfig`. `computeGuidedFrameRect`, `GuidedFrameOverlay`, and `useFrameQualityCheck` contain no Passport-specific branching — they operate on whatever `aspectRatio` value they are given — so this design guarantee is already in place, independent of the ratio's confirmed status.
3. **Whether any card-style ID besides the twelve currently in `VALID_IDS`/`SECONDARY_IDS` might need a non-standard sequence in the future remains a genuinely open, forward-looking question** — not a blocker for this spec. No such need exists today, but the `SEQUENCE_BY_ID_TYPE` structure supports adding one without a redesign if it becomes necessary later.
