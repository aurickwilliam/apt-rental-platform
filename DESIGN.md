# DESIGN.md — APT (A Place to Thrive)

Canonical design guide for the APT rental platform (Philippines, CAMANAVA focus). Single source of truth for UI generation. Describes the **canonical** design system (standards future work must follow) and flags legacy implementations that must not be propagated.

Status markers: ✅ **Canonical** (follow) · 🚧 **Transitional** (token-correct custom; reuse, prefer HeroUI when writing new) · ⚠ **Legacy** (reference only; never copy).

---

## 1. Design Philosophy

**Product personality:** Friendly, trustworthy, professional. APT connects tenants and landlords in Metro Manila — approachable and dependable, like a well-run local brokerage.

**UX goals:** rental discovery/application/payment/management feel simple and low-risk; trust through verification (Verified chips, shield icons everywhere); money is always explicit (prices, move-in breakdowns).

**Visual identity:** primary blue `#376BF5` + secondary orange `#FFA500` on both platforms and both themes; clean, spacious, card-based; rounded geometry (10–24px); flat surfaces with hairline borders, minimal shadows.

**Mobile-first:** the Expo app is the primary product; web mirrors its palette and semantics. Design mobile-first, adapt to web.

**Accessibility:** status colors never used alone (paired with text/icons); visible focus rings (`#376BF5`/15% web, `border-focus` mobile); `FieldError` + `isInvalid` on inputs; required `*` markers; muted text no lighter than `#6C757D`/`gray-500` at scale. No `prefers-reduced-motion` handling exists — keep motion minimal (§17).

---

## 2. Source of Truth

Authority order (conflicts resolve to the lowest number):

| # | Source | Authority |
|---|---|---|
| 1 | `packages/constants` — `colors.ts`, `typography.ts` | Design tokens |
| 2 | `apps/web/app/globals.css`, `apps/mobile/app/global.css` | Token mapping (Tailwind/HeroUI theme) |
| 3 | Shared components (per-app `components/`) | Component patterns |
| 4 | HeroUI (`@heroui/react`) / HeroUI Native (`heroui-native`) | Primitive implementation & behavior |
| 5 | Existing production screens | Layout patterns, composition |
| 6 | Legacy components / dead code | Reference only — §24 |

---

## 3. Brand & Color

All values exact. Light/dark pairs from `packages/constants/src/colors.ts`; mappings in both `globals.css` files.

### Brand

| Token | Light | Dark | Notes |
|---|---|---|---|
| `primary` | `#376BF5` | `#5B8BF7` | Buttons, links, active states, accent surfaces |
| `primaryLight` | `#EFF6FF` | `#1A2340` | Tinted backgrounds (role chips, info accents) |
| `secondary` | `#FFA500` | `#FFA500` | Headline titles, CTAs, stars, highlights |
| `secondaryForeground` | `#FFFFFF` | `#FFFFFF` | Text on secondary surfaces |
| `secondaryLight` | `#FFF3E0` | `#2E2212` | Tinted orange backgrounds (landlord chips) |

### Surfaces & backgrounds

| Token | Light | Dark | Notes |
|---|---|---|---|
| `white` | `#FFFFFF` | `#121212` | Card/surface base |
| `surface` (`--background` web) | `#F8F9FA` | `#1E1E1E` | Page background |
| `surfaceRaised` | — | `#2A2A2A` | Mobile elevated surface |
| `bg-surface` (mobile) | `oklch(100% 0 0)` | `oklch(0.2103 0.0059 285.89)` | Card/screen surface token |
| `surface-secondary` (mobile) | `oklch(0.9524 0.0013 286.37)` | `oklch(0.227 0.004 285)` | Sheets, dropdowns, sticky footers |
| `surface-tertiary` (mobile) | `oklch(0.9373 0.0013 286.37)` | `oklch(0.26 0.004 285)` | Skeletons, muted fills |
| `backdrop` (mobile) | `oklch(0% 0 0 / 20%)` | `oklch(0% 0 0 / 40%)` | Sheet/dialog overlays |
| web `--card` | `#FFFFFF` | `oklch(0.205 0 0)` | shadcn card token |

### Text & neutral

| Token | Light | Dark | Usage |
|---|---|---|---|
| `textPrimary` / `--foreground` | `#333333` | `#F0F0F0` | Primary text (not pure black) |
| `textSecondary` / `gray500` / `--muted-foreground` | `#6C757D` | `#9CA3AF` | Secondary text, labels, metadata |
| `gray400` | `#9CA3AF` | `#6B7280` | Placeholders, disabled, tertiary |
| `gray300` | `#BDBDBD` | `#3D3D3D` | Placeholder-level, chip borders |
| `gray200` | `#D1D5DB` | `#2A2A2A` | Borders (`--border` web), dividers |
| `gray100` | `#E5E7EB` | `#1E1E1E` | Muted fills, hairline dividers |

