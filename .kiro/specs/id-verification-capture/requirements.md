# Requirements Document

## Introduction

The mobile account verification flow (`apps/mobile/app/(auth)/verify-account/`) currently lets a tenant pick any existing photo from their device gallery for the "Front of ID" and "Back of ID" fields on step 2 ("Upload Your ID"). Because step 3 of the flow captures a selfie for liveness/face-match against the ID photo, an ID photo sourced from an old gallery file undermines that comparison — the photo needs to be freshly captured when the document is a physical, camera-friendly ID.

This feature branches the capture method by document type:

- **Photo IDs** (e.g. Driver's License, National ID, UMID Card, Passport, Postal ID, PRC ID — physical cards/booklets a phone camera can photograph) must be captured live, in-app, using the device camera, with guided framing and basic quality checks before the photo is accepted.
- **Digital/scanned documents** (PDF or an existing digital copy of an ID) keep the current picker-based upload path, since these cannot be photographed live without degrading quality.

The document type/format choice is made on step 1 ("Select a Valid ID") or at the top of step 2, and is persisted in the existing `useVerificationStore` Zustand store so step 2 knows which capture path to render. Both paths must resolve to a value shape that step 2's "gate" logic (checkbox + "Continue to Selfie" button) can consume uniformly, following the `{ kind, asset }` union convention already used by `UploadDocumentField`. That value shape is also designed to be upload-ready so that a *future, separate* upload-to-Supabase-Storage feature can consume it without a shape change — but implementing that upload step itself is explicitly out of scope for this feature (see Requirement 6, Acceptance Criteria 3-5).

## Glossary

- **Verification_Flow**: The four-step in-app flow under `apps/mobile/app/(auth)/verify-account/` (`select-id` → `upload-id` → `upload-selfie` → `success`/`failed`) that collects a tenant's ID and selfie for identity verification.
- **Verification_Store**: The Zustand store at `apps/mobile/stores/useVerificationStore.ts` that holds `selectedId`, `frontImages`, `backImages`, and (per this feature) the document format and captured/picked assets for the Verification_Flow.
- **Document_Format_Selector**: A UI control, added to step 1 (`select-id.tsx`) or the top of step 2 (`upload-id.tsx`), that lets the tenant declare whether their selected ID will be provided as a **Physical_ID** or a **Digital_Document**.
- **Physical_ID**: A document format value meaning the tenant holds a physical card/booklet ID (e.g. Driver's License, National ID/PhilID, UMID Card, PRC ID, SSS Card, Voter's ID, Postal ID, Senior Citizen ID, PWD ID, Company ID, School ID, TIN ID) that must be captured with the Live_Capture_Screen.
- **Digital_Document**: A document format value meaning the tenant will supply an existing digital file (PDF, or a pre-existing digital photo/scan of their ID) via the Upload_Picker_Path.
- **Live_Capture_Screen**: The new in-app camera capture UI (built on `expo-camera`) used for Physical_ID front/back capture, including the guided overlay, real-time quality checks, auto-capture, manual shutter, and retake review.
- **Upload_Picker_Path**: The existing/retained picker-based flow (`expo-image-picker` for images, `expo-document-picker` for PDF) used for Digital_Document front/back capture.
- **ID_Capture_Result**: The persisted value for a single ID side (front or back) in the Verification_Store, shaped as a discriminated union (`{ kind: 'camera' | 'image' | 'file', asset, ... }`) so both paths produce a value the rest of the Verification_Flow can consume identically.
- **Guided_Frame**: The corner-bracket/bounding-box overlay rendered on the Live_Capture_Screen indicating where the tenant should position the ID within the camera viewfinder.
- **Frame_Quality_Check**: The set of real-time heuristics (sharpness/blur, glare, fill ratio) evaluated against the live camera preview to decide whether auto-capture should trigger.
- **Camera_Permission_State**: The `expo-camera` permission status (`granted`, `denied`, `undetermined`) for the device camera, as returned by the permission hook/API.

## Requirements

### Requirement 1: Document Format Selection

**User Story:** As a tenant verifying my identity, I want to declare whether my ID is a physical card or a digital/scanned document, so that the app can guide me through the correct capture method.

#### Acceptance Criteria

1. IF the Verification_Store contains no document format value when step 2 ("Upload Your ID") loads, THEN THE Verification_Flow SHALL present the Document_Format_Selector before rendering the Live_Capture_Screen or Upload_Picker_Path entry points.
2. WHEN the tenant selects "Physical ID" on the Document_Format_Selector, THE Verification_Store SHALL persist a document format value of `physical` for the remainder of the tenant's current verification session.
3. WHEN the tenant selects "Digital Document" on the Document_Format_Selector, THE Verification_Store SHALL persist a document format value of `digital` for the remainder of the tenant's current verification session.
4. WHEN the tenant navigates from step 2 back to step 1 and changes the selected ID without reopening the Document_Format_Selector, THE Verification_Flow SHALL retain the previously chosen document format.
5. WHEN step 2 ("Upload Your ID") loads AND the Verification_Store contains a document format of `physical`, THE Verification_Flow SHALL render the Live_Capture_Screen entry points for the Front of ID and Back of ID fields instead of the Upload_Picker_Path.
6. WHEN step 2 ("Upload Your ID") loads AND the Verification_Store contains a document format of `digital`, THE Verification_Flow SHALL render the Upload_Picker_Path entry points for the Front of ID and Back of ID fields.
7. WHEN the tenant selects a document format on the Document_Format_Selector after a document format value was already persisted for the current verification session, THE Verification_Store SHALL overwrite the previously persisted document format value with the newly selected value.

### Requirement 2: Live Capture for Physical IDs

**User Story:** As a tenant with a physical ID card, I want to take a fresh photo of my ID inside the app, so that my ID photo cannot be an old or manipulated gallery file when it is later compared against my selfie.

#### Acceptance Criteria

1. WHILE the document format is `physical`, THE Verification_Flow SHALL NOT expose a gallery/file picker as an alternative source for the Front of ID or Back of ID fields.
2. WHEN the tenant opens the Live_Capture_Screen for the Front of ID or Back of ID field, THE Live_Capture_Screen SHALL request camera access using `expo-camera` before rendering the camera preview.
3. WHEN the Live_Capture_Screen renders the camera preview, THE Live_Capture_Screen SHALL display a Guided_Frame matching a standard ID card aspect ratio (3.375:2.125, i.e. CR80 card proportions).
4. WHILE the camera preview is active, THE Live_Capture_Screen SHALL continuously evaluate the Frame_Quality_Check against the current preview frame and SHALL visibly indicate to the tenant whether the check is currently passing or failing.
5. WHEN the Frame_Quality_Check passes AND the framed content remains stable for 1 second, THE Live_Capture_Screen SHALL automatically capture a photo.
6. THE Live_Capture_Screen SHALL always display a manual shutter control that captures a photo on tap regardless of the current Frame_Quality_Check result.
7. WHEN a photo is captured on the Live_Capture_Screen, THE Live_Capture_Screen SHALL display the captured image full-screen with a "Retake" action and a "Use Photo" action before the image is committed to the Verification_Store.
8. WHEN the tenant selects "Retake" on the capture review screen, THE Live_Capture_Screen SHALL discard the captured image and return to the camera preview.
9. WHEN the tenant selects "Use Photo" on the capture review screen, THE Verification_Store SHALL store the captured image as the ID_Capture_Result for the corresponding field (front or back).
10. IF the camera fails to initialize or the camera session errors while the Live_Capture_Screen is open, THEN THE Live_Capture_Screen SHALL display an error message and a retry control instead of an unresponsive or blank preview.

### Requirement 3: Camera Permission Handling

**User Story:** As a tenant, I want to understand why the app needs camera access and be able to fix a denied permission, so that I am not stuck without an explanation.

#### Acceptance Criteria

1. IF the Camera_Permission_State is `denied` when the tenant opens the Live_Capture_Screen, THEN THE Live_Capture_Screen SHALL render a visible explanation message describing why camera access is required, along with a visible control to remedy the denial, instead of a blank or crashed screen.
2. WHILE the Camera_Permission_State is `denied`, THE Live_Capture_Screen SHALL display a visible, tappable control that opens the device settings screen for the app.
3. WHEN the tenant grants camera permission after previously denying it and returns to the Live_Capture_Screen, THE Live_Capture_Screen SHALL render the camera preview within 2 seconds of the screen regaining focus, without requiring an app restart.
4. WHEN the tenant opens the Live_Capture_Screen while the Camera_Permission_State is `undetermined`, THE Live_Capture_Screen SHALL request camera permission before attempting to render the camera preview.
5. WHEN the camera permission request triggered by Criterion 4 resolves, THE Live_Capture_Screen SHALL render the camera preview if the resulting Camera_Permission_State is `granted`, or display the denied-state explanation and remedy control described in Criterion 1 if the resulting Camera_Permission_State is `denied`.
6. IF the Camera_Permission_State is `restricted` or otherwise blocked by an OS-level policy when the tenant opens the Live_Capture_Screen, THEN THE Live_Capture_Screen SHALL display an explanation indicating that camera access is blocked by device policy, without offering the device-settings control described in Criterion 2.

### Requirement 4: Upload Path for Digital Documents

**User Story:** As a tenant with only a digital copy or PDF of my ID, I want to upload the existing file instead of being forced to use my camera, so that I don't have to re-photograph a document I already have digitally.

#### Acceptance Criteria

1. WHILE the document format is `digital`, THE Upload_Picker_Path SHALL accept files of type JPG, PNG, or PDF for the Front of ID and Back of ID fields, regardless of whether the file was selected via the image library picker or the document picker.
2. IF the tenant selects a file that is not JPG, PNG, or PDF for the Front of ID or Back of ID field, THEN THE Upload_Picker_Path SHALL reject the file and display an error message stating the file type is unsupported, without updating the Verification_Store.
3. IF the tenant selects a file larger than 5MB for the Front of ID or Back of ID field, THEN THE Upload_Picker_Path SHALL reject the file and display an error message stating the file exceeds the 5MB size limit, without updating the Verification_Store.
4. WHEN the tenant selects a valid JPG, PNG, or PDF file of 5MB or less for the Front of ID or Back of ID field, THE Verification_Store SHALL store the selected file as the ID_Capture_Result for the corresponding field (front or back), replacing any previously stored ID_Capture_Result for that field.
5. WHEN the tenant cancels the image library picker or document picker without selecting a file, THE Upload_Picker_Path SHALL make no change to the Verification_Store and SHALL NOT display an error message.

### Requirement 5: Unified Continue Gating

**User Story:** As a tenant, I want the "Continue to Selfie" button to behave the same way regardless of whether I captured my ID with the camera or uploaded a file, so that the flow feels consistent.

#### Acceptance Criteria

1. THE Verification_Flow SHALL treat an ID_Capture_Result produced by the Live_Capture_Screen and an ID_Capture_Result produced by the Upload_Picker_Path as equivalent for the purpose of gating the "Continue to Selfie" control.
2. WHEN the Verification_Store contains an ID_Capture_Result for both the front and back fields AND the "I confirm..." checkbox is selected, THE Verification_Flow SHALL enable the "Continue to Selfie" control.
3. WHILE the Verification_Store is missing an ID_Capture_Result for the front field, the back field, or both, THE Verification_Flow SHALL keep the "Continue to Selfie" control disabled regardless of the "I confirm..." checkbox state.
4. WHEN the tenant switches the document format after already capturing or uploading one or both ID fields, THE Verification_Flow SHALL clear any existing ID_Capture_Result whose `kind` does not match the newly selected document format (i.e. a `camera`-kind result is cleared when switching to `digital`; an `image`- or `file`-kind result is cleared when switching to `physical`).

### Requirement 6: Visual and Interaction Consistency

**User Story:** As a tenant, I want the new capture screens to look and feel consistent with the rest of the app, so that the verification flow does not feel like a bolted-on experience.

#### Acceptance Criteria

1. THE Live_Capture_Screen and Document_Format_Selector SHALL be styled exclusively using HeroUI Native components and Uniwind utility classes, with no inline style objects or StyleSheet-based styling, consistent with the rest of `apps/mobile`.
2. THE Live_Capture_Screen and Document_Format_Selector SHALL be wrapped with the existing `ScreenWrapper` component for safe-area and keyboard handling, consistent with the other Verification_Flow screens.
3-5. **Out of scope for this feature.** This feature only handles ID capture/document selection and persistence of the ID_Capture_Result in the Verification_Store; no Supabase Storage upload occurs in this workflow. Async upload loading/success/failure UI (originally scoped here) requires a separate upload workflow/spec once an actual upload step is designed, and is not implemented as part of this feature.

## Open Questions and Assumptions

The following gaps in the current codebase required assumptions. Please confirm or correct these before design begins:

1. **No existing camera or blur/glare-detection code exists in `apps/mobile`.** `expo-camera` is not currently a dependency (confirmed via `package.json` and `Podfile.lock` — only `expo-image-picker`, `expo-document-picker`, and `expo-image` are present). This feature will need to add `expo-camera` as a new dependency and add its permission strings/plugin config to `app.json`, which has no camera or photo-library permission strings today (`NSCameraUsageDescription`, `NSPhotoLibraryUsageDescription`, `android.permission.CAMERA` are all currently absent).
2. **No existing camera/location permission-denial UI pattern exists to copy.** I searched for prior art (e.g. a location-permission screen) and found none in `apps/mobile`. Requirement 3's "explain and deep-link to settings" behavior is modeled after common Expo patterns (`Linking.openSettings()`), not an existing in-repo convention — flagging this as a new pattern rather than a reused one.
3. **Document format storage location.** The ground-truth description says to persist the choice "in whatever Zustand store already backs this multi-step flow." That store is `useVerificationStore.ts`. I assumed the new document-format field and any richer `ID_Capture_Result` union type are added directly to `useVerificationStore`, following the `{ kind, asset }` discriminated-union convention already established by `apps/mobile/components/inputs/UploadDocumentField.tsx` (`{ kind: 'image', asset } | { kind: 'file', asset }`), extended with a `'camera'` kind. This is a shape change to `useVerificationStore`'s `frontImages`/`backImages` fields (currently `ImagePicker.ImagePickerAsset[]`) — confirm this is acceptable, since it is a breaking change to that store's existing shape.
4. **Where the Document_Format_Selector lives.** The ground truth allows either step 1 (`select-id.tsx`) or the top of step 2 (`upload-id.tsx`). I've written Requirement 1 to allow either placement per the design phase's decision, since no existing UI in step 1 does anything analogous today.
5. **PDF is listed under Digital_Document, and the codebase has two existing patterns that already handle image+PDF together, neither of which is currently used in `upload-id.tsx`.** `upload-id.tsx` today only uses `UploadImageField` (`ImagePicker.launchImageLibraryAsync` with `mediaTypes: 'images'`), which has no PDF acceptance — there's no PDF path in `upload-id.tsx` today despite the on-screen text claiming "JPG, PNG, or PDF." However, PDF-capable components already exist and are already used elsewhere in the app:
   - `UploadFileField.tsx` (`apps/mobile/components/inputs/UploadFileField.tsx`) defaults its `acceptedTypes` prop to `application/pdf` plus Word doc mime types (`application/msword`, `.wordprocessingml.document`), and is used today in `third-process.tsx` and `edit-main.tsx` **alongside** a separate `UploadImageField` — i.e. two distinct fields, one for image and one for file/PDF, not a combined picker.
   - `UploadDocumentField.tsx` (`apps/mobile/components/inputs/UploadDocumentField.tsx`) is **not** unused — it is already used today in `apps/mobile/app/document-id/upload.tsx`. It combines image-or-file into a single field backed by a `{ kind, asset }` union (`{ kind: 'image', asset } | { kind: 'file', asset }`) and already includes `maxFileSizeMB` (default 5) validation.

   This leaves two viable existing patterns for the design phase to choose between for the Digital_Document picker path in step 2, rather than one obvious choice:
   - **(a) Two separate fields** — `UploadImageField` (JPG/PNG) + `UploadFileField` (PDF), mirroring `third-process.tsx`'s existing usage. This would require restricting `UploadFileField`'s `acceptedTypes` to PDF-only (dropping the Word doc mime types) for the ID use case, and adding size validation to `UploadFileField`, which currently has none.
   - **(b) One combined field** — `UploadDocumentField` (image-or-file via the `{ kind, asset }` union), mirroring `document-id/upload.tsx`'s existing usage. This already has size validation built in and already matches the `{ kind, asset }` convention referenced in the Glossary/Introduction, but would need its `ACCEPTED_FILE_TYPES` restricted to PDF-only (dropping Word doc types) for the ID use case.

   I've flagged this as an open decision for the design phase rather than assuming either pattern.
6. **`UploadFileField.tsx` has no client-side file-size validation at all** (no `maxFileSizeMB` equivalent or any size check), regardless of which picker pattern above is chosen. `UploadDocumentField.tsx` already has `maxFileSizeMB` (default 5) validation built in. If pattern (a) above (two separate fields) is chosen for the design, size validation would need to be added to `UploadFileField`; if pattern (b) (combined field) is chosen, the existing `UploadDocumentField` validation can likely be reused as-is. Either way, Requirement 4's size/type validation is new behavior for `upload-id.tsx` specifically, since that screen currently uses neither component.
7. **Selfie/liveness match logic (step 3, `upload-selfie.tsx`) is out of scope. Upload of the ID_Capture_Result to Supabase Storage is now explicitly descoped as Requirement 6, Acceptance Criteria 3-5 (formalized below, not merely an open question).** Per `docs/verification-backend-cons.md` (B2), `expo-camera` is not installed anywhere and `upload-selfie.tsx` currently just shows a static sample image with no real capture or face-match logic. This spec only covers step 2 (ID capture); actual liveness/face-match against the ID photo is not addressed by these requirements. Uploading either path's result to Supabase Storage — including the async loading/success/failure UI that would accompany it — is formally out of scope for this feature per Requirement 6.3-6.5, and is deferred to a separate upload workflow/spec once an actual upload step is designed.
8. **Which specific IDs count as "Physical_ID" vs allowing digital copies of any ID.** The ground truth's examples (driver's license, UMID, "physical national ID card") map cleanly onto entries in `VALID_IDS`/`SECONDARY_IDS` (`packages/constants/src/user/valid-ids.ts`), but the two lists don't inherently separate "always physical" from "can be digital." I've modeled Physical_ID/Digital_Document as a tenant-declared format choice (Requirement 1) rather than a hardcoded mapping from the selected ID type, since e.g. a Passport or School ID could plausibly be presented either way. Confirm whether specific ID types should force one path (e.g. PDF should never be offered for a Driver's License).
