# Android app updates (sideloaded APK)

APT ships to Android as an APK outside the Play Store, so installed apps learn about new builds from the `app_releases` table instead of a store.

## How it works
- `public.app_releases` holds one row per platform (`android` only): `latest_version`, `min_version`, `apk_url`, `release_notes`. Anyone, signed out included, can read the six public columns; only `admin_publish_app_release()` writes (admin second step required).
- The admin page **App updates** (`/admin/app-updates`) lists the **Release history** as a full-width table; the **Publish release** button opens the form in a modal (prefilled with the live release) and edits that row. Beside the table, three cards: **Live release** (versions, who published it, a copyable link and a server-side check that the link really downloads, via `lib/app-release-link.ts`, which only follows public https hosts), **What users see** (miniatures of the dialog and the blocking screen) and **Release checklist** (the build and upload commands for the next version). Every publish that changes a value is appended to `public.app_release_history` (admin-only; re-saving the live values adds nothing), and the newest entry is marked Current.
- On launch and on foreground, mobile's `AppUpdateGate` (mounted in `app/_layout.tsx`) compares `expo.version` from `app.config.js` with the row, using `getAppUpdateStatus` from `@repo/utils`:
  - below `min_version` → full-screen **Update required** (blocks the app);
  - below `latest_version` → dismissible dialog; "Maybe later" is remembered per device for that version only;
  - otherwise nothing. A failed check or unreadable version never blocks anyone.
- The Update button opens `apk_url` (https only) in the browser; the user installs over the existing app. Android asks once to allow installs from the browser.

## Releasing a new build
1. Bump `version` in `apps/mobile/app.config.js` (`major.minor.patch`). EAS raises the Android `versionCode` automatically (`autoIncrement`, remote versioning).
2. `eas build --platform android --profile production` (the profile builds an APK, not an AAB).
3. Attach the APK to a GitHub release under the **same file name every time**, so `https://github.com/<owner>/<repo>/releases/latest/download/<file>.apk` never changes.
4. In Admin → App updates, set the new latest version (and the required version only for breaking changes), the link and the notes, then publish.

## Rules that keep updates installable
- Always sign with the same keystore (EAS manages it). A different signature makes Android refuse the update.
- `versionCode` must increase on every build.
- Keep `min_version` at or below `latest_version` (the database enforces it).
- JS-only changes could later ship through EAS Update; native changes always need a new APK.

## Over-the-air updates (EAS Update)
From 1.2.0 the app can also receive **JavaScript-only** fixes without a new APK. Use the APK flow above for anything native.

| Change | Ship it with |
|---|---|
| Screens, logic, styles, images, copy | OTA: `pnpm --filter mobile ota "What changed"` |
| New native package, Expo SDK upgrade, permissions, `google-services.json`, the Google Maps key, `app.config.js` native fields | New APK + the update prompt |

- **Setup:** `expo-updates`, `runtimeVersion: { policy: 'fingerprint' }` and the update URL live in `apps/mobile/app.config.js`; each EAS build profile has a `channel` of the same name (`development`, `preview`, `production`). The fingerprint is a hash of the native parts of the app, so an update only reaches builds it can run on. Editing `eas.json` or any native config changes it, which means a new APK first.
- **Publishing:** `pnpm --filter mobile ota "message"` runs `eas update --channel production --environment production --message ...`. **Always keep `--environment production`:** `EXPO_PUBLIC_*` values (Supabase URL and key, Giphy, Maps) are baked into the update when it is exported, and the `.env` file is not available to EAS. Publish a database migration before an update that depends on it, because old and new code run side by side.
- **On the phone:** expo-updates checks at launch and applies the download on the next launch. `useOtaUpdate` also checks when the app returns to the foreground (at most every 15 minutes) and `OtaUpdateGate` offers **Restart now** / **Later** once an update is downloaded. Development builds have updates turned off.
- **Which code is running:** Settings → About shows `Built-in code · production` for a fresh install or `Update 1a2b3c4d · production` once an OTA is active. The version number there is the APK's `version`, which an OTA never changes, so the Android update prompt keeps working as before.
- **Rollback:** `npx eas-cli update:rollback` (or republish the previous update). Apps fall back to the code bundled in their APK.
- **Access:** anyone with Expo access to the project can publish code to every phone, so keep that list short.
- **First time only:** users need an APK that contains `expo-updates` (1.2.0 or later) before they can receive any OTA, so 1.2.0 is the last release that has to be installed by hand for JS-only changes.