Mobile `gray-500` is redefined to `#6C757D` (not Tailwind default `#6B7280`). Web's `grey-*` is a separate shifted scale (`grey-700 #6C757D` … `grey-200 #E5E7EB`) — prefer `gray-*`/COLORS tokens.

### Semantic

| Token | Light | Dark | Usage |
|---|---|---|---|
| `success` / `successLight` | `#22C55E` / `#E6F4EA` | `#4ADE80` / `#14291E` | Paid, verified, approved |
| `warning` / `warningLight` | `#FACC15` / `#FFF8E1` | `#FDE047` / `#2A2410` | Pending, partial |
| `danger` / `dangerMid` / `dangerLight` | `#E50914` / `#FF4B4B` / `#FDA4AF` | `#F87171` / `#FCA5A5` / `#2D1515` | Destructive, errors, rejected |
| web `--destructive` | `#E50914` | `oklch(0.704 0.191 22.216)` | Destructive actions |

### Web-only theme (`apps/web/app/globals.css`)

`:root`: `--radius 0.625rem`, `--background #F8F9FA`, `--foreground #333333`, `--card #FFFFFF`, `--primary #376BF5`, `--secondary #FFA500`, `--muted #E5E7EB`, `--muted-foreground #6C757D`, `--accent #EFF6FF`, `--destructive #E50914`, `--border #D1D5DB`, `--ring #376BF5`. HeroUI themed purely by `--heroui-primary/--heroui-secondary/--heroui-focus` (no `HeroUIProvider` config); dark mode keeps `--primary #376BF5`.

⚠ Undefined legacy tokens: `redHead-*`, mobile `grey-*`, `text-text`, `darkerWhite`, `mediumGrey`, `COLORS.redHead`; tenant pages' one-off `zinc-*` palette (§24.2, §24.5).

---

## 4. Typography

Two families (via `packages/constants/src/typography.ts`, both platforms):

| Role | Family | Weights |
|---|---|---|
| Body | **Inter** (`Inter_24pt-*` / `font-inter`) | regular, medium, semibold |
| Headings | **Nunito** (`Nunito-*` / `font-nunito`) | regular, medium, semibold, bold |

Web loads via `next/font/google` (`--font-inter`, `--font-nunito`). Mobile classes: `font-inter`, `font-interMedium`, `font-interSemiBold`, `font-nunitoMedium/SemiBold/Bold`.

### Scale & roles (Tailwind sizes, both platforms)

| Purpose | Class | Size |
|---|---|---|
| Micro (badges, tab labels, timestamps) | `text-[10px]`–`text-[13px]` | 10–13px |
| Meta / captions | `text-xs` | 12px |
| Small body, tables | `text-sm` | 14px |
| Body, labels, card values | `text-base` | 16px |
| Card/section titles | `text-lg` | 18px |
| Mobile screen titles, stat values | `text-xl` / `text-2xl` | 20 / 24px |
| Primary mobile role headers | `text-3xl` | 30px |
| Web page H1 | `text-5xl` | 48px |

**Conventions:** mobile screen titles `text-secondary text-2xl/3xl font-nunitoSemiBold`; section headers `text-foreground text-lg font-interSemiBold` + 24px icon; card titles `text-base/xl font-interSemiBold`, labels `text-muted text-sm`; web headers `text-5xl text-secondary font-bold` + `text-sm text-muted-foreground` subtitle; labels `font-interMedium` (mobile) / HeroUI `Label` (web), required `*` in `text-danger`; web eyebrows/table headers `text-[11px] uppercase tracking-wider`; money `font-interSemiBold`/`font-medium` in `text-primary`/`text-accent` via `formatPesoDisplay`; chat `text-sm leading-6`.

⚠ Do NOT use `font-noto-serif`, `font-dm-serif`, `font-poppinsSemiBold` (no font loaded — silent fallback). New families require `typography.ts` + both `globals.css` + mobile font loading.

---

## 5. Spacing System

Tailwind v4 default scale (4px base). No custom spacing tokens declared.

