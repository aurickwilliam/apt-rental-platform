# Mobile App Size Reduction

## Goal

Reduce the Android app download and install size from the current **229 MB APK** to roughly **35–45 MB** without removing user-facing features, while keeping iOS lean as a side effect. The work is staged so each tier can be built, measured, and reverted independently.

## Implementation status

Implemented on branch `refactor/reduce-file-size` (not yet built as an APK):

- **Tier 1:** `expo-build-properties` with `buildArchs: ["arm64-v8a"]`, R8 minify, resource shrinking and `useLegacyPackaging`. Changed from the first draft: the architecture list is the same for every build, never read from `EAS_BUILD_PROFILE`, because the OTA fingerprint hashes it and `eas update` runs outside a build profile (the fingerprint is identical with and without `EAS_BUILD_PROFILE`). The Android emulator needs an arm64 image.
- **Tier 2:** MapLibre removed (no-key map shows a "Map unavailable" card), `react-native-pdf-thumbnail` replaces `react-native-pdf`/`react-native-blob-util`, and the 7 unused packages are gone.
- **Tier 3:** 13 bundled images converted to WebP (onboarding 5.3 MB → 0.36 MB). Three payment logos stayed PNG because WebP was larger. Font subsetting was skipped (`pyftsubset` not installed).
- **Tier 4:** `babel-plugins/tabler-per-icon.js`. Measured with `expo export`: Hermes bundle 14.6 MB → 9.7 MB, Tabler modules 6,189 → 236. `babel.config.js` uses `api.cache.using(...)` (the draft's `api.env('test')` throws after `api.cache(true)`).
- **Still to do:** build a `preview` APK, record the size, and run the device smoke tests below (R8 behaviour, QR scan, GIFs, PDF previews, receipt save, notifications, OTA).

## Current state and measurements

Measured from `apps/mobile/build-preview.apk` (229,263,536 bytes = 229 MB / 218.6 MiB), the current universal preview APK breaks down as follows.

| Part | APK size | Notes |
|---|---|---|
| Native libraries (`lib/`) | **168.9 MiB (77%)** | Four CPU architectures, stored uncompressed |
| `classes*.dex` | 22.2 MiB compressed (61.3 MiB raw) | R8/minification disabled |
| JS bundle + assets | 14.8 MiB | 14.6 MB Hermes bundle, stored uncompressed |
| Android resources (`res/`) | 9.0 MiB | PNGs + fonts |
| Other | 2.4 MiB | Manifest, metadata, etc. |

Per-architecture native libraries:

| ABI | Size |
|---|---|
| `arm64-v8a` | 44.3 MiB |
| `x86_64` | 47.1 MiB |
| `x86` | 46.7 MiB |
| `armeabi-v7a` | 30.8 MiB |

About **125 MiB** is code for architectures a given phone never uses.

Heaviest `arm64-v8a` libraries:

| Library | Size | Source |
|---|---|---|
| `libmaplibre.so` | 11.1 MB | `@maplibre/maplibre-react-native` |
| `libreactnative.so` | 6.7 MB | React Native |
| `libbarhopper_v3.so` | 4.7 MB | ML Kit barcode (expo-camera QR scan) |
| `libpdfium.so` + `libpdfiumandroid.so` | 5.0 MB | `react-native-pdf` |
| `libappmodules.so` | 2.9 MB | Expo modules |
| `libhermesvm.so` | 2.4 MB | Hermes |

Other findings:

- **JS bundle:** 14.6 MB (`dist/_expo/static/js/android/*.hbc`). The Metro source map contains **6,189 `@tabler/icons-react-native` modules**, while the app uses **177 unique icons**. The barrel import (`import { IconX } from '@tabler/icons-react-native'`) pulls the whole icon set because Metro does not tree-shake. Tabler accounts for roughly **25% of bundle mappings (~3–4 MB)**.
- **Bundled images:** onboarding PNGs are **5.2 MB** for four images; sample IDs/documents/payment logos add ~2.4 MB. WebP tests: onboarding 5.2 MB → ~0.38 MB, samples/logos 2.39 MB → 0.735 MB.
- **Fonts:** 1.5 MB (Inter × 3, Nunito × 4). `@expo-google-fonts/material-symbols` adds 0.92 MB and `@expo/vector-icons` Ionicons adds 0.37 MB, both pulled transitively by `expo-router` / `expo-symbols`; they are not removable without patching Expo Router.
- **Unused native packages:** `react-native-linear-gradient`, `@miblanchard/react-native-slider`, `@react-native-community/slider`, `@ptomasroos/react-native-multi-slider`, `react-native-awesome-gallery`, `react-native-webview`, `expo-device-hub` have no production imports.
- **Not the cause:** `expo-dev-client` is **not** in the release APK; the `dist/` source map (30 MB) is not shipped to devices; `android/` and `ios/` folders are local build caches.

## Scope and decisions

- **Android first**, with the same dependency/asset removals benefiting iOS.
- **arm64-only** APKs for every Android build, with one fixed architecture list so the OTA fingerprint never depends on the build environment. x86 emulators and 32-bit devices are explicitly not supported.
- **Remove MapLibre** (`@maplibre/maplibre-react-native`). The OpenStreetMap fallback only runs when the Google Maps key is absent; production builds already require the key. Replace the fallback with a simple “map unavailable” card that links to Google Maps.
- **Replace `react-native-pdf` with `react-native-pdf-thumbnail`** for first-page PDF previews. Remove `react-native-pdf` and `react-native-blob-util`. The new library uses Android’s `PdfRenderer` and iOS PDFKit instead of bundling PDFium. Remote signed PDFs must be downloaded to the cache with `expo-file-system` before thumbnail generation; verify the library’s API during implementation.
- **Remove unused packages** listed above.
- **Convert bundled images to WebP** with `cwebp` at quality ~80, keeping transparency and updating `require()` paths.
- **Per-icon Tabler imports** through a small Babel plugin that rewrites named imports to the package’s `./*` subpath exports. Skip the plugin when `api.env('test')` so existing `jest.mock('@tabler/icons-react-native')` mocks keep working.
- **Do not edit `android/` or `ios/` directly.** They are generated and gitignored. Build settings go through `expo-build-properties` in `app.config.js`.
- **Do not remove** `@expo/vector-icons` or `expo-symbols` (transitive via `expo-router`; removal would break the build for ~1.3 MB) or `expo-dev-client` (already absent from release APKs).
- **Defer `enableBundleCompression`** until cold-start time is measured; it trades a smaller APK for a slower first launch.

## Implementation plan

### Tier 1 — Build configuration (biggest win, no app code)

1. **Install the build-properties plugin.**
   - Run `npx expo install expo-build-properties` in `apps/mobile` so the SDK-compatible version is selected.
   - Add the plugin to `apps/mobile/app.config.js`.

2. **Build one architecture for shipping profiles.**
   - Set `android.buildArchs: ["arm64-v8a"]` in `expo-build-properties`, identically for every build profile (see Implementation status).

3. **Enable release code and resource shrinking.**
   - `enableMinifyInReleaseBuilds: true`
   - `enableShrinkResourcesInReleaseBuilds: true`
   - Add `extraProguardRules` only if a library needs them after testing.

4. **Compress native libraries in the APK.**
   - `useLegacyPackaging: true`
   - This stores the `.so` files deflated instead of uncompressed. Measured compression ratios: MapLibre 32%, React Native 33%, Expo app modules 20%, PDFium 52%, ML Kit barcode 42%. Install time increases slightly; runtime loading is unchanged.

5. **Build and measure before continuing.**
   - Build a `preview` APK on EAS (or a local release build).
   - Compare `unzip -v build-preview.apk` totals by category and per ABI.
   - Smoke-test sign-in, map search, QR scan, chat GIFs, PDF preview, receipt save, notifications, and an OTA update.
   - Only then evaluate `enableBundleCompression: true` against cold-start time.

**Expected after Tier 1:** ~45–55 MB APK.

### Tier 2 — Remove heavy native modules and unused packages

6. **Remove MapLibre.**
   - Delete `components/maps/MapLibreFallbackView.tsx`.
   - In `app/apartment/[apartmentId]/map-view.tsx`, replace the `useGoogle === false` branch with a card that explains the map is unavailable and opens the location in Google Maps.
   - Remove the `@maplibre/maplibre-react-native` config plugin from `app.config.js` and the dependency from `package.json`.
   - Keep `react-native-maps` (Google Maps) as the only native map implementation.

7. **Replace PDF thumbnails.**
   - Add `react-native-pdf-thumbnail`.
   - Rework `components/display/PdfThumbnail.tsx`:
     - Download remote signed PDFs to `expo-file-system` cache.
     - Generate the first-page thumbnail with `react-native-pdf-thumbnail`.
     - Render the result with `expo-image`, keeping the existing file-icon fallback while loading or on failure.
     - Handle unmount and account changes so a late thumbnail write cannot update a retired screen.
   - Remove `react-native-pdf` and `react-native-blob-util`.
   - Update `PdfThumbnail` tests and the document card/row tests that mock the old module.

8. **Remove unused packages.**
   - `react-native-linear-gradient`, `@miblanchard/react-native-slider`, `@react-native-community/slider`, `@ptomasroos/react-native-multi-slider`, `react-native-awesome-gallery`, `react-native-webview`, `expo-device-hub`.
   - Run `pnpm install` and verify no imports remain.

9. **Build, measure, and smoke-test again.**
   - Confirm maps, PDF previews, documents, chat GIFs, and settings screens.
   - Run `pnpm --filter mobile test`, `lint`, and `typecheck`.

**Expected after Tier 2:** ~35–45 MB APK.

### Tier 3 — Optimize bundled assets

10. **Convert bundled images to WebP.**
    - Onboarding: `constants/onboarding-data/onboarding-data.ts` (4 PNGs, 5.2 MB → ~0.38 MB).
    - Sample IDs/documents and payment/third-party logos: `constants/images.ts` (2.39 MB → ~0.74 MB).
    - Use `cwebp -q 80` (or 85 for logos), preserve transparency, and keep the original pixel dimensions unless a screen needs smaller images.
    - Update `require()` paths and any tests that assert asset names.
    - `expo.webp.enabled` is already on; verify Android decode on a device.

11. **Optional: subset fonts.**
    - Subset Inter and Nunito to Latin, Latin-1 Supplement, Latin Extended-A, currency symbols, and punctuation using `pyftsubset`.
    - Keep the peso sign (₱), `ñ`, and accented names; verify on the sign-up, profile, and payment screens.
    - Target ~1.5 MB → ~0.7 MB. Skip if glyph coverage cannot be verified.

**Expected after Tier 3:** ~30–40 MB APK.

### Tier 4 — Shrink the JS bundle

12. **Rewrite Tabler imports per icon at build time.**
    - Add a small Babel plugin (for example `apps/mobile/babel-plugins/tabler-per-icon.js`) that converts:
      - `import { IconChevronLeft, IconMap } from "@tabler/icons-react-native"`
      - to default imports from `@tabler/icons-react-native/IconChevronLeft` and `/IconMap`.
    - Preserve type-only imports and skip the transform when `api.env("test")`.
    - Keep `react-native-reanimated/plugin` last in `babel.config.js`.
    - Confirm Metro resolves the package’s `./*` subpath exports (`unstable_enablePackageExports` is on in Metro 0.84).
    - Verify the bundle no longer contains unused icon modules and that the existing icon mocks still pass.

13. **Build, measure, and finish.**
    - Compare the Hermes bundle size before/after (target 14.6 MB → ~11 MB).
    - Confirm OTA update payload size drops as well.
    - Run the full mobile verification suite.

**Expected final:** ~35–45 MB APK (from 229 MB), installed ~70–100 MB.

## Verification

- After each tier, build a fresh `preview` APK and record:
  - Total APK size.
  - `unzip -v` totals for `lib/`, `classes*.dex`, `assets/`, `res/`, and other.
  - Per-ABI `lib/` totals.
- Smoke-test on a physical Android device:
  - Sign-in, profile, and Passport.
  - Map search and the apartment map.
  - QR scan in verification.
  - Chat text, images, GIFs, and reactions.
  - PDF/document previews and uploads.
  - Payment checkout, receipt save, and notifications.
  - OTA update check and restart.
- Run:
  - `pnpm --filter mobile test`
  - `pnpm --filter mobile lint`
  - `pnpm --filter mobile typecheck`
  - `pnpm --filter mobile exec jest --runInBand` for the CI-style run.
- Native changes change the OTA fingerprint, so a new APK is required after each native tier. That is expected and should be called out in the release notes.

## Acceptance criteria

- The production/preview APK is arm64-only and materially smaller than 229 MB (target ~35–45 MB).
- The app installs and runs on a physical arm64 Android device with no missing native module errors.
- Maps, QR scanning, chat GIFs, PDF previews, receipt saving, notifications, and OTA updates still work.
- No unused Tabler icon modules remain in the production bundle.
- The mobile test, lint, and typecheck suites pass; unrelated pre-existing failures are reported separately.
- `AGENTS.md` / `DESIGN.md` are updated only if a durable convention or user-facing behavior actually changes.

## Risks and rollback

- **R8 can break reflection-based libraries.** Test every native feature after Tier 1. If a library fails, add its consumer ProGuard rules via `extraProguardRules` or temporarily disable minification for that build.
- **arm64-only excludes 32-bit devices.** Confirmed acceptable. If that changes, build a second `armeabi-v7a` APK or restore the universal APK.
- **Removing MapLibre changes the no-key fallback.** Local development without a Google Maps key will show the placeholder instead of OpenStreetMap tiles.
- **PDF thumbnail replacement needs a local file.** Downloading signed PDFs to cache adds a step; verify caching, cleanup, and account-change behavior.
- **WebP requires updating every `require()` path.** Missing one asset shows a bundling error at build time, not a silent runtime failure.
- **`useLegacyPackaging` / `enableBundleCompression` trade install or first-launch time for size.** Measure cold start; skip bundle compression if the regression is noticeable.
- **Each tier is independently revertible.** Revert the `expo-build-properties` block, dependency removals, asset conversions, or Babel plugin without affecting the other tiers.
