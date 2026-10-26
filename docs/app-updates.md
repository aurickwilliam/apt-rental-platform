# Android app updates (sideloaded APK)

APT ships to Android as an APK outside the Play Store, so installed apps learn about new builds from the `app_releases` table instead of a store.

## How it works
- `public.app_releases` holds one row per platform (`android` only): `latest_version`, `min_version`, `apk_url`, `release_notes`. Anyone, signed out included, can read the six public columns; only `admin_publish_app_release()` writes (admin second step required).
- The admin page **App updates** (`/admin/app-updates`) lists the **Release history** as a full-width table; the **Publish release** button opens the form in a modal (prefilled with the live release) and edits that row. Every publish that changes a value is appended to `public.app_release_history` (admin-only; re-saving the live values adds nothing), and the newest entry is marked Current.
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