| Context | Value |
|---|---|
| Mobile screen padding | `p-5` (20px); headers `px-5` |
| Web page padding | `p-4` (16px) in `max-w-7xl mx-auto` |
| Card padding | `p-4` standard; `p-2`–`p-3` dense; `p-5` wide |
| Form stacks / gaps | `gap-4`/`gap-5`; lists `gap-3`; grids `gap-3` (web) / 8px (mobile) |
| Sections | `mt-5` (mobile), `mt-6`/`space-y-4` (web); `Separator className="my-4"` |
| Fixed-bar clearance | `bottomPadding={84}` (68 tab bar + 16 offset); footers add `insets.bottom` |
| Custom sizes | `h-4.5`/`min-w-4.5` (18px badges), `h-128` (512px web hero), `h-168` (672px mobile hero) |

Match neighboring components; keep 4px multiples; never introduce a new scale.

---

## 6. Border Radius

| Radius | Web (base `--radius` 10px) | Mobile |
|---|---|---|
| `rounded-md` / `rounded-lg` | 8 / 10px | — |
| `rounded-xl` | 14px | 12px |
| `rounded-2xl` | 18px | 16px |
| `rounded-3xl` | 22px | **24px** (primary card radius) |
| `rounded-full` | pill | pill |
| Sheet top / receipt | — | `rounded-t-[20px]` / `rounded-t-2xl rounded-b-none` |

Conventions: mobile cards `rounded-3xl` (nested `rounded-xl`/`2xl`); web cards `rounded-xl` (tenant `rounded-2xl`); buttons/chips/avatars/badges/search pills `rounded-full`; images `rounded-xl`–`rounded-2xl`, thumbnails `rounded-lg`.

---

## 7. Shadows

Minimal — flat + hairline border is the aesthetic.

- **Mobile cards:** `shadow-none` + `border border-border`; elevation only where needed (verified badge / favorite button `elevation: 3`)
- **Mobile floating tab bar:** `shadowColor #000`, offset `{0,8}`, opacity 0.12 light / 0.35 dark, `elevation 5`
- **Mobile FAB:** `shadow-lg`; profile avatar "lift" via `border-4 border-background`
- **Web:** `shadow-sm` (shadcn card), HeroUI defaults; flat content on `bg-white rounded-xl`
- HeroUI Native theme defines `--surface-shadow`/`--overlay-shadow` (transparent in dark)

---

## 8. Icons

| Platform | Standard | Legacy (⚠) |
|---|---|---|
| Mobile | `@tabler/icons-react-native` | `lucide-react-native` (PropertyOverview, TenantCard, Chat, DateField, DropdownField) |
| Web | `lucide-react` + `@tabler/icons-react` (both accepted) | — |

Sizes (stroke 2 default): tab bar 24 (focused filled `strokeWidth 2.5` / unfocused outline 1.8); header actions 24–26; section icons 24; inline/button 16–20; metadata 12–18; empty-state 64 (tenant bare primary) / 32–48 (landlord, in gray circle); status 18–26 (receipt check 48). Filled variants for active/selected; neutral `gray500`/`textPrimary`, emphasis `primary`/`secondary`. Never add a new icon library.

---

## 9. Buttons

**Canonical: HeroUI / HeroUI Native `Button`** (same variant system both platforms).

| Variant | Usage |
|---|---|
| `primary` (default) | Apply Now, Pay, Save, Verify, next steps |
| `secondary` | Cancel-in-dialog fallback, Skip, Search submit (web) |
| `tertiary` | Quiet in-content actions: Clear All, quick actions, row menus |
| `outline` | Bordered actions: browse CTAs, select triggers |
| `danger` / `danger-soft` | Delete, Reject, Logout dropdown item |
| `ghost` | Icon/utility: navbar, back, theme toggle, favorite, closes |
| Disabled / Loading | `isDisabled`; `isPending` + `Spinner size="sm" color="current"` |

Sizes `sm`/`md`/`lg`; modifiers `isIconOnly`, `fullWidth`/`w-full`, `h-20 flex-col` (web quick actions). Mobile composes `<Button.Label>`; icons in buttons 16–26px.

**⚠ Legacy** (`apps/mobile/components/buttons/`): `PillButton` (h-14/h-12 pill, still in verify-account/document-id/payment flows; references undefined `redHead-*`/`grey-500` tokens), `OptionButton` (p-4 rounded-xl row + chevron), `RadioButton`, `CheckBox`. Never copy; migrate call sites when touched.

---

## 10. Inputs

**Canonical: HeroUI `TextField`/`Input`/`InputGroup`/`Select`/`TextArea`/`NumberField`/`Slider`/`SearchField`/`InputOTP`.**

