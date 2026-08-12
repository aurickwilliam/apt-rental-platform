# Implementation Plan: ID Verification Capture

## Overview

This plan removes the Physical ID / Digital Document format branch from the mobile verification flow and replaces it with a camera-only, capture-sequence-driven flow: a new `captureSequences.ts` configuration module, a redesigned `useVerificationStore` (`documentFormat`/`frontResult`/`backResult` → `selectedId`/`captures: Record<string, IdCaptureResult>`), a redesigned `live-capture.tsx` route (`field: 'front' | 'back'` → `idType`/`stepId` params, and a per-step guided-frame aspect ratio instead of a hardcoded CR80 constant), a redesigned `upload-id.tsx` (format selector + picker fields → review/progress screen that auto-forwards to camera capture on first entry), and a scoped reversion of `UploadDocumentField`'s `acceptedFileMimeTypes` prop (removed, since this flow was its only caller). Implementation language is TypeScript (existing project language and existing concrete-TypeScript design document — no language-selection prompt is required).

**Removed by this plan, not adapted:** `DocumentFormat`, `documentFormat`, `DocumentFormatSelector` (component + its test file), `applyFormatSwitchClearing`, the `'image'`/`'file'` variants of `IdCaptureResult`, the digital-document branch of `upload-id.tsx`, the `acceptedFileMimeTypes` prop on `UploadDocumentField`, and every test that exercised any of the above. This plan does not preserve or re-purpose any of these merely because they existed.

**Out of scope, unchanged from the prior plan: Requirements 5.3-5.5 (async Supabase Storage upload UI).** No tasks for an upload step, loading state, or upload-failure retry are included.

**Preserved unchanged (behaviorally):** `useCameraPermission`, `useFrameQualityCheck` (including its concurrency guard, unmount cleanup, and EXIF-proxy blur/glare heuristics), the capture-in-progress and auto-capture-triggered guards in `live-capture.tsx`, the permission-denied/restricted/error views, and the retake/review sub-state machine. Tasks touching these files are scoped to re-parameterizing them around the new capture-sequence model (e.g. passing an explicit aspect ratio) — not re-justifying or redesigning decisions already made for the camera flow.

The existing Jest + `@testing-library/react-native` + `fast-check` test infrastructure (already set up in `apps/mobile`) is reused as-is; no test-framework setup task is needed in this plan.

### Verified scope of the store migration

A repository-wide search confirms `documentFormat`, `frontResult`, `backResult`, `setDocumentFormat`, `setFrontResult`, `setBackResult`, and the `IdCaptureResult`/`DocumentFormat` types are referenced only within: `useVerificationStore.ts` (definition), `upload-id.tsx` + `upload-id.test.tsx`, `live-capture.tsx` + `live-capture.test.tsx`, `DocumentFormatSelector.tsx` + `DocumentFormatSelector.test.tsx`, and `gating.ts` + `gating.test.ts`. `select-id.tsx` (only uses `setSelectedId`) and `success.tsx` (only uses `reset()`) require no code changes — confirmed by direct inspection, not assumed.

### Verified scope of the `UploadDocumentField` reversion

A repository-wide search confirms `UploadDocumentField` is imported only by `upload-id.tsx` (this flow) and `apps/mobile/app/document-id/upload.tsx` (a different, unrelated feature). `document-id/upload.tsx` does not pass `acceptedFileMimeTypes` today, so removing the prop does not change that caller's behavior. `UploadImageField` and `UploadFileField` (used by `third-process.tsx` and `edit-main.tsx`) do not import or reference `UploadDocumentField` or its props at all, and are untouched by this plan.

## Tasks

