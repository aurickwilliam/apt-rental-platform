# Mobile Dark Mode: Fast Switching and System Preference

## Goal

Make mobile theme changes feel immediate and reliable, with an explicit **System**, **Light**, and **Dark** choice. System must follow the device appearance again after either manual override, including while the app is open. Keep the existing APT palette, styling, and splash-screen behavior.

## Current implementation and problems

- `apps/mobile/stores/useThemeStore.ts` already persists `"system" | "light" | "dark"` with Zustand and AsyncStorage under `apt-theme`; the initial preference is System.
- `apps/mobile/app/settings/index.tsx` exposes only a Dark Mode `Switch`. Toggling it drops System mode, and users cannot explicitly choose System again.
- `apps/mobile/hooks/useTheme.ts` calls `Appearance.setColorScheme()` in an effect for every mounted `useTheme()` or `useColors()` consumer. `apps/mobile/app/_layout.tsx` has a second theme-setting effect in `ThemeInitializer`. Both omit a reset when the stored mode becomes System, so a previous forced mode can remain in effect.
- The hook derives the palette from React Native's appearance reading while Uniwind and HeroUI Native render theme styles. A single resolved theme source should drive inline colors, utility classes, system chrome, and the selected preference UI without redundant appearance writes.
- The persisted preference hydrates asynchronously. Without coordinating theme application with the existing splash flow, a cold start in a saved mode different from the device mode can briefly show the wrong palette.

## Scope and decisions

- Mobile only; no backend or web changes, new dependencies, or new design tokens.
- Keep the existing `apt-theme` storage key and three preference values so existing choices survive the change. Default to System for first-time users.
- Use the installed Uniwind API (`Uniwind.setTheme("system" | "light" | "dark")`) as the single mechanism for applying the preference. Its System mode clears the native override and resumes following device changes. Do not separately call `Appearance.setColorScheme()` from components.
- Use Uniwind's resolved theme for `useColors()` and other theme-derived UI. Subscribe to the saved preference only where its value or control is needed. Keep the current `useTheme()`/`useColors()` consumer contract where practical; remove unused toggle/cycle controls if no longer called.
- Follow `DESIGN.md`: keep the theme change instant (no page-wide animation), reuse existing HeroUI Native settings/selection patterns, and preserve the canonical light/dark colors.

## Implementation plan

1. **Measure the existing interaction before changing it.**
   - In a development build, profile a Settings Light ↔ Dark switch with React Native DevTools on a representative tenant and landlord screen. Record the interaction's visible latency, commits/re-renders, and any dropped frames; repeat the same interaction after implementation.
   - If device profiling is unavailable, document that limitation rather than claiming a measured improvement. The duplicated appearance effects above are a concrete correctness/duplication issue independently of the timing result.

2. **Centralize theme application and resolution.**
   - Make the root the only place that observes the persisted preference and calls `Uniwind.setTheme(mode)` when that preference changes, including `"system"`. Remove the extra `Appearance` effects from `useTheme()` and `ThemeInitializer` (or replace `ThemeInitializer` with this one root-level synchronization point).
   - Derive the inline `COLORS.light`/`COLORS.dark` palette and `isDark` from Uniwind's active resolved theme, so OS changes in System mode update both inline styles and Uniwind/HeroUI Native surfaces. Limit store subscriptions to consumers that actually need `themeMode` or `setThemeMode`.
   - Keep the `StatusBar` and `expo-system-ui` background synchronized with the resolved appearance. Preserve the current light blue/dark near-black splash-colored backgrounds; inspect the `(tabs)` loading fallback for a hard-coded light background and align it if it causes a visible flash.

3. **Apply saved appearance before showing the app.**
   - Coordinate Zustand persistence hydration, initial `Uniwind.setTheme`, font loading, and the existing splash dismissal in `apps/mobile/app/_layout.tsx`. Do not render a wrong-theme app frame or dismiss the splash before the saved theme is applied; keep the existing deep-link/fallback splash behavior.
   - If hydration fails, log an unexpected error and proceed using System rather than hanging on the splash screen. Avoid writing the default over a still-loading saved choice.

4. **Add a three-choice appearance control to Settings.**
   - Replace the switch in `apps/mobile/app/settings/index.tsx` with an enabled **Appearance** row showing the selected preference. Tapping it opens a compact existing HeroUI Native selection pattern (for example, a sheet with three radio options), without adding a new route or copying legacy controls.
   - Show **System**, **Light**, and **Dark** as distinct, accessible choices, with a visible selection indicator and labels. Optionally describe System as following device settings. Choosing a mode applies it immediately and persists it for future launches.
   - Keep row spacing, fonts, icons, colors, and touch targets consistent with adjacent Settings items and `DESIGN.md`.

5. **Add focused regression coverage.**
   - Test default System, restoration of a saved choice, changing each choice, and returning from forced Light/Dark to System. Verify a subsequent device appearance change updates resolved colors only while System is selected.
   - Assert there is one root-level theme application path rather than an appearance write per `useColors()` consumer; cover Settings selection and its accessibility/selected state using the existing Jest and React Native Testing Library setup.
   - Manually check cold/warm starts, foreground OS changes, Settings, status bar, system background, dialogs/sheets, and both tenant and landlord navigation on iOS and Android. Check that selecting System when its resolved appearance already matches the current forced appearance does not cause an unnecessary visual flash.

6. **Verify and finish.**
   - Re-measure the same theme interactions and report the before/after results, or explain why device profiling could not be performed. Keep performance optimizations evidence-based rather than adding speculative memoization.
   - Run `pnpm --filter mobile typecheck`, `pnpm --filter mobile lint`, focused tests, and `pnpm --filter mobile exec jest --runInBand`; identify unrelated pre-existing failures separately.
   - After code changes, run `graphify update .`. Update `DESIGN.md` or `AGENTS.md` only if the canonical behavior or durable engineering conventions actually change; no token update is expected.

## Acceptance criteria

- Settings offers System, Light, and Dark; the selected choice is visible, accessible, and persists across app restarts.
- A choice changes the app's utility-class styles, HeroUI Native surfaces, inline colors, status bar, and system background promptly and consistently, without a route reset or page transition.
- System tracks device Light/Dark changes while the app is running; returning to System after a manual choice clears the manual override.
- A cold start does not expose a frame using the wrong stored theme or leave the splash screen indefinitely on storage failure.
- Theme changes no longer trigger duplicate `Appearance.setColorScheme()` effects across color-consuming components; before/after profiling results or a documented profiling limitation accompany the implementation.
- Relevant automated checks pass, with any unrelated failures reported explicitly.