- **Focus (web):** `border-gray-300` rest → `focus-within:border-[#376BF5] focus-within:ring-2 ring-[#376BF5]/15`; fields `rounded-xl bg-white`
- **Focus (mobile):** `border-focus` focused / `border-field-border` rest / `border-danger` error / `bg-surface-tertiary` disabled
- **Labels** above field (`font-interMedium` mobile / HeroUI `Label` web), required `*` in danger; **validation** `isInvalid` + `FieldError` (HeroUI) or inline `text-danger text-xs mt-1`
- **Password:** `InputGroup` suffix eye toggle (`IconEye/EyeOff size 20 gray400`); **search:** `SearchField` w/ icon prefix, `rounded-full` on web browse; **selects:** `Select` with `rounded-xl`/`rounded-lg` trigger, `ListBox.Item hover:bg-light-blue!`; placeholders `text-gray-400`/`text-muted`

**🚧 Transitional (custom, token-correct, raw RN):** `DateField`, `DropdownField`, `UploadImageField`, `UploadFileField`, `TimeField`, `QuantityField`, `AppInput` — current implementation for apply/add-apartment/edit-profile flows; follow canonical border rules (`rounded-2xl h-12 border-field-border`). Prefer HeroUI for new code.

**⚠ Legacy:** `components/inputs/TextField` (border-2 rounded-2xl h-16, undefined tokens), `TextBox`, `SearchField`, `RangeSlider`, `MultiChipGroup`, `SingleChipGroup`.

---

## 11. Cards

Standard anatomy (both platforms): surface bg, hairline border, no shadow, rounded, `p-4`.

| Card | Spec |
|---|---|
| **ApartmentCard** (mobile ✅) | `bg-surface rounded-2xl border-border shadow-none`; square thumbnail; body `p-2 gap-2` grid / `p-3 gap-3` list; name `font-interMedium text-base/xl`; location `text-muted text-[12px]/base`; price `text-accent font-interSemiBold text-lg/xl`; `Verified` pill top-left (`bg-success-light`); favorite circle top-right (white/75) |
| **ApartmentCard** (web ✅) | `w-56 rounded-xl overflow-hidden hover:border-primary transition-all duration-200`; thumb `size-56 rounded-xl`; price `text-[15px] font-medium text-primary`; star `text-yellow-400` 18px; favorite `ghost isIconOnly bg-black/30` |
| **PropertyCard / rows** (mobile ✅) | `bg-surface rounded-3xl p-4 border-border`; thumb `w-20 h-20 rounded-xl` |
| **StatCard** (web ✅) | `p-4 gap-3 rounded-xl`; primary `bg-primary text-white`, others `bg-white border-grey-300`; icon chip `p-1.5 rounded-md`; label `text-base font-medium`; value `text-3xl font-semibold`; sub `text-xs` |
| **Dashboard hero stats** (mobile ✅) | `bg-primary rounded-3xl p-4` (label `text-sm text-gray-100 font-interMedium`, value `text-3xl text-white font-interSemiBold`) or `bg-surface rounded-3xl border-border` |
| **PaymentSummaryCard** (mobile ✅) | `shadow-none rounded-3xl my-5`; title `text-accent text-lg font-interSemiBold`; rows `text-sm`; `Separator my-3`; total `font-interMedium text-accent` |
| **ReceiptCard** (mobile ✅) | GCash-style `bg-white rounded-t-2xl rounded-b-none`; success icon 48; dashed separators; scalloped bottom via `ZigzagEdge` (depth 13, tooth 20) |
| **RatingCard** (mobile ✅) | `rounded-3xl border p-3`; avatar sm + name/date; `StarRating` 14px; review `text-sm` w/ "Read more" >150 chars; thumbs `w-16 h-16 rounded-xl` w/ `+N` |
| **LandlordCard** (mobile ✅) | `rounded-3xl border`; avatar `size-12 rounded-full`; message icon button |
| **TenantCard** (mobile ✅) | `rounded-3xl border`; lease split-row (`py-2.5`, label `text-xs text-muted`, value `text-sm font-interMedium`); tertiary actions |
| **PropertyOverview** (mobile ✅) | name `text-accent text-2xl font-nunito`; rent `text-accent text-lg font-interMedium`; specs `w-1/2` rows; images `rounded-2xl w-36 h-52` |
| **DashboardCard** (web tenant ⚠) | zinc palette — one-off, do not copy |

Pressable cards use `PressableFeedback` (mobile). Hierarchy: primary `rounded-3xl` (mobile) / `rounded-xl` (web), nested `rounded-xl`.

---

## 12. Lists

