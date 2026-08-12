# Requirements Document

## Introduction

The mobile account verification flow (`apps/mobile/app/(auth)/verify-account/`) previously branched step 2 ("Upload Your ID") into a tenant-declared "Physical ID" (live camera capture) vs. "Digital Document" (gallery/file picker) choice. That branch, and the format-selection step that drove it, is removed by this revision.

The new flow is **camera-first and format-less**: after the tenant taps an ID on step 1 ("Select a Valid ID"), step 2 immediately opens live, in-app camera capture for the first required image of that ID — there is no intermediate screen asking the tenant to choose a format, and no gallery/file picker is ever offered as an alternative source. This preserves the original motivation for introducing live capture in the first place (step 3 performs a selfie/liveness comparison against the ID photo, which a gallery file could undermine) by making camera capture the *only* path, rather than one of two paths the tenant must first choose between.

This is a product pivot away from the prior iteration of this feature (see the previous revision of this document in version control for the removed Physical ID / Digital Document design), not an extension of it. The camera capture mechanics themselves — permission handling, the CR80 guided frame for card-shaped IDs, quality heuristics, auto-capture, manual shutter, and the retake/review step — are carried over unchanged from the prior implementation; only the format branch and the picker path are removed, and the capture sequence is generalized to support IDs that require more than two captures, exactly two captures, or a single capture, rather than hardcoding "front and back" as the only shape.

Requirements 6.3-6.5 (Supabase Storage upload UI) remain explicitly out of scope, as in the prior revision — this feature is ID selection → camera capture → completed ID summary and authenticity confirmation → selfie preparation (`selfie-prep.tsx`) → existing selfie step (`upload-selfie.tsx`); no Supabase Storage upload occurs in this workflow.

## Glossary

- **Verification_Flow**: The in-app flow under `apps/mobile/app/(auth)/verify-account/` (`select-id` → `upload-id` → `selfie-prep` → `upload-selfie` → `success`/`failed`) that collects a tenant's ID and selfie for identity verification.
- **Selfie_Preparation_Screen**: The mandatory illustrated screen (`selfie-prep.tsx`) shown after completed ID review and before `upload-selfie.tsx`, explaining selfie-capture readiness requirements.
- **Verification_Store**: The Zustand store at `apps/mobile/stores/useVerificationStore.ts` that holds `selectedId` and the per-ID capture progress for the Verification_Flow.
- **Selected_Id_Type**: The ID type string the tenant chose on step 1 (`select-id.tsx`), one of the values in `VALID_IDS`/`SECONDARY_IDS` (`packages/constants/src/user/valid-ids.ts`).
- **Capture_Sequence**: The ordered list of required capture steps for a given Selected_Id_Type (e.g. `["front", "back"]` for a card-style ID, or a single step for a booklet-style ID), each with a label (e.g. "Front", "Back", "Identity Page") and a guided-frame aspect ratio.
- **Capture_Step**: A single entry in a Capture_Sequence (e.g. "front" or "back") that the tenant must photograph before the Capture_Sequence is complete.
- **Live_Capture_Screen**: The in-app camera capture UI (built on `expo-camera`) used for every Capture_Step, including the guided overlay, real-time quality checks, auto-capture, manual shutter, and retake/review.
- **Id_Capture_Result**: The persisted value for a single completed Capture_Step in the Verification_Store, representing the camera-captured image (uri, width, height).
- **Guided_Frame**: The corner-bracket/bounding-box overlay rendered on the Live_Capture_Screen indicating where the tenant should position the ID within the camera viewfinder, sized to a Capture_Step's configured aspect ratio.
- **Frame_Quality_Check**: The set of real-time heuristics (sharpness/blur, glare, fill ratio) evaluated against the live camera preview to decide whether auto-capture should trigger.
- **Camera_Permission_State**: The `expo-camera` permission status (`granted`, `denied`, `restricted`, `undetermined`) for the device camera, as returned by the permission hook/API.

## Requirements

### Requirement 1: Immediate Camera Entry on ID Selection

**User Story:** As a tenant verifying my identity, I want the app to open my camera as soon as I pick my ID type, so that I can start capturing my ID immediately without an extra format decision getting in my way.

#### Acceptance Criteria

1. WHEN the tenant selects an ID on step 1 (`select-id.tsx`), THE Verification_Flow SHALL navigate directly to the Live_Capture_Screen for the first Capture_Step of that Selected_Id_Type, without rendering an intermediate format-selection screen.
2. THE Verification_Flow SHALL NOT present the tenant with a choice between a physical/card format and a digital/document format at any point in the Verification_Flow.
3. THE Verification_Flow SHALL NOT render a gallery picker, a file picker, a "Choose photo" control, or a "Choose file" control at any point in the ID-capture portion of the Verification_Flow.
4. WHEN step 2 (`upload-id.tsx`) is focused AND the Verification_Store contains a Selected_Id_Type with one or more incomplete Capture_Steps, THE Verification_Flow SHALL navigate to the first incomplete Capture_Step's Live_Capture_Screen without presenting a manual capture control.

