# iOS Push Notifications — Status & Enablement Note

Companion note for the notification work in `apps/mobile`. Captures the current
state of push delivery across platforms and the remaining steps to enable push
on iOS (2026-08).

---

## Current status

### Working

- **In-app banner toasts** (both platforms): realtime-driven, preference-gated,
  deep-link tap handling — see `hooks/notifications/useInAppNotificationBanner.tsx`
  and `hooks/notifications/useNotificationTapHandler.tsx` (wired in `app/_layout.tsx`).
- **Android push**: token registration (`hooks/notifications/usePushRegistration.ts`),
  `push_tokens` upsert, `push-notify` edge function delivery, foreground
  suppression handler (OS banner suppressed while app is open; in-app toast
  handles the visible banner). Verified on the Android emulator dev client.

### Not yet working

- **iOS push**: the client implementation is complete and correct
  (`usePushRegistration` requests permission, registers the Expo token, and
  no-ops on simulators — `Platform.OS === "ios" && !Device.isDevice` guard), but
  it has never run on a real device.

## Why iOS push isn't delivering yet

1. **No iOS device build exists** — `apps/mobile/eas.json` `development` profile
   has `"ios": { "simulator": true }`, so every iOS dev build targets the
   simulator, where Expo push cannot deliver.
2. **No APNs Auth Key** in EAS credentials — EAS adds the `aps-environment`
   entitlement automatically once an APNs key is configured for the project.
3. The local `apps/mobile/ios/` directory is untracked with an empty
   `APT.entitlements` (`<dict/>`) — only relevant if building via Xcode instead
   of EAS (not recommended for push).

## Enablement steps

1. Add an **APNs Auth Key** to the project via `eas credentials` (or the EAS
   dashboard). EAS can generate one if Apple account access is linked.
2. In `apps/mobile/eas.json`, set the `development` profile's
   `"ios": { "simulator": false }` (or add a separate device profile). Device
   builds require a real iPhone.
3. Build and install: `eas build --profile development --platform ios`.
4. On first launch the app requests notification permission; accept it.
5. Confirm a row exists in `push_tokens` for the user (platform `ios`).
6. Trigger any notification from the Supabase dashboard (or the app) and verify
   delivery; the `push-notify` edge function gates on `push_enabled` and the
   per-type preferences.

## No code changes required

`usePushRegistration.ts`, the `push-notify` edge function, and the
`expo-notifications` plugin config (`defaultChannel`, color) are already
push-ready. This is purely a build/credentials exercise.