- **Mobile:** `FlatList` `gap-3`–`gap-16`, `contentContainerStyle paddingBottom: 84` when a floating bar exists; `ListGroup` for settings/profile (icon 22 + `font-interMedium` title + `Separator mx-4`); `Separator` between items; `RefreshControl` tinted `colors.primary`
- **Web:** shadcn `Table` on `bg-darker-white`, header `text-[11px] tracking-wider`, rows `hover:bg-default-50` cursor-pointer, thumbs `w-12 h-12 rounded-lg`; search grids `grid-cols-1 sm:2 lg:4 gap-3`
- **Chat:** `ChatBubble` `max-w-[80%] mb-4`, sent `self-end` / received `self-start`; inverted list (newest at bottom) with history paged in 30-message keyset loads at the top edge — loading indicator at the history edge, never a full-screen spinner
- **Notifications:** `NotificationCard` (mobile) — `Card bg-surface rounded-3xl border p-4 shadow-none`; type icon 20 tinted by type + title `text-base` (`font-interSemiBold` unread / `font-interMedium` read) + message + footer time `text-sm text-muted`; unread adds `border-primary/30` + 10px `bg-primary` dot; tap marks read + deep-links. Screen header: filter `DropdownButton` (All/Payment/Message/Maintenance/Apartment/System) + "Mark all read" text button (shown while unread > 0)
- Empty lists use the Empty State pattern (§15), never blank space

---

## 13. Navigation

### Web

- **Navbar** ✅ (AppNavbar/TenantNavbar): `sticky top-0 z-40 h-16 border-b border-divider bg-background/70 backdrop-blur-md backdrop-saturate-150`; `max-w-7xl mx-auto px-4 sm:px-6`; logo 100×40; links `font-medium`, active `text-primary`; avatar dropdown; `sm:hidden` hamburger panel; auth buttons `rounded-full`
- **Sidebar** ✅ (landlord, shadcn): `w-64` (256px), collapsible to `3rem` (18rem mobile); items `gap-3`, active `bg-primary/15 text-primary`, icons `w-5 h-5`; footer user block `hover:bg-grey-200`; content `bg-white min-h-screen w-full rounded-xl`
- **Footer** ✅: full-width `bg-primary text-white`; desktop `md:flex justify-between gap-10`; mobile HeroUI `Accordion`; socials `ghost isIconOnly bg-white/20 hover:bg-white/30` size 26; links `text-white/80 hover:text-white`; `Separator h-0.5 bg-white`
- No breadcrumb usage in production pages; no route transitions

### Mobile

- **Tabs:** iOS = `NativeTabs` (system chrome, `tintColor primary`); **Android = floating pill** ✅ (`CustomTabBar`): absolute `bottom: max(insets.bottom, 16)`, `left/right 20`, `rounded-full bg-surface`, height 68px, inner `border p-1 gap-3`; focused icon filled 24 `primary` `strokeWidth 2.5` + label `text-[10px] font-interSemiBold`; unfocused outline `gray300` `strokeWidth 1.8`; no badges
- **Stack:** `headerShown: false` globally; screens render their own:
  - `StandardHeader` ✅: `bg-accent`, `paddingTop: insets.top + 20`, `pb-5 px-4`, centered `font-interSemiBold text-lg` white, back chevron 24
  - `ChatHeader` ✅: `bg-accent`, height `insets.top + 56`, avatar `border-white`, name `text-base font-interMedium`, sub `text-xs /70`
  - Inline role headers ✅ (tab screens): icon/logo + `text-secondary text-2xl/3xl font-nunitoSemiBold` + bell ghost (`IconBell 26 gray500`) — bell opens the role-aware notification center (`(notification)/tenant-notif` / `landlord-notif`)
- Tabs — tenant: Rentals / Search / Chat / Profile; landlord: Dashboard / Units / Chat / Profile

---

## 14. Dialogs

### Web (HeroUI v3)

- **Modal** ✅: `Modal.Backdrop` → `Container placement="center" size="sm"|"lg" scroll="inside"` → `Dialog` with `CloseTrigger`, `Header/Heading (font-medium text-2xl)`, `Body`, `Footer`; blur backdrop for OTP; lightbox `size="cover"` + `bg-black/80`, white card `w-2/3 rounded-2xl p-4`, `h-[65vh]` stage, thumbs `w-24 h-16 rounded-lg border-2`
- **Drawer** ✅ (PropertyDetailsSheet): right `w-[500px] max-w-[90vw] z-60`; cover `h-56` w/ `bg-linear-to-t from-black/60`; section titles `text-xs font-medium text-primary uppercase`; ReadOnlyField (label `text-xs text-grey-500` / value `text-sm font-medium`)