### Requirement 2: Capture Sequence Progression

**User Story:** As a tenant with an ID that may require more than one photo, I want the app to guide me through each required photo one at a time, so that I know exactly what is left before I can continue.

#### Acceptance Criteria

1. THE Verification_Flow SHALL determine the Capture_Sequence for the tenant's Selected_Id_Type as an ordered list of one or more Capture_Steps.
2. WHEN the tenant completes a Capture_Step by selecting "Use Photo" on the Live_Capture_Screen, THE Verification_Store SHALL persist an Id_Capture_Result for that Capture_Step. IF another Capture_Step remains in the sequence, THE Verification_Flow SHALL immediately open that next Capture_Step's Live_Capture_Screen; OTHERWISE, it SHALL return to step 2 (`upload-id.tsx`).
3. WHILE the Capture_Sequence for the Selected_Id_Type has at least one Capture_Step without a persisted Id_Capture_Result, THE Verification_Flow SHALL keep the "Continue to Selfie" control disabled.
4. WHEN every Capture_Step in the Capture_Sequence for the Selected_Id_Type has a persisted Id_Capture_Result, THE Verification_Flow SHALL render a read-only step 2 summary with labeled previews of each capture and the authenticity declaration: "I confirm that the submitted ID is authentic, valid, and belongs to me."
5. WHEN every Capture_Step has a persisted Id_Capture_Result AND the tenant selects the authenticity declaration checkbox, THE Verification_Flow SHALL enable the "Continue to Selfie" control.
6. WHEN step 2 (`upload-id.tsx`) is focused AND the Verification_Store contains one or more, but not all, Capture_Steps for the Selected_Id_Type, THE Verification_Flow SHALL navigate to the first missing Capture_Step without attempting navigation while step 2 is inactive beneath a Live_Capture_Screen.
7. WHEN every Capture_Step is complete, THE Verification_Flow SHALL provide a "Retake ID Photos" action. WHEN selected, it SHALL clear every persisted Id_Capture_Result in the selected ID's Capture_Sequence, reset the authenticity declaration, and reopen the first Capture_Step. THE action SHALL preserve the Selected_Id_Type and any captures outside that Capture_Sequence.
8. WHEN every Capture_Step is complete, the authenticity declaration is selected, and the tenant selects "Continue to Selfie", THE Verification_Flow SHALL open the Selfie_Preparation_Screen before `upload-selfie.tsx`. THE Selfie_Preparation_Screen SHALL not offer a skip action; it SHALL illustrate and explain that the tenant must remove glasses, hats, and face coverings, use bright even lighting, and keep their full face visible. Selecting "I'm Ready" SHALL open `upload-selfie.tsx`.

### Requirement 3: Live Capture

**User Story:** As a tenant, I want to take a fresh photo of my ID inside the app for each required step, so that my ID photos cannot be old or manipulated gallery files when later compared against my selfie.

#### Acceptance Criteria

1. WHEN the tenant opens the Live_Capture_Screen for a Capture_Step, THE Live_Capture_Screen SHALL request camera access using `expo-camera` before rendering the camera preview.
2. WHEN the Live_Capture_Screen renders the camera preview, THE Live_Capture_Screen SHALL display a Guided_Frame matching the aspect ratio configured for the current Capture_Step.
3. WHILE the camera preview is active, THE Live_Capture_Screen SHALL continuously evaluate the Frame_Quality_Check against the current preview frame and SHALL visibly indicate to the tenant whether the check is currently passing or failing.
4. WHEN the Frame_Quality_Check passes AND the framed content remains stable for 1 second, THE Live_Capture_Screen SHALL automatically capture a photo.
5. THE Live_Capture_Screen SHALL always display a manual shutter control that captures a photo on tap regardless of the current Frame_Quality_Check result.
6. WHEN a photo is captured on the Live_Capture_Screen, THE Live_Capture_Screen SHALL display the captured image full-screen with a "Retake" action and a "Use Photo" action before the image is committed to the Verification_Store.
7. WHEN the tenant selects "Retake" on the capture review screen, THE Live_Capture_Screen SHALL discard the captured image and return to the camera preview for the same Capture_Step.
8. WHEN the tenant selects "Use Photo" on the capture review screen, THE Verification_Store SHALL store the captured image as the Id_Capture_Result for the current Capture_Step.
9. IF the camera fails to initialize or the camera session errors while the Live_Capture_Screen is open, THEN THE Live_Capture_Screen SHALL display an error message and a retry control instead of an unresponsive or blank preview.
10. WHEN the active Capture_Step is Selfie, THE Live_Capture_Screen SHALL use the front-facing device camera and a circular Guided_Frame with a success-status border. All ID-document Capture_Steps SHALL continue using the rear-facing device camera and rectangular Guided_Frame. THE captured selfie SHALL retain its original camera dimensions rather than being cropped to the circular guide.

### Requirement 4: Camera Permission Handling

