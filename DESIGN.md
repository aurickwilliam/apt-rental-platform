# DESIGN.md — APT (A Place to Thrive)

Canonical design guide for the APT rental platform (Philippines, CAMANAVA focus). Single source of truth for UI generation. Describes the **canonical** design system (standards future work must follow) and flags legacy implementations that must not be propagated.

Status markers: ✅ **Canonical** (follow) · 🚧 **Transitional** (token-correct custom; reuse, prefer HeroUI when writing new) · ⚠ **Legacy** (reference only; never copy).

---

## 1. Design Philosophy

**Product personality:** Friendly, trustworthy, professional. APT connects tenants and landlords in Metro Manila — approachable and dependable, like a well-run local brokerage.

**UX goals:** rental discovery/application/payment/management feel simple and low-risk; trust through verification (Verified chips, shield icons everywhere); money is always explicit (prices, move-in breakdowns).

**Visual identity:** blue and sky: primary blue `#376BF5` + sky `#0369A1` (dark `#7DD3FC`) as the second blue, soft blue (`primaryLight` fill + brand-blue label) for secondary buttons (mobile light mode: neutral tertiary look), yellow `#FBBF24` for ratings only (mobile and web ✅; uses and the web overall-score exception are listed in §3); clean, spacious, card-based; rounded geometry (10–24px); flat surfaces with hairline borders, minimal shadows.

**Mobile-first:** the Expo app is the primary product; web mirrors its palette and semantics. Design mobile-first, adapt to web.

**Accessibility:** status colors never used alone (paired with text/icons); visible focus rings (`#376BF5`/15% web, `border-focus` mobile); `FieldError` + `isInvalid` on inputs; required `*` markers; muted text no lighter than `#6C757D`/`gray-500` at scale. No `prefers-reduced-motion` handling exists — keep motion minimal (§17).

---

## 2. Source of Truth

Authority order (conflicts resolve to the lowest number):

| # | Source | Authority |
|---|---|---|
| 1 | `packages/constants` — `colors.ts`, `typography.ts`; mobile neutral roles in `apps/mobile/constants/theme.ts` | Design tokens |
| 2 | `apps/web/app/globals.css`, `apps/mobile/app/global.css` | Token mapping (Tailwind/HeroUI theme) |
| 3 | Shared components (per-app `components/`) | Component patterns |
| 4 | HeroUI (`@heroui/react`) / HeroUI Native (`heroui-native`) | Primitive implementation & behavior |
| 5 | Existing production screens | Layout patterns, composition |
| 6 | Legacy components / dead code | Reference only — §24 |

---

## 3. Brand & Color

All values exact. Shared light/dark pairs from `packages/constants/src/colors.ts`; mobile neutral roles from `apps/mobile/constants/theme.ts`; mappings in both `globals.css` files.

### Brand

| Token | Light | Dark | Notes |
|---|---|---|---|
| `primary` | `#376BF5` | `#5B8BF7` | Buttons, links, active states, accent surfaces |
| `primaryLight` | `#EFF6FF` | `#1A2340` | Tinted backgrounds (role chips, info accents) |
| `primaryLightForeground` (mobile `--color-primary-light-foreground`, web `--secondary-foreground`) ✅ | `#2F5FE0` | `#5B8BF7` | Soft blue secondary-button label on `primaryLight` (5.0:1 / 4.8:1). Brand `#376BF5` on `#EFF6FF` is only 4.2:1, so the light label is one step deeper |
| `sky` (mobile `--color-secondary`, web `--sky`) ✅ | `#0369A1` | `#7DD3FC` | Second blue: landlord role (chip, role tab), accordion underline, highlights. Never a fill behind white text in dark mode |
| `skyLight` (mobile `--color-secondary-light`, web `--sky-light`) | `#E0F2FE` | `#0C2A3D` | Sky tints (landlord chip; sky label 5.2:1 / 8.9:1) |
| `chartSky` ✅ | `#0891B2` | `#0891B2` | Chart series beside `primary` (sky `#0369A1` is too close to brand blue to tell apart; cyan passes the CVD and normal-vision checks in both themes) |
| `rating` ✅ | `#FBBF24` | `#FBBF24` | Star icons and rating bars. By explicit visual direction, the shared web apartment rating breakdown's large overall score also matches this yellow; this is a low-contrast exception on light surfaces. Other rating numbers stay text colors |
| `secondaryForeground` | `#FFFFFF` | `#FFFFFF` | White foreground (icons/text on filled buttons) |
| `actionMore` / `actionPin` / `actionArchive` ✅ (mobile) | `#6B7280` / `#D97706` / `#7C3AED` | same | Conversation swipe actions only: filled circles with white icons (≥3:1), label below in text color |

### Surfaces & backgrounds

| Token | Light | Dark | Notes |
|---|---|---|---|
| `white` | `#FFFFFF` | `#121212` | Card/surface base |
| `surface` (`--background` web) | `#F8F9FA` | `#1E1E1E` | Shared palette / web page background; not the mobile default |
| `bg-background` (mobile) | `#F5F7FB` | `#121212` | Cool-gray screen and navigation background |
| `bg-grouped-background` (mobile) | Same as mobile `bg-background` | Same as mobile `bg-background` | Grouped settings / card-section backdrop |
| `surfaceRaised` | — | `#2A2A2A` | Mobile elevated surface |
| `bg-surface` (mobile) | `#FFFFFF` | `#1E1E1E` | Default card surface |
| `surface-secondary` (mobile) | `#F1F3F5` | `#242424` | Sheets, dropdowns, sticky footers |
| `surface-tertiary` (mobile) | `#E9ECEF` | `#2A2A2A` | Skeletons, neutral icon tiles, muted fills |
| `bg-overlay` (mobile) | `#FFFFFF` | `#242424` | Dialogs, white cards on grouped backgrounds, nested cards |
| `border` (mobile) | `#E5EAF2` | `#3D3D3D` | Subtle decorative hairline card borders |
| `backdrop` (mobile) | `oklch(0% 0 0 / 20%)` | `oklch(0% 0 0 / 40%)` | Sheet/dialog overlays |
| web `--card` | `#FFFFFF` | `oklch(0.205 0 0)` | shadcn card token |

Mobile light mode uses a soft cool-gray `bg-background` (`#F5F7FB`) behind white `bg-surface` cards with subtle `#E5EAF2` hairline borders. Main screens, forms, details and navigation inherit the same background. `ScreenWrapper background="grouped"` (or `bg-grouped-background` for a section) uses the same cool-gray backdrop; grouped Settings cards remain white via `bg-overlay`. Nested cards may also use `bg-overlay`. Keep spacing and typography as the primary hierarchy; do not add heavy shadows. Brand buttons, status panels, image viewers and receipts retain their intentional backgrounds. Dark mode has separate screen, card and muted-fill layers; web is unchanged.

Mobile inline colors come from `apps/mobile/constants/theme.ts` through `useColors()`; CSS maps the same surface roles in `apps/mobile/app/global.css`, with parity and contrast tests in `constants/theme.test.ts`. Shared `COLORS` stays unchanged for web and brand/status values. Mobile secondary text (`textSecondary`, `gray500`, `text-muted`) is `#626B73` / `#9CA3AF`, readable on all neutral fills (at least 4.5:1). Light `text-accent` retains the deeper blue `#2F5FE0` for readable labels on cards and screen backgrounds; the primary button fill remains `#376BF5`. Decorative surface boundaries need not reach text contrast ratios.

### Text & neutral

| Token | Light | Dark | Usage |
|---|---|---|---|
| `textPrimary` / `--foreground` | `#333333` | `#F0F0F0` | Primary text (not pure black) |
| `textSecondary` / `gray500` / `--muted-foreground` | `#6C757D` | `#9CA3AF` | Secondary text, labels, metadata |
| `gray400` | `#9CA3AF` | `#6B7280` | Placeholders, disabled, tertiary |
| `gray300` | `#BDBDBD` | `#3D3D3D` | Placeholder-level, chip borders |
| `gray200` | `#D1D5DB` | `#2A2A2A` | Borders (`--border` web), dividers |
| `gray100` | `#E5E7EB` | `#1E1E1E` | Muted fills, hairline dividers |

Mobile `gray-500` is `#626B73` (dark `#9CA3AF`), matching mobile secondary text. Web's `grey-*` is a separate shifted scale (`grey-700 #6C757D` … `grey-200 #E5E7EB`) — prefer `gray-*`/COLORS tokens.