### Mobile (HeroUI Native)

- **Dialog** ✅: `Portal > Overlay > Content`, `Close variant="ghost"` top-right; backdrop 20%/40%
  - `ConfirmDialog` ✅: footer `justify-end gap-3` — `ghost sm` cancel + `sm` confirm (default `danger`)
  - `ErrorDialog`/`SuccessDialog` ✅: icon 20 `danger`/`success`, title `text-danger`/`text-success`, dismiss `secondary sm`
  - `RejectDialog` ✅: `TextField` + `TextArea numberOfLines={3}`, footer `secondary` Cancel / `danger-soft` Reject (both `flex-1`)
- **BottomSheet** ✅: snapPoints `["85%"]` (filters) / `["50%","75%"]` (DropdownField); `enableOverDrag false`; handle `bg-[#D0D0D0] w-10`; `bg-surface rounded-t-[20px]`; sticky header `border-b border-border`; sticky footer `border-t pt-3` (Apply `flex-1 sm` + Clear All `tertiary sm`)
- **Legacy RN `Modal`** ⚠ (fade, `rgba(0,0,0,0.3)` backdrop): MoveInCost, DateField iOS picker, video — migrate when touched

---

## 15. Feedback

- **Toasts** ✅ (web): `Toast.Provider placement="top end" maxVisibleToasts={3} className="top-4 right-4"`; `toast.success / warning / danger / toast(msg)`
- **Notification banner** ✅ (mobile in-app): realtime-driven HeroUI toast from `useInAppNotificationBanner` — foreground push substitute that works without push credentials; auto-dismiss; action press marks the row read and deep-links (role-aware); message-type toasts are suppressed while the matching chat is open (`shouldSuppressChatToast`)
- **Loading:** web `Spinner color="accent"` centered (`py-16/20`); `Button isPending`; mobile `ActivityIndicator size="large" color={colors.primary}`; `RefreshControl colors=[primary]`
- **Empty states** ✅: mobile — centered `gap-4 py-16/20`; tenant: bare icon 64px `primary` + `text-xl font-interSemiBold` title + `text-gray-400 text-base px-8` desc; landlord: icon 32–48px `gray500` in `bg-gray-100 rounded-full p-5/6` + `text-lg` title + `text-gray-500 text-sm` desc; optional CTA. Web — centered `text-default-400` ("No apartments found", `h-64`) or card-wrapped `text-sm text-default-500`
- **Skeletons** ✅ (mobile): HeroUI `Skeleton`/`SkeletonGroup` blocks `rounded-lg`/`rounded-full` sized to content; custom `ApartmentSkeleton` pulses opacity 0.45↔0.85 @ 700ms (Reanimated). Web: `animate-pulse` divs (`w-8 h-8 rounded-full bg-default-200`); shadcn `Skeleton` internal only
- **Error banners** (web): `mt-4 p-3 bg-red-200 border border-red-400 rounded-lg text-sm text-red-600`; inline `FieldError` on fields
- **Status chips** ✅: web `Chip size="sm" variant="soft"` + `text-[11px]`; mobile pills `px-4 py-0.5 rounded-full border-2` (`border-success bg-success-light text-success`, etc.)

---

## 16. Images

- **Thumbnails:** square (mobile `aspect-square`; `w-20 h-20` rows), `object-cover`/`contentFit="cover"`, `cachePolicy="disk"` (expo-image), gray placeholder `bg-gray-200` + icon
- **Web hero (detail):** `w-full h-128` grid — main `w-2/3` + stacked `w-1/3` halves, all `rounded-2xl hover:brightness-90 transition`; "See more photos" pill
- **Mobile hero:** `h-168 p-5 justify-end` w/ gradient, or full-bleed `h-80 rounded-b-3xl`
- **Ratios:** 1:1 thumbs, `w-36 h-52` gallery (≈3:4), `w-24 h-16` lightbox thumbs, `w-12 h-12` table thumbs
- **Avatars:** HeroUI `Avatar` sm/md/lg; profile `size-36 border-4 border-background`; initials fallback `bg-primary text-white` (web) / `bg-gray-100 text-accent` (mobile); landlord `size-12 rounded-full border`
- **Lightbox:** web HeroUI Modal (§14); mobile `react-native-image-viewing` (`presentationStyle overFullScreen`, `rgba(0,0,0,0.8)`)
- Private Supabase storage: always signed URLs at read time

---

## 17. Motion