- [x] 1. Define the capture-sequence configuration module
  - [x] 1.1 Create `apps/mobile/app/(auth)/verify-account/constants/captureSequences.ts`
    - Define `CaptureStepConfig` (`{ id: string; label: string; aspectRatio: number }`), `CARD_ASPECT_RATIO` (3.375 / 2.125, the existing CR80 constant), `PASSPORT_ASPECT_RATIO` (125 / 88, documented in a code comment as the confirmed passport identity-page aspect ratio, per ICAO TD3 booklet page dimensions)
    - `PASSPORT_ASPECT_RATIO` MUST be defined as a single named, exported constant, and MUST NOT be inlined as a literal into `PASSPORT_SEQUENCE`'s definition — even though the sequence below already reads as defining it separately, this separateness is a stated constraint of this task, not incidental structure. This exists specifically so the ratio can be revised in the future (if a subsequent visual/UX review determines a different value is preferable) by editing that one exported constant, with no change required to `PASSPORT_SEQUENCE`, `getCaptureSequence`, or any consumer
    - Define `CARD_SEQUENCE` (`front`/`back`, `CARD_ASPECT_RATIO`) and `PASSPORT_SEQUENCE` (single `identity-page` step, referencing the `PASSPORT_ASPECT_RATIO` constant defined above)
    - Define `SEQUENCE_BY_ID_TYPE` mapping `'Passport'` to `PASSPORT_SEQUENCE`, with every other `VALID_IDS`/`SECONDARY_IDS` entry falling back to `CARD_SEQUENCE`
    - Implement `getCaptureSequence(idType: string | null): CaptureStepConfig[]` — returns `[]` for `null`, `SEQUENCE_BY_ID_TYPE[idType] ?? CARD_SEQUENCE` otherwise
    - _Requirements: 2.1_
  - [x] 1.2 Write unit tests for `getCaptureSequence`
    - Returns `CARD_SEQUENCE` for each of the twelve non-Passport `VALID_IDS`/`SECONDARY_IDS` entries
    - Returns `PASSPORT_SEQUENCE` for `'Passport'`
    - Returns `[]` for `null`
    - Returns `CARD_SEQUENCE` for an arbitrary unrecognized string (fallback behavior)
    - Asserts `PASSPORT_SEQUENCE`'s `identity-page` step's `aspectRatio` is `===` the exported `PASSPORT_ASPECT_RATIO` constant (reference equality to the constant, not a duplicated literal value) — regression coverage for Task 1.1's "single named constant, not inlined" requirement
    - _Requirements: 2.1_
  - [x] 1.3 Write property test for `getCaptureSequence` determinism
    - **Property 2: Capture sequence lookup is deterministic**
    - **Validates: Requirements 2.1**
    - Use `fast-check` to generate arbitrary strings (including `VALID_IDS`/`SECONDARY_IDS` values, `null`, and random strings); assert calling `getCaptureSequence` twice with the same input returns element-wise-equal sequences, and that `null` always returns `[]`
    - Tag: **Feature: id-verification-capture, Property 2: Capture sequence lookup is deterministic**
    - Minimum 100 iterations

- [x] 2. Redesign `useVerificationStore` around the `captures` map
  - [x] 2.1 Modify `apps/mobile/stores/useVerificationStore.ts`
    - Remove `DocumentFormat`, `documentFormat`, `setDocumentFormat`, `frontResult`, `backResult`, `setFrontResult`, `setBackResult`, and the three-variant `IdCaptureResult` union
    - Add `IdCaptureResult` as `{ uri: string; width: number; height: number }` (non-discriminated)
    - Add `captures: Record<string, IdCaptureResult>` to `VerificationData`, and `setCaptureResult(stepId, result)` / `clearCaptureResult(stepId)` actions, per design.md's Components and Interfaces section
    - Update `initialVerificationState` to `{ selectedId: null, captures: {} }`
    - `selectedId`/`setSelectedId` are unchanged
    - _Requirements: 2.2, 3.8_
  - [x] 2.2 Rewrite unit tests for `useVerificationStore`
    - Replace `apps/mobile/stores/useVerificationStore.test.ts`'s existing `documentFormat`/`frontResult`/`backResult` tests entirely
    - `setCaptureResult` stores a result under the given `stepId`, and overwrites an existing result at that same `stepId` on a second call
    - `clearCaptureResult` removes the entry for the given `stepId` and leaves other keys untouched
    - `reset()` clears `selectedId` and `captures` back to `initialVerificationState`
    - _Requirements: 2.2, 3.8_

- [x] 3. Redesign the gating utilities around the capture-sequence model
  - [x] 3.1 Rewrite `apps/mobile/app/(auth)/verify-account/utils/gating.ts`
    - Remove `applyFormatSwitchClearing` entirely (no replacement — there is no format to switch)
    - Add `getCaptureProgress(sequence: CaptureStepConfig[], captures: Record<string, IdCaptureResult>): CaptureProgress` per design.md (returns per-step completion plus overall `isComplete`)
    - Rewrite `computeCanContinue` to accept `(sequence, captures, isConfirmed)` and return `getCaptureProgress(sequence, captures).isComplete && isConfirmed === true`
    - _Requirements: 2.3, 2.4_
  - [x] 3.2 Rewrite `apps/mobile/app/(auth)/verify-account/utils/gating.test.ts`
    - Remove all `applyFormatSwitchClearing` tests and the old two-field `computeCanContinue` tests
    - Unit tests for `getCaptureProgress`: given a sequence of arbitrary length and a partial `captures` map, per-step `result` and overall `isComplete` are reported correctly, including the empty-sequence and empty-captures edge cases
    - _Requirements: 2.3, 2.4_
  - [x] 3.3 Write property test for the redesigned `computeCanContinue`
    - **Property 1: Continue-gating requires every capture step to be present and confirmed**
    - **Validates: Requirements 2.3, 2.4**
    - Use `fast-check` to generate an arbitrary-length list of distinct step ids (the sequence), an arbitrary subset of those ids (plus optionally unrelated extra ids) mapped to arbitrary `IdCaptureResult` values (the captures), and an arbitrary `isConfirmed` boolean; assert `canContinue` is `true` iff every sequence step id is a key in `captures` and `isConfirmed === true`
    - Tag: **Feature: id-verification-capture, Property 1: Continue-gating requires every capture step to be present and confirmed**
    - Minimum 100 iterations

