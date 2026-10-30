# APT Mobile replica — isolated product walkthrough

Development preview: **`/about/mobile-demo`** (`pnpm --filter web dev`). The route returns 404 in production, like the existing verification preview. `/about` already matches the public middleware rules, so it needs no auth exception. The page sits outside `(main)`'s layout and does not mount public navigation or landing sections.

The approved four Phase 1 screens are unchanged visually. Phase 2 adds one 28.8-second automatic walkthrough, with external Pause/Resume and Replay controls. Phase 3 reuses it inside the landing page's existing APT Mobile section. All in-phone actions remain presentational: a pulse does not dispatch a click. Receipts/history are the history destination; Pay Now is deliberately not a history shortcut. No message sending, checkout, API clients, account state, persistence or external media. Original mobile files remain read-only.

## References (relative to `apps/mobile/`)

| Replica | Visual source |
|---|---|
| `DemoDashboard.tsx` | `app/(tabs)/(tenant)/rentals.tsx`; `app/(tabs)/components/rentals/{RentalHero,PaymentSummaryCard,QuickActionsSection,MaintenanceSection,MaintenanceRequestCard}.tsx`; `app/(tabs)/components/{QuickActionButton,QuickActionContent,NotificationBellButton}.tsx`; `components/cards/LandlordCard.tsx` |
| `DemoPayments.tsx` | `app/tenant/payment/history/index.tsx`; `app/tenant/payment/history/components/PaymentHistoryCard.tsx` |
| `DemoMessages.tsx` | `app/(tabs)/(tenant)/chat.tsx`; `app/(tabs)/components/chat/{ConversationListHeader,ConversationListRow,MessageCard}.tsx` |
| `DemoConversation.tsx` | `app/chat/[conversationId].tsx`; `app/chat/components/{ChatHeader,ChatBubble,ChatBox,ChatEmptyState,DaySeparator,SenderAvatar,SeenAvatar}.tsx` |
| `DemoChrome.tsx` | `components/layout/{ScreenWrapper,StandardHeader}.tsx`; `app/(tabs)/(tenant)/_layout.tsx`; `app/(tabs)/components/CustomTabBar.tsx` |

Supporting references: `app/global.css`, `constants/theme.ts`, `hooks/useStatusChipStyles.ts`, `hooks/maintenance-requests/useMaintenaceRequestStatusStyles.ts`, `service/tenancy/quickActionsPreference.ts`, `hooks/chat/useChatApartment.ts`, and the installed HeroUI Native Surface/Card/Button/Chip/Avatar/Input/SearchField styles. No runtime imports from these files.

## Visual contract

- Android **light** only, independent of the web theme. Colors: primary `#376BF5`, accent `#2F5FE0`, page `#F5F7FB`, surface `#FFFFFF`, tertiary `#E9ECEF`, text `#333333`, muted `#626B73`, border `#E5EAF2`. Status chip colors match `STATUS_COLORS`.
- Copies in `fonts/` are byte-identical to `apps/mobile/assets/fonts/`: Inter 24pt Regular and Nunito Regular/SemiBold/Bold. Loaded with scoped `next/font/local`, not remote font requests. Emphasis follows the actual component; chat intro action labels retain the component's explicit Inter override.
- **412×915 is a proposed logical reference, not a device measurement.** Top inset 28 and bottom system area 24 are provisional. Hero height is `28 + round(915 × .25) = 257`. Screen padding 20, card padding 16, section gap 12, card radius 24; custom tabs 68 high, 20 side inset, 16 above system area. Tabs are only on Rentals/Messages. The system gesture bar remains on all screens.
- Independent CSS bezel: 12px around the logical screen, 436×939 total, clipped 40px screen corners and a center camera dot. It is an illustrative Android frame, not a Pixel model-accurate asset. No baked screenshot is underneath it. Uniform CSS container-unit scaling reserves the complete aspect ratio without JS measurements or hydration changes.
- Fictional data uses a frozen October 2026 clock. History excludes pending payments. Current-landlord conversation has no inquiry apartment strip. Same-sender corners/gaps, avatar gutters and a seen avatar follow the native components. A reversed scroll child starts the conversation at its newest message like the native inverted list, without programmatic scrolling.
- Local cover: the existing `public/landing/hero-living-room.png` marketing photo. Initials use actual avatar fallback patterns, not photographs of real users. All names, messages, amounts and records are fixtures.