Conservative — functional, not decorative.

- **Press:** `activeOpacity={0.7}`; `PressableFeedback` Ripple/Highlight (mobile cards); `active:opacity-80` FAB
- **Hover (web):** `transition-all duration-200` (cards `hover:border-primary`), `hover:brightness-90` images, standard button hovers
- **Skeletons:** 700ms Reanimated opacity 0.45↔0.85; CSS `animate-pulse`
- **Sheets/dialogs:** HeroUI Native/HeroUI defaults (fade + slide); legacy modals `animationType="fade"`
- **Page transitions: none exist** — do not add full-page animation systems
- Dark-mode: instant (next-themes; mobile `Appearance.setColorScheme`)

---

## 18. Responsive Design

### Web (Tailwind breakpoints)

| Breakpoint | Value | Typical use |
|---|---|---|
| `sm` | 640px | nav links, 2-col grids, hamburger toggle |
| `md` | 768px | `md:flex-row` (filters + results), 2-col grids |
| `lg` | 1024px | 4-col stat/card grids (`grid-cols-1 md:2 lg:4`) |
| Container | `max-w-7xl` (80rem) | all page shells: `max-w-7xl mx-auto p-4` |

Mobile-first (`grid-cols-1` → responsive); landlord layout = fixed sidebar + `bg-white rounded-xl` content.

### Mobile

No breakpoints; `useWindowDimensions` math (grid card = `(width − 32 − 8) / 2`, list = full width); grid/list toggle on search; safe areas via `useSafeAreaInsets` (`ScreenWrapper`, `StandardHeader`, `CustomTabBar`, footers). Platform differences: tab bar (NativeTabs iOS vs pill Android), date pickers (spinner sheet iOS vs inline Android), keyboard `extraHeight 50 iOS / 100 Android`.

---

## 19. Platform Consistency Rules

**Always consistent (identical tokens):** colors; typography (Inter/Nunito roles); icon glyphs and size tiers; semantic meaning (success/warning/danger; verified = `#22C55E` shield); card anatomy & hierarchy; status chip and empty-state structure; component behavior (buttons, inputs, validation, dialogs).

**Platform-specific by design (do not force parity):** navigation (navbar+sidebar vs tabs+stack); bottom sheets (mobile gestures) vs modals/drawers (web); safe areas/system bars/keyboard; hover (web-only) vs press feedback (mobile-only); web density (tables, multi-column) vs mobile single-column.

---

## 20. UI Principles

1. **Trustworthy** — verification affordances everywhere, explicit payment breakdowns, transparent pricing
2. **Clean & spacious** — hairline borders over shadows, generous `p-4`+, flat surfaces
3. **Friendly** — rounded geometry, orange warmth, welcoming copy
4. **Consistent** — one token set per platform, repeated card anatomy, same semantics across apps
5. **Professional** — restrained motion, muted secondary text, uppercase micro-labels, structured forms
6. **Mobile-first** — large touch targets (`h-12`+ inputs), bottom sheets over menus, floating affordances

---

## 21. AI Decision Hierarchy

1. **Reuse** an existing component (HeroUI, shadcn, shared `components/`)
2. **Extend** an existing component (props/composition), don't duplicate
3. **Reuse existing design tokens** (colors, fonts, spacing, radius)
4. **Follow existing layout patterns** from production screens
5. **Create a new component** only if nothing suitable exists (run the checklist)

---

## 22. Before Creating a New Component — Checklist

- [ ] Does this component already exist (shared, HeroUI, shadcn, another screen)?
- [ ] Can HeroUI / HeroUI Native solve this out of the box?
- [ ] Can an existing shared component be extended instead?
- [ ] Does the web app already implement it? Does the mobile app?
- [ ] Is a web/mobile twin needed — or a shared `@repo` component?
- [ ] Would this duplicate an existing component (even legacy) in behavior?
- [ ] Can it be composed from existing parts (Card + Chip + Button)?

Any "yes" → reuse/extend. New components must use canonical tokens and live in `components/`.

---

## 23. Do Not Introduce

- New color palettes or tokens (no hex/oklch outside the documented set)
- New typography systems or font families
- New spacing systems / non-4px rhythm
- New border-radius scales
- Material Design styling (beyond existing native system components)
- iOS Human Interface / Cupertino styling beyond what the app already does
- Glassmorphism, neumorphism, decorative gradients
- New icon libraries (Tabler/lucide only)
- New animation philosophies (page transitions, spring-heavy motion, parallax)
- Card styles diverging from the documented anatomy
- New button/input variant families beyond documented HeroUI variants
- Copy-pasting from ⚠ legacy implementations