**User Story:** As a tenant, I want to understand why the app needs camera access and be able to fix a denied permission, so that I am not stuck without an explanation.

#### Acceptance Criteria

1. IF the Camera_Permission_State is `denied` when the tenant opens the Live_Capture_Screen, THEN THE Live_Capture_Screen SHALL render a visible explanation message describing why camera access is required, along with a visible control to remedy the denial, instead of a blank or crashed screen.
2. WHILE the Camera_Permission_State is `denied`, THE Live_Capture_Screen SHALL display a visible, tappable control that opens the device settings screen for the app.
3. WHEN the tenant grants camera permission after previously denying it and returns to the Live_Capture_Screen, THE Live_Capture_Screen SHALL render the camera preview within 2 seconds of the screen regaining focus, without requiring an app restart.
4. WHEN the tenant opens the Live_Capture_Screen while the Camera_Permission_State is `undetermined`, THE Live_Capture_Screen SHALL request camera permission before attempting to render the camera preview.
5. WHEN the camera permission request triggered by Criterion 4 resolves, THE Live_Capture_Screen SHALL render the camera preview if the resulting Camera_Permission_State is `granted`, or display the denied-state explanation and remedy control described in Criterion 1 if the resulting Camera_Permission_State is `denied`.
6. IF the Camera_Permission_State is `restricted` when the tenant opens the Live_Capture_Screen, THEN THE Live_Capture_Screen SHALL display an explanation indicating that camera access is blocked by device policy, without offering the device-settings control described in Criterion 2.

### Requirement 5: Visual and Interaction Consistency

**User Story:** As a tenant, I want the capture and review screens to look and feel consistent with the rest of the app, so that the verification flow does not feel like a bolted-on experience.

#### Acceptance Criteria

1. THE Live_Capture_Screen and step 2 review screen SHALL be styled exclusively using HeroUI Native components and Uniwind utility classes, with no inline style objects or StyleSheet-based styling, consistent with the rest of `apps/mobile`.
2. THE Live_Capture_Screen, Selfie_Preparation_Screen, and step 2 review screen SHALL be wrapped with the existing `ScreenWrapper` component for safe-area and keyboard handling, consistent with the other Verification_Flow screens.
3. THE Selfie_Preparation_Screen SHALL use HeroUI Native controls, Uniwind utility classes, existing Tabler Native icons, and canonical theme tokens; it SHALL provide accessible text alongside its success-status illustration.
4-6. **Out of scope for this feature.** This feature only handles ID capture and persistence of the Id_Capture_Result in the Verification_Store; no Supabase Storage upload occurs in this workflow. Async upload loading/success/failure UI (originally scoped here) requires a separate upload workflow/spec once an actual upload step is designed, and is not implemented as part of this feature.

## Resolved Product Decisions

The following product decisions were previously tracked as open questions/assumptions in earlier revisions of this document. They are now confirmed and are recorded here for historical traceability; none of them remain open.

1. **Passport Capture_Sequence and Guided_Frame aspect ratio are confirmed.**
   - **Capture-step count for Passport.** Passport's Capture_Sequence consists of exactly one Capture_Step: the identity/photo page (`identity-page` / "Identity Page"). The tenant does not capture the passport's cover, back cover, blank pages, visa pages, or any additional pages — only the identity/photo page is captured. This is a confirmed product decision, not an assumption.
   - **Guided-frame aspect ratio for Passport.** The Passport Capture_Step's Guided_Frame aspect ratio is confirmed as 125/88 ≈ 1.42, derived from the ICAO Doc 9303 TD3 booklet page dimensions (approximately 125mm x 88mm), and is treated as the target aspect ratio for the passport identity/photo page. THE design SHALL keep the Passport aspect ratio as a single, explicitly named, overridable constant (not inlined into any sequence literal), so that this constant may be revised in the future without any architectural change to the capture-sequence mechanism, the Guided_Frame geometry, or any consuming screen. This is a durable engineering constraint on the design, independent of the value's confirmed status.
2. **Standard card-style Capture_Sequence for all non-Passport IDs is confirmed.** All twelve non-Passport supported ID types — Driver's License, National ID/PhilID, UMID Card, PRC ID, SSS Card, Voter's ID, Postal ID, Senior Citizen ID, PWD ID, Company ID, School ID, and TIN ID (spanning both primary and secondary IDs) — use the standard two-step Front + Back Capture_Sequence with the CR80 aspect ratio. This applies uniformly across all twelve, with no per-ID special-casing. (`VALID_IDS` plus `SECONDARY_IDS` in `packages/constants/src/user/valid-ids.ts` total thirteen supported ID types; Passport is one of the thirteen, so twelve are non-Passport.)
3. **The Selected_Id_Type → Capture_Sequence mapping content is confirmed.** The mapping introduced by Requirement 2.1 is confirmed as: Passport maps to the single-step identity-page sequence described in item 1 above; every other current `VALID_IDS`/`SECONDARY_IDS` entry maps to the standard front/back, CR80-ratio sequence described in item 2 above.