## Validation / limitations

Unit tests: `pnpm --filter web exec node --experimental-strip-types --test lib/mobile-demo.test.mjs`. After starting the dev server, run `python scripts/test-mobile-demo.py` for reduced-motion static inspection and `python scripts/test-mobile-demo-motion.py` for the real-time walkthrough regression at 375/768/1440/1919px. Both accept `--url` and `--output`. Requires the existing Python Playwright installation; screenshots go to the approved OpenCode temp directory, not tracked assets. The static script also accepts `--production` to check the production 404 guard.

## Phase 2 clock, navigation and controls

`demo-timeline.ts` is a pure sample of the entire scene at a given time. `use-demo-playback.ts` owns one linear Motion value animated from 0 to 28.8, repeating without a repeat delay. There are **no scene timers, separate scroll tweens or independent touch animations**. A paused clock freezes every output. `DemoPlaybackController` is a per-preview local external store; subscribers are notified only for layer boundaries or control/environment changes, not on scroll frames. At most two screens are mounted for a transition. New layers seed their styles in a layout effect before paint.

| Seconds | Action |
|---|---|
| 0–3 | Rentals recognition hold |
| 3–3.45 | Pulse/press on the actual history icon |
| 3.45–3.8 | Payment History entrance |
| 3.8–5.2 | History reading hold |
| 5.2–8.2 | Scroll to the actual end of the six existing records |
| 8.2–9.7 | History reading hold |
| 9.7–10.15 | Back pulse |
| 10.15–10.5 | Reveal Rentals |
| 10.5–11.4 | Rentals hold |
| 11.4–11.85 | Chat-tab pulse |
| 11.85–12.03 | Tab crossfade, no horizontal/vertical slide |
| 12.03–13.8 | Messages hold |
| 13.8–14.25 | Pulse on the pinned landlord row |
| 14.25–14.6 | Conversation entrance |
| 14.6–16.1 | Conversation reading hold |
| 16.1–18.6 | Scroll toward older messages/intro |
| 18.6–20 | Read older history |
| 20–22 | Scroll back to the newest existing messages |
| 22–23 | Read newest messages |
| 23–23.45 | Conversation Back pulse |
| 23.45–23.8 | Reveal Messages |
| 23.8–24.6 | Messages hold |
| 24.6–25.05 | Rentals-tab pulse |
| 25.05–25.23 | Tab crossfade |
| 25.23–28.8 | Initial Rentals state, no touch; then repeat |

Stack entrances approximate Android fade-up with 24px travel and a 350ms smooth start/stop; pop reverses it. Tabs crossfade over 180ms without slide. Status/gesture chrome is counter-translated so it does not travel with the content. These timings are inferred, not measured from a device recording.

Every tap measures a `data-demo-tap` target relative to the clipped 412px screen, correcting for the CSS phone scale. The decorative Motion span uses the same clock for its 450ms fade/pulse; the real target receives at most 1.5% press compression, restored afterward. `data-demo-time`/`data-demo-running` are read-only DOM diagnostics for browser tests; there is no test-only seek API or accelerated timeline.

Scrolling writes the existing content container's actual `scrollTop`, normalized to `scrollHeight - clientHeight`, with smooth start/stop. Payment History clamps at its real end (a short scroll because the unchanged six records nearly fill the reference viewport). Conversation uses negative scrollTop for the native-like reversed list, visits the older messages, then returns to zero. The document never scrolls automatically. Headers, composer and tab bars stay outside content scrolling. No records, blank spacers or new messages were added to exaggerate movement.

Autoplay waits for image decoding/fonts, at least 35% phone visibility, a visible document, and both motion preferences permitting it. Intersection/visibility changes pause/play the same Motion controls without resetting elapsed time. Manual Pause remains selected after viewport re-entry. Replay seeks to zero and remounts the current layers to reset all scroll positions; it resumes only if allowed by the environment. Screen selection pauses, clears touch feedback and seeks to that screen's settled reading point. Resume continues from there. Wheel, pointer or keyboard-focus interaction inside the phone also pauses without cancelling browser events or preventing normal scrolling.