---

## 24. Known Design Debt

Never copy technical debt. Reference only, with migration direction.

| # | Item | Current state | Use? | Migration |
|---|---|---|---|---|
| 1 | Mobile legacy components: `PillButton`, `CheckBox`, `MultiChipGroup`, `SingleChipGroup`, `AccordionItem`, `StatusPill` | Pre-HeroUI custom; several reference undefined JS constants; still used in document-id + payment flows. (`TextField`, `TextBox`, `RadioButton`, `SearchField`, `RangeSlider`, `NumberField` were deleted 2026-08-13; onboarding migrated to HeroUI `TextField`) | ⚠ No | HeroUI equivalents; migrate call sites |
| 2 | Undefined JS constants in legacy inputs: `COLORS.text`, `COLORS.mediumGrey`, `COLORS.lightGrey` | Referenced removed constants; tsc errors | ⚠ No | Use `useColors()` theme hook. (Tailwind classes `redHead-*`, mobile `grey-*`, `text-text`, `darkerWhite`, `COLORS.redHead` swapped to canonical tokens and cleaned) |
| 3 | Web dead CSS (`@layer components` `.button--*`, `.input`, `.select__trigger`, `.toggle-button`) | Unreferenced by any TSX | ⚠ No | Delete; use HeroUI + Tailwind |
| 4 | Web undefined fonts (`font-noto-serif`, `font-dm-serif`, `font-poppinsSemiBold`) | Fallback font renders | ⚠ No | Use `font-nunito`/`font-inter` |
| 5 | Web tenant `zinc-*` palette (my-rental) | Diverges from canonical grey tokens | ⚠ No | Normalize to `gray-*` |
| 6 | `lucide-react-native` on mobile | ~31 files (chat, settings, apartment detail, manage-apartment, inputs; public landlord/tenant profile screens migrated) | ⚠ No | `@tabler/icons-react-native` |
| 7 | Dead components (`TabBar`, `TabBarIcon`, unused inputs/display components) | Unused | ⚠ Delete | Remove when touched |
| 8 | Legacy RN `Modal` (MoveInCost, DateField picker, video) | Works, outside HeroUI overlay system | 🚧 OK | Migrate to HeroUI `Dialog`/`BottomSheet` |
| 9 | Custom form inputs (`DateField`, `DropdownField`, `UploadImageField`, `UploadFileField`, `TimeField`, `QuantityField`, `AppInput`) | Token-correct custom implementations | 🚧 Reuse | Re-evaluate HeroUI equivalents |
| 10 | `@repo/supabase` default export on web | Mobile-oriented | ⚠ No | `@supabase/ssr` on web |

---

## 25. AI Working Rules

1. **Never redesign existing UI** unless explicitly asked.
2. **Prefer existing shared components** (HeroUI / HeroUI Native / shadcn / shared `components/`).
3. **Reuse design tokens** — colors, fonts, spacing, radii from `packages/constants` + both `globals.css` themes. No new values.
4. **Match the spacing of neighboring components**; 4px-multiple rhythm.
5. **Preserve visual consistency** — same component = same anatomy (surface, border, radius, padding, type).
6. **Do not invent new component variants**; use documented HeroUI variants and sizes.
7. **Minimize custom styling** — prefer HeroUI props over bespoke Tailwind/Uniwind classes.
8. **Never copy ⚠ legacy implementations or undefined tokens.**
9. **Keep web and mobile visually aligned** (tokens/semantics) while respecting platform conventions.
10. **Maintain accessibility**: label inputs, pair color with text/icons, keep focus rings, use `FieldError`/`isInvalid`.
11. **Use the theme system**: dark mode must work from the same tokens (`dark:` web / `@variant dark` + `COLORS.dark` mobile).
12. **Verify against this document** before writing styling code; when in doubt, match the nearest production screen.
13. **Keep the token source honest**: a genuinely missing token goes into `packages/constants` + both `globals.css` + `design-tokens.json` — never hardcode ad hoc values.

---

## Appendix: Token Sources

| Concern | File |
|---|---|
| Color tokens | `packages/constants/src/colors.ts` |
| Font families/weights | `packages/constants/src/typography.ts` |
| Web theme mapping | `apps/web/app/globals.css` |
| Mobile theme mapping | `apps/mobile/app/global.css` |
| HeroUI Native base vars | `apps/mobile/node_modules/heroui-native/lib/module/styles/variables.css` |
| Machine-readable tokens | `design-tokens.json` (repo root) |