### Semantic

| Token | Light | Dark | Usage |
|---|---|---|---|
| `success` / `successLight` | `#22C55E` / `#E6F4EA` | `#4ADE80` / `#14291E` | Paid, verified, approved |
| `warning` / `warningLight` | `#FACC15` / `#FFF8E1` | `#FDE047` / `#2A2410` | Pending, partial |
| `successText` / `warningText` (mobile `text-success-text` / `text-warning-text`) ✅ | `#166534` / `#92400E` | `#4ADE80` / `#FDE047` | Status text and the icon beside it (Verified, Visit confirmed, Pending Verification, property status chips, receipt titles). The base `success` / `warning` are fills and dots only: as text they are 2.3:1 / 1.5:1 on white; these are 6.3–7.1:1. Dark keeps the bright values. On mobile, `warningLight` / `successLight` switch to their dark values in dark mode |
| `danger` / `dangerMid` / `dangerLight` | `#E50914` / `#FF4B4B` / `#FDA4AF` | `#F87171` / `#FCA5A5` / `#2D1515` | Destructive, errors, rejected |
| web `--destructive` | `#E50914` | `oklch(0.704 0.191 22.216)` | Destructive actions |

### Web-only theme (`apps/web/app/globals.css`)

The shared landlord Google map container (including the posting preview's loading placeholder) and the create-listing description textarea use the web `rounded-3xl` radius token.

The shared landlord Google map picker and its read-only listing preview follow the resolved Appearance theme using Google's native light/dark map color scheme. Theme switches preserve the selected pin, camera position and zoom. Only standard Map (`roadmap`) view is available; the Map/Satellite switch is disabled. Latitude/Longitude values and placeholders explicitly use Inter; labels remain Nunito. No CSS inversion/filter is applied to map tiles or controls.

`:root`: `--radius 0.625rem`, `--background #F8F9FA`, `--foreground #333333`, `--card #FFFFFF`, `--primary #376BF5`, `--brand #376BF5` (dark `#5B8BF7`; `text-brand` for headings and links, like mobile `text-accent`), `--secondary #EFF6FF` / `--secondary-foreground #2F5FE0` / `--secondary-hover #E2ECFE` (soft blue; dark `#1A2340` / `#5B8BF7` / `#1C2647`), `--sky #0369A1` / `--sky-light #E0F2FE` (dark `#7DD3FC` / `#0C2A3D`), `--color-rating #FBBF24`, `--muted #E5E7EB`, `--muted-foreground #6C757D`, `--accent #EFF6FF`, `--destructive #E50914`, `--border #D1D5DB`, `--ring #376BF5`. HeroUI themed purely by `--heroui-primary/--heroui-focus` (no `HeroUIProvider` config); dark mode keeps `--primary #376BF5`.

⚠ Undefined legacy tokens: `redHead-*`, mobile `grey-*`, `text-text`, `darkerWhite`, `mediumGrey`, `COLORS.redHead`; tenant pages' one-off `zinc-*` palette (§24.2, §24.5).

---

## 4. Typography

Two families (via `packages/constants/src/typography.ts`, both platforms):

| Role | Family | Weights |
|---|---|---|
| Body | **Inter** (`Inter_24pt-*` / `font-inter`) | regular |
| Primary text & labels | **Nunito** (`Nunito-*` / `font-nunito`) | semibold, bold |
| Headings | **Nunito** (`Nunito-*` / `font-nunito`) | regular, medium, semibold, bold |

Web loads via `next/font/google` (`--font-inter`, `--font-nunito`). Mobile classes: `font-inter` (body copy), `font-nunitoMedium/SemiBold/Bold`. On mobile, all emphasized text (titles, section headers, card titles, labels, values, prices, tab/badge labels) uses Nunito — Inter medium/semibold classes (`font-interMedium`/`font-interSemiBold`) are web-only.

The web tenant Maintenance and Favorites headers follow the APT Passport header: Nunito bold `text-3xl text-primary`, a 28px icon in a `size-11 rounded-lg bg-primary/10` tile, and a `mt-1 text-sm text-muted-foreground` description below the full title row (aligned with the icon's left edge).

Landlord My Properties, Applications, Maintenance Requests and Payments use the same APT Passport heading treatment in loaded and skeleton states: building, document-check, tools and banknote icons respectively. Existing descriptions remain; the Payments heading itself carries no controls and no Back button (including loading/empty/error states). Payment detail navigation and the landlord Dashboard heading are unchanged.

Below its unchanged heading, landlord web Applications uses four tinted summary cards (total, approved, rejected, pending), a responsive search/status/property/location/submission-date filter row and a bordered results panel with sorting. The six-column desktop table includes tenant avatars, property thumbnails, location and move-in/submission date details, icon-and-label status chips, and an application-detail action menu; smaller screens use cards. Pending is the display label for the existing Applied state; cancelled records remain in the total and filters. Loading mirrors the full layout without zero counts; errors show unknown summary values and Retry. Filters and sort order are URL-backed and update the already-loaded list without extra requests.

Landlord web Maintenance preserves its heading and follows the same list treatment: total/resolved/in-progress/cancelled summaries, property/status/urgency/reported-date controls, a location selector under Filters, and an eight-column desktop table with issue descriptions, listing thumbnails/rent, location, tenant avatar/email, reported date/age, urgency, status and request-detail actions. Pending remains filterable and included in totals. Small screens use cards; loading matches the full layout. Filters/sorting are URL-backed, headers/placeholders have explicit readable colors, and hover/focus prefetching retains existing request workflows and badge behavior. Public listing thumbnails remain distinct from private maintenance photos.

The landlord web Maintenance Request detail route and client loading reuse `MaintenanceDetailSkeleton`, matching the existing request header, property/tenant fields, description, photo thumbnails, resolution notes, fee and action placeholders without changing the loaded design. The Back control prefetches the maintenance list on hover/focus and navigates to that known route even when the detail was opened directly; status actions, fees and private photos are unchanged.

Landlord web Payments keeps its single Filters drawer and places the Filters control on the payment list's year row — the same sticky row as the "This Year" tag, right-aligned — instead of the page heading. Each year group keeps its own row; the control rides the current-year group, falling back to the first group shown when that year has no payments, so it is never duplicated and never disappears. Filtering, sorting, the drawer, the per-unit selection, the empty-state Clear filters and the payment rows are otherwise unchanged.

Landlord web Application Details uses one responsive card layout: property and applicant summaries, icon-led application/employment/preferences/previous-landlord sections, and separate supporting-document and message cards. Private-document rows distinguish missing attachments, loading previews and unavailable previews; verified badges still come from Passport verification. Decision actions appear only for pending applications, with approval disabled for occupied units. The detail route and client loading reuse one matching skeleton; list rows/cards and back navigation prefetch on pointer/keyboard intent. All styles are web-only and scoped to the detail cards.

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

**Conventions:** mobile screen titles and big stat values `font-nunitoBold` (`text-xl`+; e.g. `text-accent text-3xl font-nunitoBold`; brand blue, not orange); section headers `text-foreground text-lg font-nunitoSemiBold` + 24px icon; card titles `text-base/xl font-nunitoSemiBold`, labels `text-muted text-sm font-nunitoSemiBold`; web headers `text-5xl text-brand font-bold` + `text-sm text-muted-foreground` subtitle; labels HeroUI `Label` (web), required `*` in `text-danger`; web eyebrows/table headers `text-[11px] uppercase tracking-wider`; money `font-nunitoSemiBold` (line items) / `font-nunitoBold` (totals, stat values) in `text-primary`/`text-accent` via `formatPesoDisplay`; chat `text-sm leading-6` (body copy, `font-inter`).

The web create-listing flow uses Nunito for step/section headings, field labels, buttons, progress labels and preview card titles; Inter for body copy, entered values, help/error text and dropdown options. The scope also covers the portaled publish/discard confirmation dialogs, without changing shared browse components globally. Posting-form dropdown options use pill-shaped hover/focus/selection surfaces with 8px list padding and 12px horizontal item padding; HeroUI's minimum item height is retained.

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

The landlord web apartment detail gallery uses rounded images, a horizontally scrollable thumbnail strip with a selected-state ring, and the shared `PhotoGalleryModal` for full-size viewing. Edit Property is the primary header action; image and lease management stay in the Manage menu. Vacating a unit and removing a listing are separated with explanatory text, and both retain confirmation dialogs.

The landlord web Apartment Description page uses route-scoped `DescriptionSection` cards with blue icon tiles, sentence-case section headings, explanatory subtitles and labeled Edit actions. Main information pairs a rounded cover photo with lease-date/pricing tiles; unit specifications retain every field in responsive icon tiles, and perk chips use their existing amenity icons. Full description and perks render inline without redundant View all dialogs. The lease agreement heading and its two actions sit alongside each other on wide screens and stack on smaller screens. Its loading skeleton reuses the same section component and responsive layout; navigation prefetching is retained.

Landlord web Property Reviews fills the available content width with the same detail-page heading and back navigation. A stacked shared rating breakdown sits beside the tenant review list on desktop; smaller screens stack both sections. No-review states say "No ratings yet" rather than displaying a zero score. Review cards reuse the browse component with route-scoped spacing, retaining sorting, expandable comments and photo viewing. The route has its own matching skeleton and pointer/keyboard-intent prefetching in both directions; public browse styling is unchanged.

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
| Mobile | `@tabler/icons-react-native` | — (migrated 2026-08-29, 0 files; `lucide-react-native` removed) |
| Web | `@tabler/icons-react` | — |

The web uses `@tabler/icons-react` exclusively, including shared navigation and page content. Tenant and landlord portal sidebars mirror the admin portal's Tabler icons.

Sizes (stroke 2 default): tab bar 24 (focused filled `strokeWidth 2.5` / unfocused outline 1.8); header actions 24–26; section icons 24; inline/button 16–20; metadata 12–18; empty-state 64 (tenant bare primary) / 32–48 (landlord, in gray circle); status 18–26 (receipt check 48). Filled variants for active/selected; neutral `gray500`/`textPrimary`, emphasis `primary`/`secondary`. Never add a new icon library.

---

## 9. Buttons

**Canonical: HeroUI / HeroUI Native `Button`** (same variant system both platforms).

| Variant | Usage |
|---|---|
| `primary` (default) | Apply Now, Pay, Save, Verify, next steps. Mobile fill is always brand `#376BF5` (white text 4.6:1), also in dark mode |
| `secondary` | Supporting actions (View Description, View More Details; web also Cancel-in-dialog fallback, Skip, Search submit). Web: soft blue, `primaryLight` fill, no border, `primaryLightForeground` label (`.button--secondary` in `apps/web/app/globals.css`). Mobile: light mode uses the tertiary look (neutral `--default` fill, foreground label); dark mode stays soft blue (`--color-button-secondary*` per theme in `apps/mobile/app/global.css`). On a blue card, the main action is a white button with brand-blue text (Pay Now) |
| `tertiary` | Quiet in-content actions: Clear All, quick actions, row menus |
| `outline` | Bordered actions: browse CTAs, select triggers |
| `danger` / `danger-soft` | Delete, Reject, Logout dropdown item |
| `ghost` | Icon/utility: navbar, back, theme toggle, favorite, closes |
| Disabled / Loading | `isDisabled`; `isPending` + `Spinner size="sm" color="current"` |

Sizes `sm`/`md`/`lg`; modifiers `isIconOnly`, `fullWidth`/`w-full`, `h-20 flex-col` (web quick actions). Mobile composes `<Button.Label>`; icons in buttons 16–26px. Mobile button labels (HeroUI `Button` and `LinkButton`) are Nunito SemiBold app-wide via the `.button__label` rule in `apps/mobile/app/global.css`, so a label needs no font class (never set Inter on one).

**⚠ Legacy** (`apps/mobile/components/buttons/`): `PillButton` (h-14/h-12 pill, still in verify-account/document-id/payment flows; references undefined `redHead-*`/`grey-500` tokens), `OptionButton` (p-4 rounded-xl row + chevron), `RadioButton`, `CheckBox`. Never copy; migrate call sites when touched.

---

## 10. Inputs

**Canonical: HeroUI `TextField`/`Input`/`InputGroup`/`Select`/`TextArea`/`NumberField`/`Slider`/`SearchField`/`InputOTP`.**

- **Focus (web):** `border-gray-300` rest → `focus-within:border-[#376BF5] focus-within:ring-2 ring-[#376BF5]/15`; fields `rounded-xl bg-white`; no drop shadow on any HeroUI field (`--field-shadow` is transparent in `app/globals.css` for both themes)
- **Focus (mobile):** `border-focus` focused / `border-field-border` rest / `border-danger` error / `bg-surface-tertiary` disabled. Every mobile field (HeroUI `Input`, `TextArea`, `SearchField`, `InputGroup` and the custom `DropdownField`/`DateField`/`TimeField`) uses the same border on iOS and Android: 1px `border-field-border` at rest, 2px `border-focus` when focused or open, 2px `border-danger` when invalid, no shadow or outline. HeroUI Native's `Input` styles are patched to match (`patches/heroui-native@1.0.8.patch`; its stock styles hide the Android border and use an iOS outline), and `app/global.css` keeps HeroUI inputs on `--field-border`.
- **Labels** above field (`font-nunitoSemiBold` mobile / HeroUI `Label` web), required `*` in danger; **validation** `isInvalid` + `FieldError` (HeroUI) or inline `text-danger text-xs mt-1`
- **Password:** `InputGroup` suffix eye toggle (`IconEye/EyeOff size 20 gray400`) — on mobile use `components/inputs/PasswordField` (one field) or `NewPasswordFields` (new + confirm + live requirements checklist; met/unmet shown by icon shape and label, not colour alone); on web the same pair lives in `app/components/inputs/` (`PasswordField`, `NewPasswordFields`, with the checklist in `PasswordRequirementList`); **search:** `SearchField` w/ icon prefix, `rounded-full` on web browse; **selects:** `Select` with `rounded-xl`/`rounded-lg` trigger, `ListBox.Item hover:bg-light-blue!`; placeholders `text-gray-400`/`text-muted`

**🚧 Transitional (custom, token-correct, raw RN):** `DateField`, `DropdownField`, `UploadImageField`, `UploadFileField`, `TimeField`, `QuantityField`, `AppInput` — current implementation for apply/add-apartment/edit-profile flows; follow canonical border rules (`rounded-2xl h-12 border-field-border`). Prefer HeroUI for new code.

**⚠ Legacy:** `components/inputs/TextField` (border-2 rounded-2xl h-16, undefined tokens), `TextBox`, `SearchField`, `RangeSlider`, `MultiChipGroup`, `SingleChipGroup`.

---

## 11. Cards

Standard anatomy (both platforms): surface bg, hairline border, no shadow, rounded, `p-4`.

| Card | Spec |
|---|---|
| **ApartmentCard** (mobile ✅) | `bg-surface rounded-2xl border-border shadow-none`; square thumbnail; body `p-2 gap-2` grid / `p-3 gap-3` list; name `font-nunitoSemiBold text-base/xl`; location `text-muted text-[12px]/base`; price `text-accent font-nunitoSemiBold text-lg/xl`; `Verified` pill top-left (`bg-success-light`); favorite circle top-right (white/75) |
| **ApartmentCard** (web ✅) | `w-56 rounded-xl overflow-hidden hover:border-primary transition-all duration-200`; thumb `size-56 rounded-xl`; price `text-[15px] font-medium text-primary`; star `text-yellow-400` 18px; favorite `ghost isIconOnly bg-black/30` |
| **PropertyCard / rows** (mobile ✅) | `bg-surface rounded-3xl p-4 border-border`; thumb `w-20 h-20 rounded-xl` |
| **StatCard** (web ✅) | `p-4 gap-3 rounded-xl`; primary `bg-primary text-white`, others `bg-white border-grey-300`; icon chip `p-1.5 rounded-md`; label `text-base font-medium`; value `text-3xl font-semibold`; sub `text-xs` |
| **Dashboard hero stats** (mobile ✅) | `bg-primary rounded-3xl p-4` (label `text-sm text-gray-100 font-nunitoSemiBold`, value `text-3xl text-white font-nunitoBold`) or `bg-surface rounded-3xl border-border` |
| **PaymentSummaryCard** (mobile ✅) | `shadow-none rounded-3xl my-5`; title `text-accent text-lg font-nunitoSemiBold`; rows `text-sm`; `Separator my-3`; total `font-nunitoSemiBold text-accent` |
| **ReceiptCard** (mobile ✅) | GCash-style `bg-white rounded-t-2xl rounded-b-none`; success icon 48; dashed separators; scalloped bottom via `ZigzagEdge` (depth 13, tooth 20) |
| **RatingCard** (mobile ✅) | `rounded-3xl border p-3`; avatar sm + name/date; `StarRating` 14px; review `text-sm` w/ "Read more" >150 chars; thumbs `w-16 h-16 rounded-xl` w/ `+N` |
| **LandlordCard** (mobile ✅) | `rounded-3xl border`; avatar `size-12 rounded-full`; message icon button |
| **TenantCard** (mobile ✅) | `rounded-3xl border`; lease split-row (`py-2.5`, label `text-xs text-muted`, value `text-sm font-nunitoSemiBold`); tertiary actions |
| **PropertyOverview** (mobile ✅) | name `text-accent text-2xl font-nunitoBold`; rent `text-accent text-lg font-nunitoSemiBold`; specs `w-1/2` rows; images `rounded-2xl w-36 h-52` |
| **DashboardCard** (web tenant ⚠) | zinc palette — one-off, do not copy |

Pressable cards use `PressableFeedback` (mobile). Hierarchy: primary `rounded-3xl` (mobile) / `rounded-xl` (web), nested `rounded-xl`.

---

## 12. Lists

- **Mobile:** `FlatList` `gap-3`–`gap-16`, `contentContainerStyle paddingBottom: 84` when a floating bar exists; `ListGroup` for settings/profile (icon 22 + `font-nunitoSemiBold` title + `Separator mx-4`); `Separator` between items; pull-to-refresh uses the shared `PullToRefreshControl` gesture with its native indicator transparent and a `PullToRefreshIndicator` HeroUI spinner in `colors.primary`
- **Grid/list toggle (web):** document and favorites collections offer `isIconOnly size="sm"` buttons (`primary` = active, `ghost` = inactive, `aria-pressed`) with `IconLayoutGrid`/`IconLayoutList`; list rows are `rounded-2xl border p-3` with a `size-16 rounded-lg` thumbnail, title + meta, status chip, chevron
- **Web:** shadcn `Table` on `bg-darker-white`, header `text-[11px] tracking-wider`, rows `hover:bg-default-50` cursor-pointer, thumbs `w-12 h-12 rounded-lg`; search grids `grid-cols-1 sm:2 lg:4 gap-3`
- **Admin list filters (web)** ✅: shared parts in `app/admin/_components/filters/`, all HeroUI. Toolbar: `SearchField` (visually hidden label) plus an icon-only refresh `Button` on the left; **Filters** on the right (`Popover` with a `Badge` count; every choice is a selectable `TagGroup` pill group (`FilterPillGroup`: default-size `rounded-full px-3` tags, selected = solid `bg-primary` + white text, `multiple` or `single` with `disallowEmptySelection`), mirroring the mobile filter sheet; a custom date range adds a `DateRangePicker`; footer has ghost Reset and primary Apply) and **Sort** (`Dropdown` single selection). Below it, right-aligned under the Filters button, a `TagGroup` of removable active-filter tags with a ghost "Clear all" (hidden when no filters are on). Under the table, `AdminListFooter` centers the `Pagination` and right-aligns the "Showing X–Y of N" `Description`. Search applies as you type (debounced); sort and tag removal apply at once; popover changes apply on Apply. Applied filters update the toolbar instantly while results load; `PendingList` dims the current results and fades in a small spinner after a short delay (no full overlay). Sortable table headers (`Table.SortableColumnHeader`) share the Sort dropdown's URL value. All filter state lives in the URL
- **Messages list (mobile)** ✅: Messenger-style, no section headers. Pinned chats on top (tenant: the current landlord first, always pinned with a filled pin icon by the name), a `Separator`, then the rest (unread first). Archived chats open from an icon-only `ghost` `IconArchive` (26, `gray500`) button at the top right of the "Messages" title. Rows (`ConversationRow`) swipe **left** to reveal three actions: 56pt filled circles with white 24px icons and a `text-xs` label below (`actionMore` More, `actionPin` Pin/Unpin, `actionArchive` Archive/Unarchive); actions close the row; disabled actions are 40% opacity. The same actions are exposed as card accessibility actions. Holding a row (350 ms, light haptic) or tapping "More" opens an options-only `BottomSheet` (no name/apartment header or header divider, `min-h-14` icon rows: Pin/Unpin and Archive/Unarchive first — disabled at 40% opacity on the always-pinned landlord chat — then read state, profile, apartment, mute, and destructive Report/Block in `text-danger`). Muted rows show `IconBellOff` 14; marked-unread rows show a `size-3.5` danger (red) dot on the avatar and bold text. While loading, the list shows six `ConversationListSkeleton` rows (HeroUI `SkeletonGroup`) shaped like a row: `size-16` avatar circle, name + time, apartment and message lines
- **Chat emoji:** the chat box's emoji button swaps the keyboard for an inline 300pt `rn-emoji-keyboard` `EmojiKeyboard` panel under the input (message stays visible; stays open for several picks; the keyboard button or tapping the input returns the keyboard, and touching or scrolling the conversation closes it) and inserts at the cursor, replacing any selection. The reaction "+" uses the same library's expandable `EmojiPicker` sheet. Both share `useEmojiPickerSettings`: a Recently used tab (saved on the device in AsyncStorage), a search bar, categories on top, and app colors in light and dark (`surface` panel, `surfaceSecondary` category bar and search, `primary` active icon on `primaryLight` / dark `surfaceTertiary`).
- **Chat:** inquiry chats (no active tenancy between the two at that apartment, either portal) float an apartment strip (`ChatApartmentCard`) under the header while messages scroll beneath: full width and flush with the header, `bg-background border-b border-border` `PressableFeedback`, `px-4 py-2.5` row with a `size-14 rounded-xl` cover thumbnail (`IconBuilding` on `bg-surface-tertiary` fallback), name `text-sm font-nunitoSemiBold`, "Barangay, City" `text-xs text-gray-500`, rent `font-nunitoBold text-primary` + "/ month", `IconChevronRight` 18; tapping opens the apartment, and the list pads its top edge by the card's height. The start of every conversation shows an intro card (`ChatEmptyState`): `size-24` avatar with a 2px `border-border` ring, name `text-xl font-nunitoBold` with a filled `IconRosetteDiscountCheckFilled` 20 in `primary` when the account is verified, a `text-sm text-gray-500` context line "Landlord · Apartment" / "Tenant · Apartment" (from the active portal), small `tertiary` rounded-full "View profile" / "View apartment" buttons (16px `textPrimary` icons), and a `text-xs text-gray-500` `IconShieldCheck` payment-safety line. `ChatBubble` `max-w-[80%] mb-4`, sent `self-end` / received `self-start`; "Seen" (`text-[11px] font-inter text-gray-500`, right-aligned under the bubble) marks the newest sent message the other person has read, hidden once they reply (`getSeenMessageId`); it loads from `chat.is_read` and updates live through the chat channel's `messages_read` broadcast; consecutive bubbles from the same sender form a run (Messenger style): the gap inside a run tightens to 4pt (the full 16pt stays below a bubble with a reaction badge) and text bubbles shrink the sender-side corners where they meet to 6pt (`rounded-3xl` 24pt elsewhere; first/middle/last via `getBubbleGroupPosition`, also on the held clone); received bubbles sit after a 40pt gutter (`w-8 mr-2`) holding the sender's `size-8` avatar (`SenderAvatar`, HeroUI `Avatar` with initials fallback, taps open their profile) beside only the newest bubble of each consecutive run, bottom-aligned, with received bubbles capped at `max-w-[75%]` (the held clone shifts by the same gutter); inverted list (newest at bottom) with history paged in 30-message keyset loads at the top edge — loading indicator at the history edge, never a full-screen spinner; swiping a bubble toward the middle (received → right, sent → left, like Messenger; `SwipeToReply`) starts a reply: the bubble follows the finger up to 80pt with resistance past 56pt, a 32pt `bg-surface-tertiary` reply-arrow circle fades in behind it, a light haptic marks the 56pt threshold and the bubble springs back on release (also a "Reply" accessibility action; not on messages still sending); swiping the chat left (anywhere except a sent bubble, whose swipe left is a reply) shows every bubble's send time iMessage-style while held: sent bubbles slide up to 72pt left, each time fades in at the right edge (`text-[11px] font-inter text-gray-500`, e.g. "4:39 PM", hidden while sending), and everything springs back on release (`TimestampRevealRow`); holding a bubble (350 ms, light haptic) blurs the chat (expo-blur; on Android the chat is wrapped in a `BlurTargetView` and the backdrop uses `blurMethod="dimezisBlurViewSdk31Plus"`, plain tint below Android 12) and shows a centered stack — quick-reaction pill (`ReactionStrip`: HeroUI `Surface` `rounded-full shadow-lg` with icon-only ghost `Button`s, current reaction `bg-accent/15`) above, the lifted bubble, and the actions card (`HoldMenu`: HeroUI `ListGroup` with the timestamp then Reply, Copy, Unsend items (`py-2.5`), one `Separator mx-4` under the timestamp only, disabled items 40% opacity, Unsend in `text-danger`) below — aligned to the bubble's side. The bubble springs from its place in the chat to the center and the pill/card scale in from its side (`HoldStack`; no motion with Reduce Motion)
- **Chat (web)** ✅: mirrors the mobile conversation affordances using existing tokens only. Reactions render as pills under the bubble (own reaction highlighted, `bg-muted`/`bg-card` surfaces, `rounded-full`); a hover strip of quick reactions anchors above the bubble and flips below when the group nears the top of the scroll container. Right-click, double-click, or long-press opens a `MessageContextMenu` (quick reactions, timestamp, Reply, Copy) in `bg-card` with a hairline `border-border`. Replies render a quoted block above the bubble (`bg-muted`, `text-sm text-muted-foreground`, `line-clamp-2`) and an `IconX` cancel affordance above the input; a missing original shows an italic "Original message unavailable" block. Icons are `@tabler/icons-react` (`IconChevronLeft`, `IconMessage`, `IconCornerUpLeft`, `IconCopy`, `IconPlus`, `IconX`, `IconPhoto`, `IconPlayerPlay`, `IconPaperclip`). Attachments remain a text placeholder — web has no upload path.
- **Notifications:** `NotificationCard` (mobile) — `Card bg-surface rounded-3xl border p-4 shadow-none`; type icon 20 tinted by type + title `text-base` (`font-nunitoBold` unread / `font-nunitoSemiBold` read) + message + optional quoted preview (`IconMessage` 12 muted + `text-xs text-muted`, single line — reaction notifications only) + footer time `text-sm text-muted`; unread adds `border-primary/30` + 10px `bg-primary` dot; tap marks read + deep-links. Screen header: filter `DropdownButton` (All/Payment/Message/Maintenance/Apartment/System) + "Mark all read" text button (shown while unread > 0)
- **Notifications (web)** ✅: `NotificationsOverlay` renders one HeroUI `Drawer` (right placement) per portal — consumer feed and the admin queue — opened by the shared `?notifications=open` query, with All/Unread filters, date groups, tap-to-read, "Mark all read", and a "Reset bell position" row. Feed rows carry the type icon, title, message, an optional quoted preview line (`IconMessageCircle` 12 + `text-xs text-muted-foreground`, single line — reaction notifications only) and relative time; the row is one button whose accessible name spells out title, message, preview and unread state. Trigger: one `size-11` circular bell (`border-border`, `bg-card/95` + `backdrop-blur-sm`, `shadow-sm`, `text-foreground/70`; hover/active primary tint, `focus-visible:outline-primary`), draggable with Pointer Events, snapping to the nearest content edge on release. Placement persists in `apt-notifications-fab:v1` as `{side, topRatio}` and is never rewritten by the automatic nudge. At rest the saved anchor is re-resolved against live DOM geometry from every `[data-fab-clearance]` control (messages composer, conversation header, contact list, payment footer, browse filter rail) with a 12px margin and a 12px viewport gap: same side when it has room, opposite edge when it does not, otherwise the least-obscuring slot. A `[data-fab-dock]` surface (the messages conversation header) wins over all of that: the bell parks inside its right end, vertically centred, and is not draggable there — so on Messages it can never cover the thread. The mobile menu entry stays the only trigger below `md`. Mark any new persistent control that must stay clickable with `data-fab-clearance`; mark a designated parking spot with `data-fab-dock`.
- Empty lists use the Empty State pattern (§15), never blank space

---

## 13. Navigation

### Web

- **Navbar** ✅ (AppNavbar/TenantNavbar): `sticky top-0 z-40 h-16 border-b border-divider bg-background/70 backdrop-blur-md backdrop-saturate-150`; `max-w-7xl mx-auto px-4 sm:px-6`; logo 100×40; links `font-medium`, active `text-primary`; avatar dropdown; `sm:hidden` hamburger panel; auth buttons `rounded-full`
- **Sidebar** ✅ (shared `AppSidebar`): `w-64` (256px), collapsible to `w-16` rail; items `gap-3`, active `bg-sidebar-primary text-sidebar-primary-foreground`, icons `w-5 h-5`; footer user block; content `bg-background min-h-screen w-full`. Collapse preference persists per portal (`admin-`/`tenant-`/`landlord-sidebar-collapsed`); mobile uses the `MobileSidebarNavigation` FAB menu with `pb-20 md:pb-0` content clearance.
- **Admin sidebar:** starts expanded at `w-64` with a collapse icon to the right of the linked logo. In the `w-16` collapsed rail, the APT mark becomes the expand control on hover or keyboard focus; icons stay centered with hover labels above the avatar menu. Save the preference locally; mobile retains its menu. Tenant and landlord portals mirror this behavior with their own storage keys and Tabler icons.
- **Footer** ✅: full-width `bg-primary text-white`; desktop `md:flex justify-between gap-10`; mobile HeroUI `Accordion`; socials `ghost isIconOnly bg-white/20 hover:bg-white/30` size 26; links `text-white/80 hover:text-white`; `Separator h-0.5 bg-white`
- **Create-listing progress** ✅: sticky circle-and-label stepper (Photos · Info · Pricing · Details · Preview), vertically centered with equal header padding and no top Back button; bottom Back/Continue navigation remains. HeroUI buttons make circles and labels one keyboard-accessible target with `aria-current="step"`. Previously reached steps stay available; backward jumps preserve the draft, forward jumps revalidate the current step (including the Info location check), and unreached steps stay disabled. Step navigation is disabled during location validation or submission.
- **Create-listing actions** ✅: the bottom left action is Cancel on step 1 and Back on steps 2–5; both bottom buttons have matching widths (up to 160px, shrinking equally on narrow screens). Cancel opens a discard confirmation with Keep editing (initial focus, preserves the draft) and Discard listing (clears the draft and returns to Properties); dismissing the dialog also preserves progress.
- **Create-listing number steppers** ✅: +/− controls fill 44px end columns with straight inner separators; the field group clips their outer corners. Hover/pressed backgrounds stay flush with the field border, with no inset rounding or pressed-state shrinking. Disabled behavior and the group's focus ring are retained.
- **Create-listing hierarchy** ✅: step titles are 24px Nunito Bold; section headings are 18px Nunito SemiBold with 8px extra space above; field labels are 14px Nunito Medium. Dropdown chevrons use `muted-foreground`, 20px size and a 2px stroke in both themes; HeroUI retains open-state rotation and disabled styling.
- **Create-listing pricing layout** ✅: Monthly Rent and Rent Due Day share an equal-width two-column row from the `sm` breakpoint, stacking on smaller screens. Security Deposit and Advance Rent remain paired in the row beneath; each field keeps its own help/error text.
- **Create-listing preview landlord/reviews** ✅: reuse the browse LandlordCard below Move-in Cost in the right sidebar, with the wizard's already-loaded profile and messaging hidden. A Ratings & Reviews section below Location shows the honest unpublished-listing empty state without review requests, fabricated scores or review actions. Landlord uses the sidebar card treatment; reviews remain flat.
- **Create-listing photo alignment** ✅: the preview uses ImageHeader's `sidebar-aligned` layout, with the same desktop column tracks and 12px gutter as the details/sidebar grid beneath. Thumbnail spacing is also 12px; single-image previews remain full width. Default browse galleries keep their existing layout.
- **Preview pricing emphasis** ✅: the monthly rent heading uses bold Nunito at 32px (36px from `sm`), with a smaller `/month` suffix. The cost breakdown uses a 40% muted fill for a softer background; published browse pricing stays unchanged.
- **Web browse/preview reuse** ✅: Step 5 reuses browse's ImageHeader, ExpandableDescription, Amenities, PriceCard, LeaseAgreementCard, LandlordCard and RatingBreakdown with draft data. PriceCard's opt-in `isPreview` disables tenant actions and suppresses its fixed mobile bar; normal browse behavior is unchanged. LeaseAgreementCard's optional `localFile` opens PDFs or downloads Word files through a local object URL (revoked when the file changes or the component unmounts), never uploading or sending the draft to an external viewer. Ratings stay at zero with an explicit no-reviews state; no unpublished-record fetches, related listings, favorites or share actions are added. Preview keeps its four-column details, fonts and wizard navigation.
- **Create-listing preview sections** ✅: photos sit directly on the page without an outer card or inset padding. Property Details starts with the listing name and address above four-column desktop icon rows. Main sections are flat and transparent with 20px vertical spacing and subtle bottom separators; a separator also sits above the Step 5 navigation. Move-in Cost and Landlord keep separate sidebar cards with `rounded-3xl`, themed card backgrounds, 1px borders and 20px padding. Shared web browse components keep their existing presentation; controls, photo/map rounding and preview-only disabled actions remain unchanged.
- **Create-listing amenities** ✅: the Amenities header has an info button opening a HeroUI modal with the same shared conflict rules as mobile and a Got it action. HeroUI SearchField includes a clear button. A separate Selected amenities (N) section shows all selections as removable tags regardless of the search query; available options below exclude selected/retired amenities and are search-filtered. Empty states and the required-selection error remain explicit.
- **Amenities search styling** ✅: visible 1px `border` at rest, primary border and 15% primary focus ring; search/clear icons use `muted-foreground`. The clear button is a 28px circle with a 16px × and a visible hover state; HeroUI keeps keyboard focus handling and hides it when empty.
- **Amenity chip styling (web posting)** ✅: selected tags mirror mobile's secondary/accent chips: soft neutral fill (50% muted/card mix, 75% on hover), pill radius, Nunito SemiBold blue labels (`secondary-foreground` for readable contrast) and 16px primary amenity icons, with removable × controls. Available amenity buttons use `bg-card` (white in light mode, themed card surface in dark) and primary-colored icons.
- **Create-listing pricing inputs** ✅: Monthly Rent and Rent Due Day start empty, with placeholders and required markers. Both use one 12px group inset, no extra input-side padding, and start-aligned text; the peso prefix has an 8px gap before the rent. Rent must be at least ₱1,000, but below-minimum entries are preserved rather than automatically raised: the shared pricing error appears below the rent on blur or Continue, clears when corrected, and blocks advancement. The due day must be 1–31; the move-in cost summary stays hidden until rent meets the minimum. Editing existing properties keeps their saved values.
- No breadcrumb usage in production pages; no route transitions

### Mobile

- **Tabs:** iOS = `NativeTabs` (system chrome, `tintColor primary`); **Android = floating pill** ✅ (`CustomTabBar`): absolute `bottom: max(insets.bottom, 16)`, `left/right 20`, `rounded-full bg-surface`, height 68px, inner `border p-1 gap-3`; focused icon filled 24 `primary` `strokeWidth 2.5` + label `text-[10px] font-nunitoSemiBold`; unfocused outline `gray300` `strokeWidth 1.8`; no badges
- **Stack:** `headerShown: false` globally; screens render their own:
  - `StandardHeader` ✅: `bg-accent`, `paddingTop: insets.top + 20`, `pb-5 px-4`, centered `font-nunitoBold text-lg` white, back chevron 24
  - `ChatHeader` ✅: `bg-accent`, height `insets.top + 56`, avatar `border-white`, name `text-base font-nunitoSemiBold`, sub `text-xs /70`
  - `ApplicationHeader` ✅ (multi-step flows: add apartment, rental application): `bg-surface px-5 pb-4`, title `text-2xl font-nunitoBold text-primary` with a muted "Step N of M" on the right, then a segmented bar (one `h-1.5 rounded-full` segment per step, `bg-primary` for done and current, `bg-border` ahead), then optional short step labels under it (current `font-nunitoBold text-primary`, done `text-foreground`, ahead `muted`). Exposes `accessibilityRole="progressbar"` with the step value. It is passed to `ScreenWrapper`'s `header` prop so it stays fixed while the form scrolls (it owns the top safe-area inset and has a `border-b border-border`). With `stepHrefs`, finished steps are tappable to go back (`router.dismissTo`), the same as pressing Back; with `furthestStep` and `onBeforeLeave`, steps already completed can also be jumped to forward, after the step being left re-checks itself (add apartment: `useAddApartmentProgress`, `furthestStep` in `useApartmentFormStore`). Add apartment uses the web stepper's labels (Photos · Info · Pricing · Details · Preview).
  - Inline role headers ✅ (tab screens): icon/logo + `text-accent text-2xl/3xl font-nunitoBold` + bell ghost (`IconBell 26 gray500`) — bell opens the role-aware notification center (`(notification)/tenant-notif` / `landlord-notif`)
  - Tenant Rentals with an active tenancy ✅ replaces the header with `RentalHero`: an edge-to-edge cover photo that extends under the status bar (status-bar height + about a quarter of the screen, min 200px), square corners, filled map pin, dark top/bottom scrim (`expo-linear-gradient`), white name (`text-2xl font-nunitoBold`) + address, an underlined white "View Description" `LinkButton`, and the bell in `tone="onImage"` (white on `bg-black/35`) at the top right below the status bar. Status-bar icons are white while the photo is behind them (`useLightStatusBar`, focus-scoped) and switch back, with a page-colored strip behind the status bar, once it scrolls away or is pulled down. Below it: Payment Summary, pending-applications card (when any), Quick Actions, Landlord, Maintenance (3 most recent requests, "View all", Request Maintenance unless one is open). These sections use 12px spacing; Quick Actions uses 8px between its heading and tiles with no extra row-bottom margin. Card padding and tab-bar clearance stay unchanged; the loading skeleton mirrors this spacing.
- Tabs — tenant: Rentals / Search / Chat / Profile; landlord: Dashboard / Units / Chat / Profile
- **Apartment detail page and Step 5 preview (mobile)** ✅: each property detail has its own `bg-surface rounded-2xl border border-border p-3` card in a two-column layout with 12px gutters. Description's icon/title sit outside its body card. The description body, Landlord and preview Move-in Cost retain cards with 20px side margins; the shared body-card shell uses `bg-surface rounded-3xl border border-border p-5`. Perks, Map, Lease Agreement and Ratings stay flat. The shared section shell defaults to plain and opts into `appearance="card"` only where needed. Loading placeholders mirror these choices; maps, individual review entries and controls retain their own styling. Web preview remains flat.
- **Count badges (mobile)** ✅: unread/new-item badges (notification bell, landlord quick actions for maintenance, visit requests and applications, Messages unread count and marked-unread dot) use `bg-danger` with white text. Active-filter count badges on filter buttons stay `bg-accent`.
- **Segmented tabs (HeroUI `Tabs`, mobile)** ✅: labels are Nunito SemiBold; the selected label is primary blue (`#376BF5` / dark `#5B8BF7`, `--color-tab-selected`), unselected `muted`. Set globally on `.tabs__label` in `apps/mobile/app/global.css`; screens don’t color labels themselves (Tenant and Landlord both use primary).
- Mobile sign-in is role-neutral (no Tenant/Landlord tabs). Role tabs remain on sign-up; Google users signing in with an incomplete profile choose their account type on the profile-completion screen instead.
- Dual-role mobile profiles offer a light-blue switch button directly above Logout to switch between authorized Tenant and Landlord portals (single-role profiles do not show it): `variant="secondary"` with a 15% tint of `colors.primary` (`${colors.primary}26`) as the fill and a 1px `${colors.primary}80` border, `IconSwitchHorizontal` 18 in `colors.primary` and a `font-nunitoSemiBold` label. The tint is derived from the theme primary so it stays visible on both the light and dark page background; the fixed `#EFF6FF` (`primaryLight`) was too close to the page colour.

---

## 14. Dialogs

### Web (HeroUI v3)

- **Modal** ✅: `Modal.Backdrop` → `Container placement="center" size="sm"|"lg" scroll="inside"` → `Dialog` with `CloseTrigger`, `Header/Heading (font-medium text-2xl)`, `Body`, `Footer`; blur backdrop for OTP. Tabbed settings modals (profile `SettingsModal`, admin `UserSettingsModal`) share one fixed size: `max-w-5xl`, `h-[calc(100dvh-2rem)] md:h-[85dvh]`, content scrolls inside the tab panel. Apartment photo lightbox uses shared `app/components/display/PhotoGalleryModal.tsx`: centered content-height container, `bg-black/80` backdrop, responsive `max-w-5xl rounded-3xl` card, contained rounded photo stage, Previous/Next buttons and selectable thumbnails.
- **Add document modal** ✅ (APT Passport, `app/components/passport/AddDocumentModal.tsx`): two steps in one `size="lg"` dialog widened to `max-w-3xl!` — type-card grid, then upload form (file drop zone + preview left, expiry/confirmation/legal notice right). Open state lives in the URL (`?add=1` picker, `?add=<type>` upload) so Back closes it and links can deep-open a type; dismissal is blocked while uploading (`isDismissable`/`isKeyboardDismissDisabled`, no close trigger). Legal notice is an inline disclosure, never a second stacked modal.
- **Apply flow (web)** ✅: guidelines `Modal` ("Before you apply", same copy as mobile `ApplicationGuidelinesSheet`) opens on the summary step and from a "View application guidelines" link; readiness problems render as `bg-danger/10 border-danger/20 rounded-2xl` cards with a `danger-soft sm` fix link; the "Your APT Passport is submitted automatically" notice is a `bg-accent border-primary/30 rounded-2xl` row with `IconInfoCircle`. Continue/Submit stay disabled until readiness is clear.
- **Drawer** ✅ (PropertyDetailsSheet): right `w-[500px] max-w-[90vw] z-60`; cover `h-56` w/ `bg-linear-to-t from-black/60`; section titles `text-xs font-medium text-primary uppercase`; ReadOnlyField (label `text-xs text-grey-500` / value `text-sm font-medium`)

### Mobile (HeroUI Native)

- **Dialog** ✅: `Portal > Overlay > Content`, `Close variant="ghost"` top-right; backdrop 20%/40%
  - `ConfirmDialog` ✅: footer `justify-end gap-3` — `ghost sm` cancel + `sm` confirm (default `danger`)
  - `ErrorDialog`/`SuccessDialog` ✅: icon 20 `danger`/`success`, title `text-danger`/`text-success-text`, dismiss `secondary sm`
  - `RejectDialog` ✅: `TextField` + `TextArea numberOfLines={3}`, footer `secondary` Cancel / `danger-soft` Reject (both `flex-1`)
- **BottomSheet** ✅: snapPoints `["85%"]` (filters) / `["50%","75%"]` (DropdownField); `enableOverDrag false`; handle `bg-[#D0D0D0] w-10`; `bg-surface rounded-t-[20px]`; sticky header `border-b border-border`; sticky footer `border-t pt-3` (Apply `flex-1 sm` + Clear All `tertiary sm`)
  - Tenant Quick Actions customization: five fixed slots preview the dashboard's 48px icon tiles with captions underneath (shared `QuickActionContent`); empty slots use matching dashed placeholders. Top-left red minus buttons on soft danger backgrounds remove shortcuts. Available actions use a scrolling three-column icon/caption grid without descriptions; unavailable-action explanations remain accessible. The sheet dynamically fits the remaining grid content up to 85% of screen height; the grid scrolls when capped, keeping selected slots and footer visible. Long-press drag or tap an action then a slot to place/move it; selected actions swap on occupied targets. HeroUI Native buttons and sheet, Gesture Handler/Reanimated drag preview, accent-highlighted valid targets. Reset edits the draft; Save commits; dismissal discards unsaved edits. Empty slots are never rendered on the home screen.
- **Legacy RN `Modal`** ⚠ (fade, `rgba(0,0,0,0.3)` backdrop): MoveInCost, DateField iOS picker, video — migrate when touched

---

## 15. Feedback

- Tenant Rentals monthly rent card: brand-blue rounded surface, "Monthly rent" heading with Pending/Paid status chip, 24px Nunito Bold amount followed by billing month and an unambiguous abbreviated due date on one line separated by a middle dot (no separator when the date is absent). Pending shows a prominent white Pay Now button alongside a 44px circular History icon button (white Tabler `IconHistory` on a translucent white fill, accessibility label "View payment history"); Paid retains the details and History, without Pay Now. The loading skeleton mirrors this amount-first layout.

- **Toasts** ✅ (web): `Toast.Provider placement="top end" maxVisibleToasts={3} className="top-4 right-4"`; `toast.success / warning / danger / toast(msg)`; descriptions and the close icon use `text-muted-foreground` (override in `globals.css`, because HeroUI's `text-muted` resolves to shadcn's light `--muted` background here); pass a Tabler `indicator` for a domain icon (e.g. `IconShieldCheck` on "Password updated")
- **Notification banner** ✅ (mobile in-app): realtime-driven HeroUI toast from `useInAppNotificationBanner` — foreground push substitute that works without push credentials; auto-dismiss; action press marks the row read and deep-links (role-aware); message-type toasts are suppressed while the matching chat is open (`shouldSuppressChatToast`)
- **Loading:** web `Spinner color="accent"` centered (`py-16/20`); `Button isPending`; mobile HeroUI Native `Spinner size="lg" color={colors.primary}` (`sm` for inline). Pull-to-refresh keeps the native `RefreshControl` gesture with transparent iOS/Android indicator colors; only the HeroUI spinner is visible.
- **Empty states** ✅: mobile — centered `gap-4 py-16/20`; tenant: bare icon 64px `primary` + `text-xl font-nunitoBold` title + `text-gray-400 text-base px-8` desc; landlord: icon 32–48px `gray500` in `bg-gray-100 rounded-full p-5/6` + `text-lg font-nunitoBold` title + `text-gray-500 text-sm` desc; optional CTA. Web — centered `text-default-400` ("No apartments found", `h-64`) or card-wrapped `text-sm text-default-500`
- **Skeletons** ✅ (mobile): HeroUI `Skeleton`/`SkeletonGroup` blocks `rounded-lg`/`rounded-full` sized to content; custom `ApartmentSkeleton` pulses opacity 0.45↔0.85 @ 700ms (Reanimated). Web: HeroUI `Skeleton` blocks with `bg-grey-300!` (shimmer), laid out to match the loaded page (landing, APT Passport, tenant payment); older screens still use `animate-pulse` divs (`bg-default-200`) 🚧; shadcn `Skeleton` internal only
- **Landlord Dashboard loading (web)**: route-level loading keeps the shared Dashboard heading and welcome text visible above HeroUI shimmer placeholders for the four statistics cards and chart panels. It preserves the loaded page's responsive grid and themed surfaces; the portal sidebar stays available during navigation.
- **Landlord My Properties loading (web)**: route-level loading keeps the shared title and description visible with HeroUI shimmer placeholders for the four statistics cards, Property Actions and property table rows. The skeleton follows the existing responsive grids and contains table overflow. Dashboard and My Properties also prefetch on sidebar hover/keyboard focus and when the mobile navigation menu opens; navigation keeps the shared portal shell mounted without artificial delays or page animations.
- **Landlord Applications loading (web)**: the route fallback and client data-loading state share HeroUI shimmer table rows on desktop and application cards below `md`. The heading stays visible; the route fallback includes search/filter placeholders, while client loading keeps the real controls and replaces the unknown total with a placeholder. Applications opts into the same sidebar hover/focus and mobile-menu prefetching as Dashboard and My Properties; prefetching warms the route, not the browser-fetched application records.
- **Landlord Maintenance loading (web)**: route and client loading reuse HeroUI shimmer placeholders for the six-column desktop table and mobile request cards (issue, property, tenant, date, urgency and status). The shared heading stays visible, the unknown total is a placeholder, and client loading keeps search/filters usable. Maintenance opts into sidebar hover/focus and mobile-menu prefetching; records still load through the existing client hook.
- **Landlord Payments loading (web)**: route, Suspense and initial unit loading share the Payments header, selector placeholder, year-row placeholder and HeroUI shimmer payment cards. Once units are available, payment loading replaces only the cards and the year tag while the real Filters control stays on that same year row, so unit selection and filters remain usable. Unit changes immediately hide the previous unit's payments while loading. Payments opts into sidebar hover/focus and mobile-menu prefetching; payment records are still fetched in the browser.
- **Error banners** (web): `mt-4 p-3 bg-red-200 border border-red-400 rounded-lg text-sm text-red-600`, shared as `app/components/display/ErrorBanner.tsx`; inline `FieldError` on fields
- **Status chips** ✅: web `app/components/display/StatusChip` (`tone`: `success | warning | danger | neutral`, `size` defaults to `sm`) wraps HeroUI `Chip variant="soft"` with the same `STATUS_COLORS` from `@repo/constants` as mobile: opaque background, 1px border and label color, switched for dark mode by the `.chip.status-chip` rule in `app/globals.css`. Pick the tone with the screen's status helper or `statusToneFor()` (`lib/status-tone.ts`) for raw status strings; never pass HeroUI `color` to a status chip. Settings rows explain an unavailable row with `app/components/settings/StatusChip` (`label`, e.g. "Signed in with Google"), a neutral `StatusChip`; `ComingSoonChip` is that chip with "Coming soon". Mobile HeroUI Native `Chip variant="soft"` keeps each screen’s size, padding, type, icons and placement; `useStatusChipStyles` reads theme-aware `STATUS_COLORS` from `@repo/constants` and `statusChipSurface` applies an opaque background and 1px border. Use the same foreground for `Chip.Label` and status icons; never use the bright base success/warning/danger tokens as text on light surfaces. Semantic palettes (background / foreground / border): success light `#DCFCE7 / #166534 / #86EFAC`, dark `#14532D / #BBF7D0 / #22C55E`; warning light `#FEF3C7 / #92400E / #FCD34D`, dark `#78350F / #FDE68A / #F59E0B`; danger light `#FEE2E2 / #991B1B / #FCA5A5`, dark `#7F1D1D / #FECACA / #EF4444`; neutral light `#F1F5F9 / #334155 / #CBD5E1`, dark `#1E293B / #E2E8F0 / #475569`. Use success for verified/approved/paid/resolved, warning for pending/in progress, danger for rejected/cancelled/unpaid, neutral for unknown/closed. Selection/filter chips and unrelated surfaces are not status chips.

---

## 16. Images

- **Thumbnails:** square (mobile `aspect-square`; `w-20 h-20` rows), `object-cover`/`contentFit="cover"`, `cachePolicy="disk"` (expo-image), gray placeholder `bg-gray-200` + icon
- **Web hero (browse detail):** `w-full h-128` grid — main `w-2/3` + up to two stacked photos in `w-1/3`, all `rounded-2xl hover:brightness-90 transition`; "See all photos" pill opens the shared gallery. With one photo, the main image fills the width.
- **Mobile hero:** `h-168 p-5 justify-end` w/ gradient, or full-bleed `h-80 rounded-b-3xl`
- **Ratios:** 1:1 thumbs, `w-36 h-52` gallery (≈3:4), `w-24 h-16` lightbox thumbs, `w-12 h-12` table thumbs
- **Avatars:** HeroUI `Avatar` sm/md/lg; profile `size-24 border-4 border-background` (overlapping the cover by `-mt-12`); initials fallback `bg-primary text-white` (web) / `bg-gray-100 text-accent` (mobile); landlord `size-12 rounded-full border`
- **Mobile Edit Profile** ✅: one shared tenant/landlord editor mirrors the web admin's cover photo with a horizontally centered, overlapping circular avatar and labeled camera buttons (`secondary`, icon-only; cover edit at top right), followed by Personal Information, Contact and Address cards (`bg-surface rounded-3xl border-border p-5`, `gap-5`). The photo-change description is centered beneath the avatar. Email, names, suffix and birth date show lock icons and muted read-only fields; mobile number, gender and PH address are editable. Preserve searchable cascading province/city/barangay selectors and editable city-filled postal code. Photos preview locally until Save Changes; Cancel (left) and Save Changes (right) share an equal-width row (`flex-row gap-3`, each `flex-1`). Save stays disabled with reduced opacity (`opacity-50`) when pristine or busy, including after edits are reverted. Cancel uses `danger-soft`; Cancel/back/swipe/hardware back confirm unsaved edits with Keep Editing / Discard, and leaving is blocked during saving. Reuse the shared success dialog and return to the active profile on dismissal. No new tokens.
- **Lightbox:** web browse/admin apartment details share `PhotoGalleryModal` (§14); mobile `react-native-image-viewing` (`presentationStyle overFullScreen`, `rgba(0,0,0,0.8)`)
- Private Supabase storage: always signed URLs at read time
- **PDF previews (web):** `app/components/display/PdfThumbnail.tsx` renders page 1 client-side with `pdfjs-dist` (lazy-loaded, only once the element scrolls into view, cached per storage path); falls back to a file icon. Use `cover` (top of page) in cards/rows and `contain` on detail previews. Mobile uses `react-native-pdf` (`PdfThumbnail.tsx`).

---

## 17. Motion

Conservative — functional, not decorative.

- **Press:** `activeOpacity={0.7}`; `PressableFeedback` Ripple/Highlight (mobile cards); `active:opacity-80` FAB
- **Hover (web):** `transition-all duration-200` (cards `hover:border-primary`), `hover:brightness-90` images, standard button hovers
- **Skeletons:** 700ms Reanimated opacity 0.45↔0.85; CSS `animate-pulse`
- **Sheets/dialogs:** HeroUI Native/HeroUI defaults (fade + slide); legacy modals `animationType="fade"`
- **Page transitions: none exist** — do not add full-page animation systems
- Dark-mode: instant (next-themes; mobile `Uniwind.setTheme`, with a System / Light / Dark choice in Settings → Appearance)

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

**Web own-profile layout (tenant, landlord, admin)** ✅: all three portals share the admin profile layout: `mx-auto w-full max-w-7xl p-4` with `grid xl:grid-cols-[minmax(0,2fr)_minmax(300px,1fr)] gap-4`. The main column holds the header card (cover `h-28 sm:h-32`, `size-24` avatar, name, role and verification chips, "Joined" date) then the details card; the right column holds side cards: Verification Status (tenant/landlord, mirrors the mobile card: status line, description, Apply/Re-Apply button, progress timeline until verified), APT Passport (locked until verified) and Add-role for tenant/landlord, Account actions for admin. Cards are `rounded-3xl border border-border bg-card p-4 sm:p-5 shadow-none` with `font-nunito text-lg font-bold text-primary` headings. Admin-only information (activity log, internal ID) stays admin-only.

**Page widths (web portals):** every page shell is `max-w-7xl mx-auto px-4 py-6 sm:py-8`. Sidebar destinations (Profile, Favorites, My Rental, APT Passport) use the full shell; never nest a narrower centered column inside it. Detail pages reached from a list may cap content at `max-w-4xl`, short single-purpose forms at `max-w-2xl`; a section whose pages link to each other (e.g. APT Passport wallet ↔ document detail) keeps one width so the left edge doesn't jump. Use `lg:` two-column grids (sticky narrow aside + main) to fill wide screens instead of stretching a single card.

Favorites uses a bordered toolbar for the saved count, grouped grid/list controls and Browse action. Saved-card grids use one column below 36rem of content width, two from 36rem and three from 64rem, even with only one saved apartment (no full-width stretching or filler). The shared browse card has Favorites-only styling under `.favorites-grid`: 4:3 images, bordered flat surfaces, larger Nunito titles/prices and roomier padding. List cards keep those surfaces and typography, show unit details and monthly pricing, and stack below 36rem. Its route-level loading boundary keeps the shared Favorites shell/header visible with toolbar and card placeholders while server account checks finish, like Passport. Client data loading reuses the same card placeholders in the selected grid/list view; empty/error states provide Browse/Retry actions.

The web My Rental calendar marks today with a black circular border (no fill of its own), rent due with an orange fill, and the displayed month's last day with a primary-blue fill. Month navigation updates the month-end marker and legend together. When rent due falls on month end, orange takes precedence with a blue dot; today's border remains visible on either filled marker.

My Rental uses available content width (container queries), not viewport width alone, for its dashboard: rent/calendar and quick actions/landlord become two columns at 64rem of content width. Lease details use three columns only at 36rem of rent-card content width. Quick Action tiles fill equal-width, equal-height grid cells: one column below 28rem of card content, two from 28rem, four from 44rem. Narrow layouts wrap headers and signed-lease actions; payment history scrolls within its card, never the page. Loading placeholders mirror these layouts.

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
3. **Friendly** — rounded geometry, soft blue and sky accents, welcoming copy
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
| 6 | `lucide-react-native` on mobile | ~~ ~29 files (chat, settings, apartment detail, inputs; public landlord/tenant profile screens + manage-apartment migrated)~~ **Migrated 2026-08-29 — 0 files** (all 39 migrated to `@tabler/icons-react-native`; `lucide-react-native` removed from `apps/mobile/package.json` + `pnpm-lock.yaml`) | ✅ Migrated | `@tabler/icons-react-native` |
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