Reduced motion uses the existing `useLandingReducedMotion()` hook (including live OS/APT changes): stop the clock, return to Rentals, hide the pulse and keep Resume disabled. Manual static screen selection and static Replay remain available. Removing reduced motion leaves the demo paused until Resume. The animated layers are hidden from assistive technology and inert while running; the external description and keyboard-accessible controls stay available. Paused/static screens can be inspected and scrolled with the keyboard. Outgoing layers remain inert. All controls, Motion subscriptions, observers, document listeners and pending readiness callbacks are cleaned up on unmount.

The browser motion regression verifies a pixel-identical starting/ending phone, a subsequent loop, target alignment, intermediate transitions, pause during a pulse/transition/scroll, offscreen suspension, manual-selection persistence, Replay, and live motion preferences. Headless Chromium reports every tab as visible; document inactivity is therefore tested by supplying `visibilityState = 'hidden'` and firing the browser visibility event. A real-device/tab recording remains useful for platform validation.

The demo itself imports no backend code. The existing application root providers and middleware are unchanged: their account lifecycle can still validate an existing browser session independently of this fixture. Test in a clean browser context; the regression script rejects remote browser requests and fetch/XHR while switching/scrolling. This does not claim the shared host application is auth-free.

No connected emulator/device screenshots are available for visual certification. Native font baselines, Android status icons/insets, OS navigation and native continuous corner rendering require same-viewport captures to calibrate. Static source matching is not a claim of pixel-perfect device parity. The photo and fictional text differ intentionally from existing screenshots. Obtain matching original captures before visual sign-off.

## Phase 3 landing integration

`AppSection.tsx` preserves the original section classes, text subtree and streamed `AppDownloadAction` exactly. Only its artwork slot changes to `LandingMobileDemo`, with mobile font variables scoped to that slot. The old flattened `public/landing/app-mobile-my-rental.png` is retained as a reference, never placed underneath live HTML.

`LandingMobileDemo` is a small client-side `next/dynamic` boundary (SSR retained). Its separate chunk loads the existing `MobileDemo` with `presentation="landing"`; there is no second timeline/controller. `LandingDemoPoster` composes the same `DemoDashboard` and `DemoPhoneFrame` in the same reserved slot while code is pending. It is a static phone, not a skeleton or differently sized image placeholder. The preview route retains the standalone heading, selectors, inspection behavior and dev-only guard. Its behavior is unchanged.

Landing mode removes only the development heading/selectors, places two subtle 44px-high HeroUI playback controls below the phone, and provides a visually hidden description. It keeps the phone inert and hidden from assistive technology in every playback state: keyboard users get the description and real external controls, not fictional app actions. The phone stage has `pointer-events: none` and no wheel/pointer/focus capture handlers, so scrolling over it scrolls the page normally even while paused. The existing visibility/reduced-motion/foreground gates and Replay semantics are reused unchanged.

The old artwork was a close-up cropped halfway through the dashboard. Cropping the new full-size phone the same way would hide the Chat-tab taps and conversation composer. Therefore the full independent bezel is visible at a smaller size; only its soft shadow is clipped by the unchanged rounded section. The internal 412×915 viewport, frame proportions, colors and all screen CSS remain unchanged.

| Viewport | Reserved media column | Full phone width | Section height |
|---|---|---|---|
| 375px | 288px, centered below text | 256px | ~999px (was ~727px; taller natural stack) |
| 768px | 320px + original 48px right margin | 176px | 452px (unchanged) |
| 1440/1919px | 416px + original 64px right margin | 220px | ~538px (was ~537px; <1px difference) |

These are browser measurements, not new internal device dimensions. The tablet/desktop text column widths and typography are unchanged. Below `md` the full phone intentionally increases the section's height rather than hiding essential content or shrinking it to an unreadable thumbnail. Mobile uses the existing stacked layout. The complete phone is necessarily narrower than the former cropped close-up; device-exact frame calibration remains a separate limitation.

Landing motion regression: `python scripts/test-mobile-demo-motion.py --landing --url http://localhost:3000/ --output C:/Users/Aaron23/AppData/Local/Temp/opencode/mobile-demo-phase3-motion`. In addition to the normal real-time checks it verifies unchanged copy/background, the single frame, decorative/inert screen, wheel pass-through, and the original `/download` button destination (intercepted in the browser, no APK fetched). Existing landing server reads for apartments and Android availability are unchanged; the embedded demo itself adds no backend reads.

Protected mobile, auth, payment/backend and APK/download configuration files are untouched. No other landing section is integrated with or changed by this component.