- [x] 4. Checkpoint — ensure capture-sequence config, store, and gating tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 5. Revert the `acceptedFileMimeTypes` prop on `UploadDocumentField`
  - [x] 5.1 Modify `apps/mobile/components/inputs/UploadDocumentField.tsx`
    - Remove the `acceptedFileMimeTypes` prop, its JSDoc, and the corresponding parameter/default from `UploadDocumentFieldProps` and the component's destructured props
    - `pickFile()` reverts to calling `DocumentPicker.getDocumentAsync` with the component's own `ACCEPTED_FILE_TYPES` constant unconditionally, and the post-pick MIME validation reverts to checking against `ACCEPTED_FILE_TYPES` directly
    - Do not modify `pickImage()`, the `UploadedDocument` union, `maxFileSizeMB` handling, or the BottomSheet picker UI — this is a scoped reversion of one prop only
    - _Requirements: (supports Requirement 1.3 by removing feature-specific surface no longer needed by this flow; protects `document-id/upload.tsx`, confirmed to be `UploadDocumentField`'s only remaining caller)_
  - [x] 5.2 Update `apps/mobile/components/inputs/UploadDocumentField.test.tsx`
    - Remove the `acceptedFileMimeTypes={['application/pdf']}` describe block and its test cases entirely
    - Keep/restore the default-behavior tests (PDF and Word-doc-mimetype files accepted via `pickFile()`; `pickImage()` behavior; size-boundary tests; cancellation) as regression coverage for the reverted component, matching its pre-prop behavior
    - _Requirements: (regression coverage for the shared component reversion)_

- [x] 6. Generalize the guided-frame geometry to accept an explicit aspect ratio
  - [x] 6.1 Modify `apps/mobile/components/display/GuidedFrameOverlay.tsx`
    - Add an `aspectRatio: number = CARD_ASPECT_RATIO` parameter to `computeGuidedFrameRect` (renaming/aliasing the existing `CR80_ASPECT_RATIO` export to `CARD_ASPECT_RATIO`, or keeping both as re-exports of the same value, to align naming with `captureSequences.ts`'s `CARD_ASPECT_RATIO`) — the geometric algorithm itself is unchanged, only parameterized
    - Add an optional `aspectRatio?: number` prop to `GuidedFrameOverlayProps`, defaulting to `CARD_ASPECT_RATIO`, passed through to `computeGuidedFrameRect`
    - `computeFillRatio` is unchanged (already aspect-ratio-agnostic)
    - _Requirements: 3.2_
  - [x] 6.2 Update `apps/mobile/components/display/GuidedFrameOverlay.test.ts` (property test)
    - Widen the existing CR80-only property test to generate an arbitrary positive `aspectRatio` in addition to arbitrary positive viewport dimensions
    - **Property 3: Guided frame preserves its configured aspect ratio across all viewport sizes**
    - **Validates: Requirements 3.2**
    - Assert the returned rectangle's `width / height` equals the generated `aspectRatio` within floating-point tolerance, and the fill ratio is always `> 0` and `<= 1`
    - Tag: **Feature: id-verification-capture, Property 3: Guided frame preserves its configured aspect ratio across all viewport sizes**
    - Minimum 100 iterations
  - [x] 6.3 Add a unit test confirming an explicit non-default `aspectRatio` (e.g. the Passport ratio) is actually applied
    - Regression coverage distinct from the property test above: pass a specific, known `aspectRatio` value and assert the rendered/computed rectangle matches it, guarding against the default parameter silently overriding an explicitly-passed value
    - _Requirements: 3.2_

- [x] 7. Checkpoint — ensure `UploadDocumentField` reversion and guided-frame generalization tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 8. Redesign `live-capture.tsx`'s route params and step resolution
  - [x] 8.1 Modify `apps/mobile/app/(auth)/verify-account/live-capture.tsx` — params and step resolution
    - Replace `useLocalSearchParams<{ field: CaptureField }>()` with `useLocalSearchParams<{ idType: string; stepId: string }>()`; remove the `CaptureField` type
    - Resolve the current `CaptureStepConfig` via `getCaptureSequence(idType).find((s) => s.id === stepId)`; if not found, treat this the same as a camera error (render the existing error-view pattern with a "capture step could not be found" message) rather than crashing on `undefined`
    - Pass the resolved step's `aspectRatio` into `computeGuidedFrameRect`/`GuidedFrameOverlay` and into the `guidedFrameRect` option given to `useFrameQualityCheck`, replacing the previous implicit CR80 default
    - Update the on-screen step label (previously derived from `field === 'back' ? 'Back of ID' : 'Front of ID'`) to use the resolved `CaptureStepConfig.label` directly
    - _Requirements: 2.6, 2.7, 3.2_
  - [x] 8.2 Modify `apps/mobile/app/(auth)/verify-account/live-capture.tsx` — commit on "Use Photo"
    - Replace the `field === 'front' ? setFrontResult(...) : setBackResult(...)` branch with a single `setCaptureResult(stepId, { uri, width, height })` call (no `kind: 'camera'` wrapper, per the simplified `IdCaptureResult` shape)
    - `router.back()` call after commit is unchanged
    - _Requirements: 3.8_
  - [x] 8.3 Rewrite the permission/error/params portions of `apps/mobile/app/(auth)/verify-account/live-capture.test.tsx`
    - Update all test setup to pass `idType`/`stepId` params instead of `field`
    - Add a test for the "step not found in sequence" error-view case (Task 8.1)
    - Add a test confirming the guided frame receives the resolved step's `aspectRatio` (e.g. asserting a Passport `stepId` results in `PASSPORT_ASPECT_RATIO` being passed down, versus a card step id resulting in `CARD_ASPECT_RATIO`)
    - Existing permission-state tests (denied/restricted/undetermined/granted) and camera-error/retry tests are retained with only the params updated — their assertions and mocking approach are otherwise unchanged
    - _Requirements: 3.2, 3.9, 4.1, 4.4, 4.6_
  - [x] 8.4 Rewrite the capture-commit portion of `live-capture.test.tsx`
    - "Use Photo" now asserts `setCaptureResult` was called with the current `stepId` and the expected `{ uri, width, height }` shape (no `kind` field)
    - All other capture-review, manual-shutter, auto-capture, and guard-reset tests (Retake, duplicate-capture prevention, guard reset after Retake, capture-before-ready no-op, rejected `takePictureAsync`, double-invocation guard) are retained as-is — these test the unchanged camera-lifecycle mechanics, not the params/store change, and require no behavioral rewrite beyond updating the mocked store shape
    - _Requirements: 2.2, 3.6, 3.7_

- [x] 9. Checkpoint — ensure `live-capture.tsx` tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 10. Redesign `upload-id.tsx` as a review/progress screen
  - [x] 10.1 Modify `apps/mobile/app/(auth)/verify-account/upload-id.tsx` — remove the format branch
    - Remove the `DocumentFormatSelector` import/usage, the `documentFormat`/`frontResult`/`backResult` store reads, `setDocumentFormat`/`setFrontResult`/`setBackResult`, `handleFormatSelect`, `toUploadedDocument`, the `UploadDocumentField` import/usage, and the `DIGITAL_ACCEPTED_FILE_MIME_TYPES` constant
    - Remove the `CaptureEntryCard` component (replaced by the step-row rendering in Task 10.2) and the now-unused `IconCamera` import if no longer referenced elsewhere in the file
    - _Requirements: 1.2, 1.3_
  - [x] 10.2 Modify `apps/mobile/app/(auth)/verify-account/upload-id.tsx` — render the capture-sequence progress screen
    - Read `selectedId` and `captures` from `useVerificationStore`; compute `sequence = getCaptureSequence(selectedId)` and `progress = getCaptureProgress(sequence, captures)`
    - Render one row per `progress.steps` entry (label, thumbnail-or-camera-icon, complete/incomplete indicator); tapping any row navigates to `live-capture.tsx` with `idType=<selectedId>&stepId=<step.id>`, for both incomplete steps (first capture) and complete steps (retake)
    - Replace `canContinue`'s computation with `computeCanContinue(sequence, captures, isConfirmed)`
    - Render no `DocumentFormatSelector`, no `UploadDocumentField`, and no gallery/file picker affordance anywhere on this screen
    - _Requirements: 1.4, 2.5, 2.6, 2.7_
  - [x] 10.3 Modify `apps/mobile/app/(auth)/verify-account/upload-id.tsx` — auto-forward to camera on first entry
    - On mount, if `Object.keys(captures).length === 0` and `sequence.length > 0`, call `router.push` to `live-capture.tsx` with `idType=<selectedId>&stepId=<sequence[0].id>` — implemented via a `useEffect` keyed on `selectedId` so it fires once per fresh session for a given ID, and does not re-fire once any capture exists (checked via the `captures` emptiness condition, not `progress.isComplete`)
    - _Requirements: 1.1_
  - [x] 10.4 Rewrite `apps/mobile/app/(auth)/verify-account/upload-id.test.tsx`
    - Remove all `documentFormat`-based tests (null/physical/digital branch rendering, format-switch-clearing regression check) and the `UploadDocumentField` mock
    - Auto-forward test: with `captures: {}` and a non-null `selectedId`, mounting the screen triggers `router.push` to `live-capture.tsx` with the first step's `idType`/`stepId`
    - No-auto-forward test: with at least one (but not all) `captures` entries present, mounting the screen does NOT trigger the auto-forward, and instead renders the progress rows
    - Row-rendering test: given a mixed-progress `captures` map, each row reflects the correct complete/incomplete state
    - Navigation test: tapping an incomplete row and tapping a complete row both navigate to `live-capture.tsx` with the correct `idType`/`stepId`
    - Absence test: no `DocumentFormatSelector`, no `UploadDocumentField`, and no "Choose photo"/"Choose file" text renders anywhere on this screen
    - _Requirements: 1.1, 1.4, 2.5, 2.6, 2.7_

- [x] 11. Remove the `DocumentFormatSelector` component and its test
  - [x] 11.1 Delete `apps/mobile/app/(auth)/verify-account/components/DocumentFormatSelector.tsx` and `apps/mobile/app/(auth)/verify-account/components/DocumentFormatSelector.test.tsx`
    - Confirm (via search) that no remaining file imports `DocumentFormatSelector` before deleting — `upload-id.tsx` no longer does as of Task 10.1
    - _Requirements: 1.2_

- [x] 12. Final checkpoint — ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- All sub-tasks in this plan, including every test-writing sub-task (unit tests, property tests, and regression tests), are required implementation work with the same standing as any other task in this list. No sub-task in this plan is marked optional with `*`; the standard workflow convention of marking test-writing sub-tasks optional has been overridden for this spec, and that override applies to the full task list as written.
- Jest, `jest-expo`, `@testing-library/react-native`, and `fast-check` remain the required test infrastructure for this plan. This tooling is already set up in `apps/mobile` and is reused as-is; no new test-framework setup task is included or needed.
- `getCaptureSequence`'s `SEQUENCE_BY_ID_TYPE` mapping content (which IDs get the standard card sequence vs. a custom one) is confirmed per requirements.md's Resolved Product Decisions: Passport maps to the single-step identity-page sequence, and every other current `VALID_IDS`/`SECONDARY_IDS` entry maps to the standard front/back sequence. Task 1.1 implements this confirmed mapping, not a placeholder default.
- No new runtime dependencies are introduced or removed by this plan. `expo-camera`, `expo-image-manipulator`, `expo-image-picker`, and `expo-document-picker` all remain project dependencies; only this flow's usage of the picker packages (via the removed `UploadDocumentField` usage in `upload-id.tsx`) is removed.
- Property tests use `fast-check` at a minimum of 100 iterations per property, tagged with the `Feature: id-verification-capture, Property N: ...` format for traceability back to design.md.
- Task 5 (the `UploadDocumentField` reversion) is scoped strictly to the `acceptedFileMimeTypes` prop; `document-id/upload.tsx` (the component's remaining caller) requires no changes and is protected by Task 5.2's retained regression tests.

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1", "2.1", "5.1", "6.1"] },
    { "id": 1, "tasks": ["1.2", "1.3", "2.2", "3.1", "5.2", "6.2", "6.3"] },
    { "id": 2, "tasks": ["3.2", "3.3", "8.1"] },
    { "id": 3, "tasks": ["8.2"] },
    { "id": 4, "tasks": ["8.3", "8.4"] },
    { "id": 5, "tasks": ["10.1"] },
    { "id": 6, "tasks": ["10.2", "11.1"] },
    { "id": 7, "tasks": ["10.3"] },
    { "id": 8, "tasks": ["10.4"] }
  ]
}
```
