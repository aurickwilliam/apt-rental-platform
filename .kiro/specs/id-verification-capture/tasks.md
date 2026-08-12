# Implementation Plan: ID Verification Capture

## Overview

This plan implements the document-format branch of `apps/mobile/app/(auth)/verify-account/upload-id.tsx`: a new `DocumentFormatSelector`, a new `live-capture.tsx` camera route (`useCameraPermission` + `useFrameQualityCheck` + `GuidedFrameOverlay`), a breaking shape migration of `useVerificationStore` (`frontImages`/`backImages` → `frontResult`/`backResult`), and an `acceptedFileMimeTypes` prop addition to `UploadDocumentField` so the digital-document path can restrict to JPG/PNG/PDF only. Implementation language is TypeScript (existing project language — the design document uses concrete TypeScript, not pseudocode, so no language-selection prompt is required).

**Out of scope: Requirements 6.3-6.5 (async Supabase Storage upload UI).** Requirements.md formally descopes uploading the ID_Capture_Result to Supabase Storage from this feature — this plan only implements ID capture/document selection and persistence of the ID_Capture_Result in `useVerificationStore`. Accordingly, this plan contains no tasks for an upload step, a `SkeletonGroup`-based loading state, an upload-success transition, or upload-failure retry handling. That work is deferred to a separate upload workflow/spec once an actual upload step is designed; only the upload-ready shape of `IdCaptureResult` (see design.md's Data Models section) is carried by this plan.

No test framework currently exists in `apps/mobile` (confirmed: no `jest.config`/`vitest.config`, no `jest`/`vitest`/`fast-check` in `package.json`). Task 1 sets up Jest + `@testing-library/react-native` + `fast-check` before any test-writing sub-tasks run. All test-writing sub-tasks in this plan are required, non-optional parts of the implementation (see Notes).

### Digital-document flow: which picker path produces which `kind`

The digital-document branch of `upload-id.tsx` is served entirely by `UploadDocumentField`, which internally exposes two independent pick paths that this plan does not merge or restructure:

- **Physical ID** → camera capture only, via `live-capture.tsx` → `kind: 'camera'`. No gallery/file picker is ever rendered for this format (Requirement 2.1).
- **Digital document, JPG/PNG** → the existing `UploadDocumentField.pickImage()` path (`ImagePicker.launchImageLibraryAsync`) → `kind: 'image'`. This path is **unchanged** by this plan: it has no mime-type restriction logic today (confirmed by repository inspection) and none is added, because `pickImage()` can only ever return JPG/PNG assets from the device image library — there is nothing to restrict.
- **Digital document, PDF** → the existing `UploadDocumentField.pickFile()` path (`DocumentPicker.getDocumentAsync`) → `kind: 'file'`. This path is restricted to PDF-only **for this feature's caller only**, via the new `acceptedFileMimeTypes` prop described in Task 5.

`UploadDocumentField`'s existing default `ACCEPTED_FILE_TYPES` (PDF + `application/msword` + the `.wordprocessingml.document` mime type) remains the default for its existing caller, `apps/mobile/app/document-id/upload.tsx`, which does not pass the new prop and is therefore fully unaffected by this plan (zero changes to that caller or its behavior).

The new `acceptedFileMimeTypes` prop added in Task 5 affects **only** `pickFile()`'s `DocumentPicker.getDocumentAsync` call and the post-pick mime-type validation inside that same function. It has no code path into `pickImage()` — `pickImage()` does not consult any accepted-types list today, and this plan does not add one, since the digital-document branch only needs JPG, PNG (automatically, via the unrestricted `pickImage()` path), and PDF (via the newly-restricted `pickFile()` path).

### Format/Result Invariant

The following invariant on `useVerificationStore`'s `frontResult`/`backResult` fields holds at all times once Task 3.3's `applyFormatSwitchClearing()` is wired into `upload-id.tsx` (Task 16.1):

- `documentFormat === 'physical'` → only a `frontResult`/`backResult` with `kind: 'camera'` is valid; any other `kind` must not persist under this format.
- `documentFormat === 'digital'` → only a `frontResult`/`backResult` with `kind: 'image'` or `kind: 'file'` is valid.
- `documentFormat === null` → both `frontResult` and `backResult` must be `null`.

`applyFormatSwitchClearing()` (Task 3.3) is the function responsible for maintaining this invariant at runtime whenever the tenant changes the document format. The `IdCaptureResult` discriminated union itself (as defined in design.md) is unchanged and preserved by this plan — no nested-type redesign is introduced by any task below.

### Verified store-migration scope (no additional migration tasks needed)

A repository-wide search for `frontImages|backImages|setFrontImages|setBackImages` confirms these identifiers appear only in `apps/mobile/stores/useVerificationStore.ts` (the store definition) and `apps/mobile/app/(auth)/verify-account/upload-id.tsx` (the only reader/writer). A separate search for `useVerificationStore` usage confirms exactly three consumers: `upload-id.tsx` (reads/writes `frontImages`/`backImages`/`setFrontImages`/`setBackImages`/`selectedId`), `select-id.tsx` (only uses `setSelectedId`), and `success.tsx` (only uses `reset()`). Neither `select-id.tsx` nor `success.tsx` requires code changes for this migration: `select-id.tsx`'s usage is untouched by the store shape change, and `success.tsx`'s `reset()` call picks up the new shape automatically since `reset()` spreads `initialVerificationState`, which Task 2.1 already updates. This is a verified fact from direct code inspection, not an assumption — no migration tasks beyond Task 2 (store shape) and Task 16 (the `upload-id.tsx` consumer) are needed.

## Tasks

- [x] 1. Set up test framework for `apps/mobile`
  - Add `jest`, `jest-expo`, `@testing-library/react-native`, `@types/jest`, and `fast-check` as devDependencies in `apps/mobile/package.json` (pinned exact versions matching the installed Expo SDK's `jest-expo` preset)
  - Add a `jest.config.js` using the `jest-expo` preset, with `transformIgnorePatterns` covering the existing Expo/React Native module set
  - Add a `"test": "jest"` script to `apps/mobile/package.json`
  - Write one trivial smoke test (e.g. `1 + 1 === 2`) to confirm the runner executes before relying on it in later tasks
  - _Requirements: (infrastructure prerequisite for all testing tasks below)_

- [x] 2. Migrate `useVerificationStore` to the `IdCaptureResult` union shape
  - [x] 2.1 Update `apps/mobile/stores/useVerificationStore.ts`
    - Add `DocumentFormat` (`'physical' | 'digital'`) and `IdCaptureResult` (discriminated union on `kind`: `'camera' | 'image' | 'file'`) types as specified in design.md's Components and Interfaces section
    - Replace `frontImages: ImagePicker.ImagePickerAsset[]` / `backImages: ImagePicker.ImagePickerAsset[]` with `frontResult: IdCaptureResult | null` / `backResult: IdCaptureResult | null`
    - Add `documentFormat: DocumentFormat | null` to `VerificationData`
    - Replace `setFrontImages`/`setBackImages` actions with `setFrontResult`/`setBackResult`; add `setDocumentFormat`
    - Update `initialVerificationState` to match the new shape (`documentFormat: null`, `frontResult: null`, `backResult: null`)
    - _Requirements: 1.2, 1.3, 1.7, 2.9, 4.4_
  - [x] 2.2 Write unit tests for `useVerificationStore`
    - `setDocumentFormat` overwrite behavior when a value is already persisted (Req 1.7)
    - `setFrontResult`/`setBackResult` store and replace the result for their respective field (Req 2.9, 4.4)
    - `reset()` clears `documentFormat`, `frontResult`, and `backResult` back to initial state
    - _Requirements: 1.7, 2.9, 4.4_

- [x] 3. Implement and property-test the continue-gating and format-switch-clearing pure functions
  - [x] 3.1 Extract `computeCanContinue(frontResult, backResult, isConfirmed)` as a standalone pure function
    - Place in a new `apps/mobile/app/(auth)/verify-account/utils/gating.ts` (route-scoped, mirrors the route-local `components/` convention already used for `document-id/upload.tsx`'s siblings)
    - Implementation: `frontResult !== null && backResult !== null && isConfirmed === true`
    - _Requirements: 5.1, 5.2, 5.3_
  - [x] 3.2 Write property test for `computeCanContinue`
    - **Property 1: Continue-gating is kind-agnostic and presence-driven**
    - **Validates: Requirements 5.1, 5.2, 5.3**
    - Use `fast-check` to generate `frontResult`/`backResult` as `null` or arbitrary values of each of the three `kind` variants, and arbitrary `isConfirmed` booleans; assert the result matches the presence+confirmation formula regardless of `kind`
    - Tag: **Feature: id-verification-capture, Property 1: Continue-gating is kind-agnostic and presence-driven**
    - Minimum 100 iterations
  - [x] 3.3 Extract `applyFormatSwitchClearing(result, newFormat)` as a standalone pure function
    - Place in the same `apps/mobile/app/(auth)/verify-account/utils/gating.ts` module
    - Implementation: returns `null` if `result` is `null`; returns `null` if `newFormat === 'digital'` and `result.kind === 'camera'`; returns `null` if `newFormat === 'physical'` and `result.kind` is `'image'` or `'file'`; otherwise returns `result` unchanged
    - This function is the runtime enforcement point for the Format/Result Invariant defined in the Overview section
    - _Requirements: 5.4_
  - [x] 3.4 Write property test for `applyFormatSwitchClearing`
    - **Property 2: Format-switch clearing preserves kind/format consistency**
    - **Validates: Requirements 5.4**
    - Use `fast-check` to generate arbitrary `IdCaptureResult | null` values and arbitrary `DocumentFormat` targets; assert the output is either `null` or has a `kind` consistent with the target format
    - Tag: **Feature: id-verification-capture, Property 2: Format-switch clearing preserves kind/format consistency**
    - Minimum 100 iterations

- [x] 4. Checkpoint — ensure store and gating logic tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 5. Add `acceptedFileMimeTypes` prop to `UploadDocumentField`
  - [x] 5.1 Modify `apps/mobile/components/inputs/UploadDocumentField.tsx`
    - Add optional `acceptedFileMimeTypes?: string[]` prop to `UploadDocumentFieldProps`, defaulting to the existing `ACCEPTED_FILE_TYPES` constant (PDF + Word doc mime types) so `document-id/upload.tsx`'s existing usage is unaffected (zero caller changes needed there)
    - This prop controls ONLY the MIME types passed to `DocumentPicker.getDocumentAsync`'s `type` option inside `pickFile()`, and the post-pick MIME validation inside that same function — pass the resolved accepted-types list into that `type` option
    - This prop has no effect on `pickImage()` (the JPG/PNG image-library path); `pickImage()` is not modified by this task and remains entirely unrestricted by this prop
    - After a file is picked via `pickFile()`, validate `asset.mimeType` against the resolved accepted-types list; if not a member, set an "Unsupported file type" error via the existing `sizeError`-style local error state and return without calling `onChange` (mirrors the existing size-check early-return pattern)
    - _Requirements: 4.1, 4.2_
  - [x] 5.2 Write unit tests for `UploadDocumentField`'s `acceptedFileMimeTypes` behavior
    - Default behavior unchanged (Word doc + PDF accepted) when `acceptedFileMimeTypes` is omitted
    - `acceptedFileMimeTypes={['application/pdf']}`: PDF accepted, calls `onChange`; a DOCX-mimetype result is rejected without calling `onChange` and shows the unsupported-type error (Req 4.1, 4.2)
    - `pickImage()` behavior is unaffected by `acceptedFileMimeTypes` regardless of its value (a JPG/PNG pick still calls `onChange` even when `acceptedFileMimeTypes={['application/pdf']}` is passed) — regression coverage confirming the prop has no path into `pickImage()`
    - Boundary file sizes: exactly `maxFileSizeMB`, and `maxFileSizeMB` + 1 byte, accepted/rejected respectively (Req 4.3, pre-existing logic — regression coverage only)
    - Cancellation (`result.canceled: true`) makes no `onChange` call and shows no error (Req 4.5, pre-existing logic — regression coverage only)
    - _Requirements: 4.1, 4.2, 4.3, 4.5_

- [x] 6. Implement the CR80 guided-frame geometry function and property test
  - [x] 6.1 Implement `computeGuidedFrameRect(viewportWidth, viewportHeight)` as a standalone pure function
    - Place in `apps/mobile/components/display/GuidedFrameOverlay.tsx` as an exported helper (co-located with the component that consumes it, per design.md's "generic corner-bracket overlay" placement)
    - Given a positive viewport width/height, compute the largest centered rectangle with a 3.375:2.125 (CR80) aspect ratio that fits within the viewport, returning `{ x, y, width, height }`
    - Also export `computeFillRatio(guidedFrameRect, viewportWidth, viewportHeight)` returning `(guidedFrameRect.width * guidedFrameRect.height) / (viewportWidth * viewportHeight)`
    - _Requirements: 2.3_
  - [x] 6.2 Write property test for `computeGuidedFrameRect` / `computeFillRatio`
    - **Property 3: Guided frame preserves CR80 aspect ratio across all viewport sizes**
    - **Validates: Requirements 2.3**
    - Use `fast-check` to generate arbitrary positive viewport widths/heights (including extreme aspect ratios); assert the returned rectangle's `width / height` equals `3.375 / 2.125` within floating-point tolerance, and assert the fill ratio is always `> 0` and `<= 1`
    - Tag: **Feature: id-verification-capture, Property 3: Guided frame preserves CR80 aspect ratio across all viewport sizes**
    - Minimum 100 iterations

- [x] 7. Build the `GuidedFrameOverlay` presentational component
  - [x] 7.1 Implement `apps/mobile/components/display/GuidedFrameOverlay.tsx`
    - Accepts `viewportWidth`/`viewportHeight` props, calls `computeGuidedFrameRect` (from Task 6.1) to size itself
    - Renders corner brackets via `react-native-svg` (already a dependency) sized/positioned to the computed rectangle
    - Renders a dimmed mask outside the frame area using four semi-transparent `View`s (top/bottom/left/right bands), per design.md's "no new masking dependency" decision
    - Styled exclusively with Uniwind utility classes (no inline `style` objects, no `StyleSheet`), per Requirement 6.1
    - _Requirements: 2.3, 6.1_
  - [x] 7.2 Write unit test for `GuidedFrameOverlay` rendering
    - Given a fixed viewport size, the rendered overlay's bracket/mask layout matches the geometry from `computeGuidedFrameRect` for that size (example-based, not a property — rendering assertions, not the geometry function itself, which is already covered by Task 6.2)
    - _Requirements: 2.3_

- [x] 8. Implement `useCameraPermission` hook
  - [x] 8.1 Create `apps/mobile/hooks/verification/useCameraPermission.ts`
    - Wrap `expo-camera`'s `useCameraPermissions()` hook
    - Expose `{ state: 'granted' | 'denied' | 'restricted' | 'undetermined', requestPermission: () => Promise<void>, openSettings: () => void }`
    - Derive `restricted` as `status === 'denied' && !canAskAgain`
    - `openSettings` calls `Linking.openSettings()` (Req 3.2)
    - Re-check permission state on screen focus via `expo-router`'s `useFocusEffect` (Req 3.3)
    - Add a barrel `apps/mobile/hooks/verification/index.ts` re-exporting `useCameraPermission`, matching the existing per-domain barrel convention (e.g. `hooks/chat/index.ts`)
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6_
  - [x] 8.2 Write unit tests for `useCameraPermission`
    - Each of the four permission states (`granted`, `denied`, `restricted`, `undetermined`) maps correctly from mocked `useCameraPermissions()` responses (Req 3.1, 3.4, 3.6)
    - `restricted` is correctly derived only when `status === 'denied' && canAskAgain === false`, and NOT when `status === 'denied' && canAskAgain === true` (Req 3.6)
    - `openSettings` invokes `Linking.openSettings()` (Req 3.2)
    - Re-focusing (simulated `useFocusEffect` trigger) re-evaluates permission state (Req 3.3)
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.6_

- [x] 9. Checkpoint — ensure `UploadDocumentField`, `GuidedFrameOverlay`, and `useCameraPermission` tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 10. Implement `useFrameQualityCheck` hook
  - [x] 10.1 Implement the blur/glare EXIF-proxy heuristics and fill-ratio check as pure, independently testable functions
    - `evaluateBlurHeuristic(exif: { ExposureTime?: number }): boolean` — flags long exposure times above a documented threshold constant as a motion-blur risk proxy (per design.md's explicit non-Laplacian EXIF-based approach)
    - `evaluateGlareHeuristic(exif: { BrightnessValue?: number }): boolean` — flags brightness values outside a documented expected mid-range band as a glare/exposure proxy
    - Both functions include a code comment explicitly documenting that these are EXIF-metadata proxies, not true pixel-level Laplacian-variance/brightness-variance analysis, per the user-confirmed design tradeoff
    - Place these alongside the hook in `apps/mobile/hooks/verification/useFrameQualityCheck.ts`
    - _Requirements: 2.4_
  - [x] 10.2 Implement `useFrameQualityCheck(cameraRef, options)` hook — sampling loop, concurrency guard, and lifecycle
    - Run sampling on a `setInterval`-style loop at `options.sampleIntervalMs` (default 400ms), started inside a `useEffect` whose cleanup function clears the interval/timer on hook unmount — no interval survives unmount under any circumstance
    - Maintain an in-flight guard (a ref/boolean, e.g. `isSamplingRef`) ensuring at most one `takePictureAsync()` call is in flight at any time: if the interval fires while a previous sample is still being captured/processed, that tick is skipped entirely with no queuing of the skipped sample — the next tick after the in-flight sample completes is the next opportunity to sample
    - Before calling `takePictureAsync()`, check whether `cameraRef.current` is `null`/unavailable (e.g. camera not yet mounted); if so, skip the sample for that tick without throwing, and treat the skipped tick as `'evaluating'` (not `'fail'`)
    - Wrap the `takePictureAsync()` call in a try/catch (or `.catch`); a rejection or thrown error is caught, treated as a failing sample (contributes to `status: 'fail'` for that tick), does not crash the hook, and does not leave the hook stuck in `'evaluating'` indefinitely — sampling continues normally on the next tick
    - Stop sampling immediately when `options.enabled` becomes `false`: no in-flight sample that was already dispatched before `enabled` flipped to `false` is required to be cancelled, but no *new* sample tick may fire once `enabled` is `false`, and no result from a stale/queued tick may be applied after disable (Requirement 2.4's "continuously evaluate" is scoped to `enabled === true` periods only)
    - Downscale each sample via `expo-image-manipulator` to a small fixed size matching the CR80 ratio
    - Run `evaluateBlurHeuristic`, `evaluateGlareHeuristic` (Task 10.1) against sample EXIF data, and the fill-ratio check (`computeFillRatio` from Task 6.1) against the current guided-frame/viewport geometry
    - Expose `{ status: 'evaluating' | 'pass' | 'fail', reasons: Array<'blur' | 'glare' | 'fill'>, isStable: boolean }`
    - `isStable` becomes `true` once `status === 'pass'` for `options.stableDurationMs` (default 1000ms) of consecutive passing samples, and resets to `false` on any failing sample
    - `options.enabled` is wired by the caller (Task 14.4) to be `false` while the capture-review screen state (`'reviewing'`, Task 14.5) is active in `live-capture.tsx`, so sampling does not run while the tenant is reviewing a captured photo
    - _Requirements: 2.4, 2.5_
  - [x] 10.3 Write unit tests for `useFrameQualityCheck`
    - Blur/glare heuristic boundary-value tests: EXIF values just under/over the documented thresholds (Req 2.4)
    - Fake-timer-driven sample sequences: `isStable` transitions to `true` only after `stableDurationMs` of consecutive passing samples, and resets immediately on an interleaved failing sample (Req 2.4, 2.5)
    - `options.enabled = false` pauses the sampling interval (no `takePictureAsync` calls while disabled), and no queued/in-flight result from before disable is applied after disable
    - Concurrency guard: simulate an interval tick firing while a previous `takePictureAsync` promise is still pending — assert `takePictureAsync` is not called a second time until the first resolves, and the skipped tick produces no queued call
    - Unmount cleanup: unmounting the hook clears the interval/timer; no further `takePictureAsync` calls occur after unmount
    - A rejected `takePictureAsync` promise is caught, is treated as a failing sample, does not throw out of the hook, and sampling continues on the next tick
    - `cameraRef.current === null` at sample time results in the tick being skipped (`status` remains/becomes `'evaluating'`, not `'fail'`), without throwing
    - _Requirements: 2.4, 2.5_

- [x] 11. Implement `app.json` camera permission and plugin configuration
  - [x] 11.1 Modify `apps/mobile/app.json`
    - Add `ios.infoPlist.NSCameraUsageDescription` and `ios.infoPlist.NSPhotoLibraryUsageDescription` with the user-facing strings specified in design.md
    - Add `"android.permission.CAMERA"` to `android.permissions` (array does not currently exist — create it)
    - Add the `expo-camera` plugin entry (with `cameraPermission` config) to the `plugins` array, alongside the existing `expo-router`/`expo-splash-screen`/etc. entries
    - _Requirements: 2.2, 3.1, 3.2_
  - [x] 11.2 Verify `app.json` is valid JSON and the mobile app's Expo config resolves without error
    - Run `pnpm --filter mobile exec expo config --type public` (or equivalent non-interactive Expo config check) to confirm the plugin/permission additions parse correctly
    - Note in the task/commit that a native rebuild (`expo prebuild` or new dev client build) is required before this permission change is observable on-device — this cannot be verified by an automated test in this repo
    - _Requirements: 2.2_

- [x] 12. Implement `DocumentFormatSelector` component
  - [x] 12.1 Create `apps/mobile/app/(auth)/verify-account/components/DocumentFormatSelector.tsx`
    - Accepts `{ value: DocumentFormat | null; onSelect: (format: DocumentFormat) => void }`
    - Renders two selectable HeroUI Native `Card`/`ControlField`-style options ("Physical ID" / "Digital Document") with short descriptions
    - Selecting an option calls `onSelect`, and the selector remains visible/re-selectable after a value is chosen (per design.md — no secondary "change format" control)
    - Styled exclusively with HeroUI Native components and Uniwind utility classes, wrapped for use inside `ScreenWrapper` (Req 6.1, 6.2)
    - _Requirements: 1.1, 1.2, 1.3, 1.7, 6.1, 6.2_
  - [x] 12.2 Write unit tests for `DocumentFormatSelector`
    - Selecting "Physical ID" calls `onSelect('physical')`; selecting "Digital Document" calls `onSelect('digital')` (Req 1.2, 1.3)
    - Re-selecting a different option after a value is already set still calls `onSelect` with the newly selected value (Req 1.7)
    - Both options remain rendered/tappable regardless of current `value` (Req 1.1)
    - _Requirements: 1.1, 1.2, 1.3, 1.7_

- [x] 13. Checkpoint — ensure `useFrameQualityCheck`, `app.json`, and `DocumentFormatSelector` tests/config pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 14. Implement the `live-capture.tsx` route (Live_Capture_Screen)
  - [x] 14.1 Create `apps/mobile/app/(auth)/verify-account/live-capture.tsx` — permission gating, camera preview, and readiness tracking
    - Read `field: 'front' | 'back'` via `useLocalSearchParams`, matching the `document-id/upload.tsx` pattern
    - Use `useCameraPermission` (Task 8) to gate rendering: `undetermined` triggers `requestPermission()` before rendering the preview (Req 3.4); `granted` renders the `CameraView` + `GuidedFrameOverlay`; `denied` renders a `PermissionDeniedView` (explanation + `openSettings()` control, Req 3.1, 3.2); `restricted` renders a `PermissionRestrictedView` (explanation only, no settings control, Req 3.6)
    - After `requestPermission()` resolves, render the preview if `granted`, or the denied-state view if `denied` (Req 3.5)
    - Track camera readiness via a local `cameraReady` boolean, set to `true` in `CameraView`'s `onCameraReady` callback and `false` on mount/remount, so downstream capture logic (Task 14.4) can check readiness before calling `takePictureAsync()`
    - Wrap the screen in `ScreenWrapper` (no `scrollable`, per design.md), styled exclusively with HeroUI Native + Uniwind (Req 6.1, 6.2)
    - _Requirements: 2.2, 3.1, 3.2, 3.4, 3.5, 3.6, 6.1, 6.2_
  - [x] 14.2 Add camera error handling to `live-capture.tsx`
    - Wire `CameraView`'s `onMountError` to local `cameraError` state
    - Render an error message + "Retry" control that remounts the `CameraView` when `cameraError` is set (Req 2.10)
    - "Retry" must reset `cameraReady` to `false` (until the remounted `CameraView` fires `onCameraReady` again) and must clear any stale quality-check/capture-guard state left over from before the error — cross-reference Task 10.2's `cameraRef` null-safety (the quality-check loop must not treat the remount window as a hard failure) and Task 14.4's capture-in-progress/auto-capture guards (both must be reset alongside the camera remount, not left set from the errored session)
    - _Requirements: 2.10_
  - [x] 14.3 Write unit tests for `live-capture.tsx` permission and error branches
    - `denied` → renders explanation + settings-link control (Req 3.1)
    - `restricted` → renders explanation with no settings-link control (Req 3.6)
    - `undetermined` → `requestPermission` is called automatically on mount (Req 3.4)
    - Mocked `onMountError` → error message + retry control renders; tapping "Retry" remounts the camera view (Req 2.10)
    - Retry resets `cameraReady`, the capture-in-progress guard, and the auto-capture-triggered guard (regression check on the reset behavior added in Task 14.2)
    - _Requirements: 2.10, 3.1, 3.4, 3.6_
  - [x] 14.4 Add quality indicator, manual shutter, and auto-capture to `live-capture.tsx`, via a single shared `capturePhoto()` function
    - Wire `useFrameQualityCheck` (Task 10) to the mounted `CameraView` ref; set `options.enabled` to `true` only while the screen's internal state (Task 14.5) is `'preview'`, and `false` while it is `'reviewing'` — sampling must be disabled while the capture-review screen state is active
    - Render a quality indicator strip (text + colored dot) reflecting `status`/`reasons` (Req 2.4)
    - Implement a single named `capturePhoto()` function that is the only code path allowed to call `takePictureAsync()` for an actual (non-sampling) capture; both the manual shutter button's `onPress` and the auto-capture trigger call this same function — no separate/duplicate capture logic exists for either trigger
    - `capturePhoto()` first checks `cameraReady` (Task 14.1); if not ready, it returns/no-ops without calling `takePictureAsync()`
    - `capturePhoto()` checks a capture-in-progress guard (a ref/flag) before proceeding; if a capture is already in progress, it returns/no-ops (prevents a fast double-tap on the manual shutter, or an auto-capture trigger overlapping a manual one, from issuing two concurrent `takePictureAsync()` calls)
    - As soon as `capturePhoto()` begins (auto or manual, immediately after the readiness/in-progress guards pass), set `useFrameQualityCheck`'s `enabled` option to `false` before the async `takePictureAsync()` call resolves, so quality sampling cannot fire mid-capture
    - Render an always-enabled manual shutter button whose `onPress` calls `capturePhoto()` directly regardless of `status` (Req 2.6)
    - Maintain a separate "capture already triggered this preview session" guard (a ref/flag) checked before the auto-capture trigger calls `capturePhoto()`: when `isStable` becomes `true`, auto-capture calls `capturePhoto()` only if this guard has not already been set for the current preview session, and the guard is set immediately upon triggering — this prevents duplicate auto-captures from repeated `isStable === true` state updates across re-renders/samples (Req 2.5)
    - _Requirements: 2.4, 2.5, 2.6_
  - [x] 14.5 Add capture review (Retake / Use Photo) to `live-capture.tsx`
    - Add internal screen state (`'preview' | 'reviewing'`) per design.md's state machine
    - On capture (auto or manual, i.e. whenever `capturePhoto()` resolves successfully), transition to `reviewing` and render the captured image full-screen with "Retake" and "Use Photo" actions (Req 2.7)
    - "Retake" discards the captured image, returns to `preview` state, and resets: the capture-in-progress guard, the "capture already triggered this preview session" guard (Task 14.4), and re-enables quality sampling (`useFrameQualityCheck`'s `enabled` set back to `true`) — Retake must fully restore the screen to a fresh `preview` state where auto-capture can trigger again, not merely discard the image (Req 2.8)
    - "Use Photo" calls `setFrontResult`/`setBackResult` (based on the `field` param) with `{ kind: 'camera', asset: { uri, width, height } }`, then calls `router.back()` to exit the capture screen (Req 2.9). "Use Photo" does NOT reset the capture-in-progress or auto-capture-triggered guards, since the screen is unmounting rather than returning to `preview`
    - _Requirements: 2.7, 2.8, 2.9_
  - [x] 14.6 Write unit tests for `live-capture.tsx` capture review, auto-capture, and camera-lifecycle guard behavior
    - "Retake" discards the captured image, returns to the camera preview state, and re-enables quality sampling (Req 2.8)
    - "Use Photo" commits the expected `IdCaptureResult` shape to the store via the correct setter based on `field` (Req 2.9)
    - Manual shutter capture works regardless of mocked `status`, and routes through `capturePhoto()` (assert via a shared mock/spy also used by the auto-capture test below) (Req 2.6)
    - Auto-capture triggers once `isStable` becomes `true` (fake-timer/mocked hook scenario), routing through the same `capturePhoto()` mock/spy used by the manual-shutter test (Req 2.5)
    - Duplicate-capture prevention: repeated `isStable === true` updates within a single preview session trigger `capturePhoto()` exactly once (Req 2.5)
    - Guard reset after Retake: following a Retake, a second auto-capture can occur (the "already triggered" guard was reset) (Req 2.5, 2.8)
    - Capture attempted before `onCameraReady` fires is a graceful no-op (`capturePhoto()` returns without calling `takePictureAsync()`, no crash/throw)
    - A rejected `takePictureAsync` promise during `capturePhoto()` (not the quality-check sampling loop) surfaces the error/retry UI state (reusing/paralleling `cameraError`)
    - Rapid double-invocation of `capturePhoto()` (e.g. simulated double-tap) results in only one actual `takePictureAsync` call, due to the capture-in-progress guard
    - _Requirements: 2.5, 2.6, 2.8, 2.9_

- [x] 15. Checkpoint — ensure all `live-capture.tsx` tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 16. Integrate the document-format branch into `upload-id.tsx`
  - [x] 16.1 Modify `apps/mobile/app/(auth)/verify-account/upload-id.tsx`
    - Read `documentFormat`, `frontResult`, `backResult` from `useVerificationStore` (replacing `frontImages`/`backImages`)
    - Render `DocumentFormatSelector` (Task 12) at the top of the screen; wire its `onSelect` to `setDocumentFormat` plus the format-switch clearing logic from Task 3.3 (`applyFormatSwitchClearing`) applied to both `frontResult` and `backResult`, maintaining the Format/Result Invariant defined in the Overview
    - Replace `canContinue`'s inline computation with `computeCanContinue` (Task 3.1)
    - When `documentFormat === 'physical'`: render two capture entry cards ("Front of ID" / "Back of ID") showing a thumbnail when the corresponding result has `kind === 'camera'`, navigating to `live-capture.tsx?field=front` / `?field=back` on tap; render no gallery/file picker affordance in this branch (Req 2.1) — this is the camera-only physical-ID flow described in the Overview
    - When `documentFormat === 'digital'`: render two `UploadDocumentField`s (front/back) bound directly to `frontResult`/`backResult`, passing `acceptedFileMimeTypes={['application/pdf']}` (Task 5) so the `pickFile()` path is PDF-only for this caller, while the `pickImage()` path remains automatically JPG/PNG-only with no prop needed — this is the digital JPG/PNG/PDF flow described in the Overview
    - When `documentFormat === null`: render neither entry point (Req 1.1)
    - Remove the now-unused `UploadImageField` import if no longer referenced
    - _Requirements: 1.1, 1.4, 1.5, 1.6, 2.1, 4.1, 5.1, 5.2, 5.3, 5.4_
  - [x] 16.2 Write unit tests for `upload-id.tsx` conditional rendering
    - `documentFormat === null` renders neither the capture cards nor the `UploadDocumentField`s (Req 1.1)
    - `documentFormat === 'physical'` renders capture cards with no gallery/file picker affordance, and tapping a card navigates to `live-capture.tsx` with the correct `field` param (Req 1.5, 2.1)
    - `documentFormat === 'digital'` renders `UploadDocumentField`s bound to `frontResult`/`backResult`, passing `acceptedFileMimeTypes={['application/pdf']}` (Req 1.6, 4.1)
    - Switching `documentFormat` after a mismatched-kind result exists clears that result, preserving the Format/Result Invariant (integration-level regression check on top of Task 3.4's pure-function property test) (Req 5.4)
    - _Requirements: 1.1, 1.5, 1.6, 2.1, 5.4_

- [x] 17. Final checkpoint — ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- All sub-tasks in this plan, including test-writing sub-tasks, are required parts of this implementation plan and must be implemented — no `*` (optional) markers remain anywhere in this document. Task 1's full Jest/`@testing-library/react-native`/`fast-check` test infrastructure investment is justified precisely because every test-writing sub-task below is required, not optional.
- `expo-camera` and `expo-image-manipulator` are already present in `apps/mobile/package.json`; no new runtime dependency is added by this plan. `fast-check` and the Jest-based test toolchain (Task 1) are the only new dependencies, and are devDependencies only.
- Blur and glare checks (Task 10.1) are implemented as EXIF-metadata proxy heuristics, not true pixel-level Laplacian-variance/brightness-variance analysis, per the user-confirmed feasibility constraint in design.md (`expo-camera`'s JS API exposes no frame-processor/pixel access). This is documented in code comments at the point of implementation, not just in design.md.
- `UploadDocumentField`'s `{ kind, asset }` union is extended (via the store's `IdCaptureResult` type) with a `'camera'` kind rather than pairing separate `UploadImageField` + `UploadFileField` components, per the user-confirmed design decision.
- Property tests use `fast-check` at a minimum of 100 iterations per property, tagged with the `Feature: id-verification-capture, Property N: ...` format for traceability back to design.md.
- Task 2 is a breaking change to `useVerificationStore`'s existing shape; `upload-id.tsx` (Task 16) is the only consumer that needs updating, per the verified store-migration scope in the Overview (`select-id.tsx` and `success.tsx` need no changes).
- The `acceptedFileMimeTypes` prop (Task 5) only ever affects `UploadDocumentField`'s `pickFile()`/`DocumentPicker` path; it never affects `pickImage()`/`ImagePicker`, by construction — see the Digital-document flow subsection in the Overview.
- Requirements 6.3-6.5 (async Supabase Storage upload loading/success/failure UI) are explicitly out of scope per requirements.md and are intentionally uncovered by this task list — see the Overview for details. No upload implementation tasks are included as a result.

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1", "2.1", "5.1", "6.1", "8.1", "11.1"] },
    { "id": 1, "tasks": ["2.2", "3.1", "3.3", "5.2", "6.2", "7.1", "8.2", "10.1", "11.2", "12.1"] },
    { "id": 2, "tasks": ["3.2", "3.4", "7.2", "10.2", "12.2", "14.1"] },
    { "id": 3, "tasks": ["10.3", "14.2"] },
    { "id": 4, "tasks": ["14.3"] },
    { "id": 5, "tasks": ["14.4"] },
    { "id": 6, "tasks": ["14.5"] },
    { "id": 7, "tasks": ["14.6"] },
    { "id": 8, "tasks": ["16.1"] },
    { "id": 9, "tasks": ["16.2"] }
  ]
}
```
