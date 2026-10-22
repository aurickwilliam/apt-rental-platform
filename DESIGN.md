# DESIGN.md — APT (A Place to Thrive)

Canonical design guide for the APT rental platform (Philippines, CAMANAVA focus). Single source of truth for UI generation. Describes the **canonical** design system (standards future work must follow) and flags legacy implementations that must not be propagated.

Status markers: ✅ **Canonical** (follow) · 🚧 **Transitional** (token-correct custom; reuse, prefer HeroUI when writing new) · ⚠ **Legacy** (reference only; never copy).

---

## 1. Design Philosophy

**Product personality:** Friendly, trustworthy, professional. APT connects tenants and landlords in Metro Manila — approachable and dependable, like a well-run local brokerage.

**UX goals:** rental discovery/application/payment/management feel simple and low-risk; trust through verification (Verified chips, shield icons everywhere); money is always explicit (prices, move-in breakdowns).

Payment summaries for new tenancies, including the web My Rental overview, use the same server bill as checkout: label each amount with the month it covers (for example “October 2026 rent” and “November 2026 advance rent”), keep the security deposit on its own line, and show the total with the due date. Keep the amount breakdown to those lines — no ordinal wording such as “month 2” and no unrelated footnotes. The mobile Rentals overview is a compact exception: show “Move-in payment” and the server bill's total with the billing month, due date and existing actions, without allocation rows; the detailed breakdown stays on checkout. Confirmed month 2 coverage reads “Covered by advance rent”; any maintenance fees remain separate. A paid overview keeps the settled current month in its summary and shows the next payable month in the right-hand card. If the next calendar month was prepaid by the move-in advance, skip it and add one short coverage line naming that month. Pending bills link to the existing payment. Receipts retain this breakdown even while payment is pending, without labeling an unconfirmed amount as paid. Reuse the existing payment cards and HeroUI primitives; no new visual tokens are introduced. See `docs/move-in-billing.md` for the billing contract.

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

The landlord web Maintenance Request detail route preserves `MaintenanceDetailShell` with Back, the heading and a compact loading status. The client alone owns `MaintenanceDetailSkeleton`'s body: property/tenant fields, description, photo thumbnails, resolution notes, fee and action placeholders. The loaded Back control prefetches the maintenance list on hover/focus and navigates to that known route even when the detail was opened directly; status actions, fees and private photos are unchanged.

Mobile maintenance keeps its existing detail layout and HeroUI Native dialogs. Resolving optionally adds a fee with a decimal amount field and a second confirmation showing the amount, tenant, resolution note and next-rent application. The resolve dialog sizes to its full content without a scrolling body or a fixed height cap, keeping fields and action buttons together. Keep drafts after failures, clear them on close, and block dismissals/duplicate actions while saving. Tenant and landlord details reuse `components/maintenance/MaintenanceFeeCard`: a `bg-surface rounded-3xl` amount row with the shared status chip (pending “Added to next rent”, paid “Paid”, neutral “Waived”); omit it for uncharged requests. Only the landlord gets the separate “Waive fee” confirmation for a positive pending fee, with database refusal messages shown in that dialog. The compact Rentals payment card uses the server total for an outstanding bill, including maintenance-only bills when rent is already covered, without adding breakdown rows.

Landlord web Payments keeps its single Filters drawer and places the Filters control on the payment list's year row — the same sticky row as the "This Year" tag, right-aligned — instead of the page heading. Each year group keeps its own row; the control rides the current-year group, falling back to the first group shown when that year has no payments, so it is never duplicated and never disappears. Filtering, sorting, the drawer, the per-unit selection, the empty-state Clear filters and the payment rows are otherwise unchanged.

Landlord web Application Details uses one responsive card layout: property and applicant summaries, icon-led application/employment/preferences/previous-landlord sections, and separate supporting-document and message cards. Private-document rows distinguish missing attachments, loading previews and unavailable previews; verified badges still come from Passport verification. Decision actions appear only for pending applications, with approval disabled for occupied units. Route loading keeps `ApplicationDetailShell` and a compact loading status; only the client renders the body skeleton. List rows/cards and loaded back navigation prefetch on pointer/keyboard intent. All styles are web-only and scoped to the detail cards.

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
- **Text alignment (mobile):** Single-line HeroUI inputs use native font metrics (no explicit paragraph `lineHeight`), vertically centered text and no Android extra font padding. This is enforced in the shared Input patch after caller styles, so `text-sm` cannot lower the iOS editing baseline; search and password inputs inherit it. Font families, sizes and accessibility scaling stay unchanged. Multiline inputs (`TextArea`, expanding message fields) retain their own line height, padding and top alignment.
- **Labels** above field (mobile: Nunito SemiBold `text-base`, primary foreground; web: HeroUI `Label`), required `*` in danger; **validation** `isInvalid` + `FieldError` (HeroUI) or inline `text-danger text-xs mt-1`. Mobile `app/global.css` styles HeroUI's actual `.label__text` slot app-wide (not the outer `Label` container); `.label__text--is-invalid` turns labels danger red. Custom dropdown/date/upload labels follow the same treatment. Values, placeholders and helper text keep their own typography.
- **Password:** `InputGroup` suffix eye toggle (`IconEye/EyeOff size 20 gray400`) — on mobile use `components/inputs/PasswordField` (one field) or `NewPasswordFields` (new + confirm + live requirements checklist; met/unmet shown by icon shape and label, not colour alone); on web the same pair lives in `app/components/inputs/` (`PasswordField`, `NewPasswordFields`, with the checklist in `PasswordRequirementList`); **search:** `SearchField` w/ icon prefix, `rounded-full` on web browse; **selects:** `Select` with `rounded-xl`/`rounded-lg` trigger, `ListBox.Item hover:bg-light-blue!`; placeholders `text-gray-400`/`text-muted`

**🚧 Transitional (custom, token-correct, raw RN):** `DateField`, `DropdownField`, `UploadImageField`, `UploadFileField`, `TimeField`, `QuantityField`, `AppInput` — current implementation for apply/add-apartment/edit-profile flows; follow canonical border rules (`rounded-2xl h-12 border-field-border`). Prefer HeroUI for new code.

**⚠ Legacy:** `components/inputs/TextField` (border-2 rounded-2xl h-16, undefined tokens), `TextBox`, `SearchField`, `RangeSlider`, `MultiChipGroup`, `SingleChipGroup`.

---

## 11. Cards

Standard anatomy (both platforms): surface bg, hairline border, no shadow, rounded, `p-4`.

The web Profit & planning surfaces (Overview, Expenses, Budget, both drill-downs and the shared
editors) are documented in "Landlord profit & planning (web Overview)" below; this section stays
the shared card anatomy and the mobile finance cards.

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

### Landlord profit & planning (mobile) ✅

Above the earnings card, always show the applied property heading (Nunito bold) above the applied report month (Inter muted text): the property name under a “Filtered property” caption (Inter muted) when one is applied, or “All properties” when none is. Draft choices do not change either heading until applied.

`landlord/analytics` uses the standard cool-gray screen, white/dark `bg-surface` cards, hairline borders and 24px card corners. A white filter icon in `StandardHeader.rightComponent` opens one HeroUI bottom sheet (`components/finance/FinanceFilterSheet`) with Property / Month tabs, never nested selectors: Property has a searchable single-choice list with All properties; Month has year navigation and a three-column month grid limited to the last 24 months, with future/out-of-range choices disabled. Months with collected rent show a small brand-blue dot beside a “Rent collected” legend; nothing else sits under the legend in the loaded state. Indicators come from a separate 24-month collected-rent summary (never the chart payload) and follow the draft property; while it loads, each selectable month shows a dot-sized skeleton in the indicator slot (translucent white on the selected fill), and a failed summary shows a retry action without blocking month choice. Accessible month labels read “rent collected”, “no rent collected”, “rent data unavailable” or “outside report range”. The sheet content uses a full-height container with a flexing scroll region and a fixed footer: selection summary above equal-width Cancel (left) / Apply filters (right) buttons in one row. Apply commits both choices together; Reset changes the draft to All properties + current month; Cancel or dismissal discards the draft. Reopening starts on Property with search cleared and year set to the applied month. A badge counts non-default filters (specific property and/or a past month), and the button's accessible label includes the applied selections. The page starts with one `primaryLight` earnings panel; Nunito totals and labels, Inter explanations, right-aligned peso amounts. Overview / Expenses / Budget are HeroUI tabs; Add expense stays in the safe-area footer. Shared finance presentations live in `components/finance/` (`FinanceCard`, `FinanceHeading`, `MoneyRow`, `FinanceSelect`, `FinanceTabs`). Entry forms retain their HeroUI selectors and bottom sheets with keyboard-aware inputs.

Loading uses `components/finance/FinanceSkeleton`, not the dashboard's stat tiles, and mirrors the loaded page block for block: the property/month heading, the earnings panel (primary-light header, two summary rows, one action bar), the three-segment tab strip with its selected segment white, then the selected tab's cards — Overview: Needs attention, Income trends, Collection health, Your monthly plan and Property performance; Expenses: Review this month and Where expenses go; Budget: Budget versus actual and Planned reserves — and the Planning guidelines link. Placeholders reuse the same 20px page padding, card corners and 20px gap as loaded content. Drill-down routes use their own page-shaped placeholders (`PropertyPerformanceSkeleton`, `ExpenseTransactionsSkeleton`, `BudgetCategorySkeleton`) instead of the analytics chrome. Header filters and the Add expense FAB stay visible but disabled until loading finishes. The extended pill FAB floats over the report at the bottom-right, 20px from the right and 16px above the bottom safe area; no footer band reserves space beneath the content. Report content has bottom clearance so its final items can scroll above the FAB. Background refreshes retain existing content; placeholders are hidden from assistive technology behind one labeled busy state.

Full-page finance access and loading failures reuse the landlord `EmptyState` pattern (§15): muted icon in a circular surface, title, description, and an optional compact action. Access restrictions explain eligibility without a retry button; loading failures offer Try again. Inline finance errors remain separate from these full-page states.

The expanded earnings breakdown keeps only figures: it ends with a `LinkButton` ("How these figures are calculated", underlined Nunito SemiBold `primaryLightForeground` label) instead of explanatory paragraphs. The link opens one `AppDialog` ("Profit & planning guidelines") with headed sections for collected rent, operating income, improvements & planned reserves, expense review, payment dates & comparison, planning guidance (budgets, reserve goals and their limits) and what the report includes, plus a Got it action; the body scrolls inside the modal so the dialog title, close button and footer stay fixed. Guideline copy never sits on the card.

The Expenses-tab review card leads the tab, directly under the tab strip: a solid `primary` card with white heading and description. While the month is unreviewed it carries one white outline action (`bg-white border-white` with a `primary` label) whose fixed label "Mark expenses reviewed" never changes. Pressing it opens a `ConfirmDialog` ("Confirm expenses are complete") whose description states the commitment for the applied month and property (or "all my properties" plus zero-expense properties), with a tertiary "Keep reviewing" cancel and a primary "Confirm" confirm (reads "Confirming…" and disables while the review saves). A failure keeps the dialog open and shows the error inside it; success closes it and raises the "Expenses reviewed" toast. No inline statement, label swap or error sits under the card button, and switching tab, month or property closes the dialog and clears the error.

Add expense opens `/landlord/add-expense`, a full page with `StandardHeader`, a keyboard-aware scrollable form and a fixed safe-area footer with equal-width Cancel / Save expense buttons. Analytics passes only the selected property ID and month; drafts stay local. Creation uses `components/finance/ExpenseEntryPage`, while editing and deletion stay in `components/finance/ExpenseEntrySheet`, reached by tapping a transaction row on its category page; both compose the same `ExpenseEditor`. Plan a budget mirrors it: `/landlord/add-budget` is a full page with the same equal-width Cancel / Save budget footer, seeded from the report's month, property, category and plan type. Planned reserves has one Add action; goal calculations stay inside the budget form, not a separate suggestions card or category shortcuts. Tapping a property budget row opens `/landlord/edit-budget`, a full page loaded from the tapped plan ID; its identity fields are locked, it keeps inline validation and the same required indicators, and removal stays in the page form above the equal-width footer. Budget creation and editing both use `components/finance/BudgetEntryPage`, with its calculator in `BudgetGoalSheet`. Tapping a transaction on a category screen opens `/landlord/edit-expense`, the same full page titled "Edit expense" with the property locked and the two-step Delete expense action below the form; edits no longer use a bottom sheet.

Expense Amount uses the same `formatPesoDisplay` / `handlePesoChange` helpers as apartment posting: a peso prefix and live thousands separators, with a raw numeric draft for validation and saving. Decimals remain editable; the display length accommodates the maximum permitted amount including formatting.

Date paid uses the shared native `DateField` picker, not a typed date input, in both expense creation and editing. Future dates are disabled using the current Manila calendar day; the selected local calendar components are saved as `YYYY-MM-DD` without UTC conversion. Existing date validation remains the final client-side check.

Expense Property, Category, Expense treatment, Amount, Date paid and Description are required, with red asterisks on their labels and no separate required-fields legend. Submit reveals inline errors that update as the draft is corrected; invalid submissions never save. Invalid inputs/select triggers receive an explicit native `borderColor: colors.danger` and `borderWidth: 2` style, including while focused or open; removing the error removes that style. Do not rely on the `finance-field-invalid` CSS fallback alone for native error borders. The property must be in the landlord's owned list, category must be an expense category (not a reserve), and treatment must be operating or capital. Existing shared amount/date checks remain in use; descriptions must be nonblank and at most 200 characters. Defaults remain preselected.

Plan a budget's Property, Plan type, Category and monthly amount are required with the same red-asterisk labels, inline errors and `colors.danger` border treatment. Goal planning is an optional `Calculate from a goal` action, not inline form fields: it opens a persistent HeroUI bottom sheet with amount still needed/annual bill and months inputs, a transparent monthly suggestion, and one fixed-footer `Use suggested amount` action. The action is disabled until the goal is valid; dismissing the sheet discards its draft. The suggestion only fills the editable monthly allocation; it never saves automatically or moves money. An existing goal changes the action label to `Change goal`; the page does not repeat the goal amount, timeframe or suggestion. Goal values validate in the sheet before they reach the form; both amount inputs format pesos with `formatPesoDisplay` / `handlePesoChange` as they are typed. Reserves may use every category; spending budgets exclude the reserve-only emergency and vacancy categories. Create and edit use this same full-page form: Save and Cancel remain equal-width footer buttons, while an existing plan's Property, Plan type and Category are locked and its Remove budget action stays in the form.

Finance field labels (selectors, typed inputs and `DateField`) match `DropdownField`: Nunito SemiBold `text-base` in the primary foreground, danger red when invalid. HeroUI typed-field typography belongs on `Label.Text`, not the `Label` container. Typed values use Inter `text-sm` in the primary foreground. Section headings remain distinct Nunito treatments.

On Add expense and Plan a budget, the Property selector opens a fixed 90%-height sheet with a pinned `PropertySearch` field (shared with the report filter), a scrollable matching-property list, and a `primaryLight` selected-row fill with `primaryLightForeground` label and a checkmark. Selection closes the picker immediately; reopening clears search without changing selection. Keyboard expansion respects the top safe area. Category and Plan type selectors in expense and budget forms use the same soft-blue selected-row treatment and size their sheet to the option list (content-based sizing, no fixed snap point) so every option is visible as soon as the sheet opens, with no search field. Expense treatment opens at a fixed 50% height (dynamic sizing disabled), in both creation and editing.

The filter body uses one persistent `BottomSheetScrollView` across both tabs (the tenant Search filter pattern). Selected property rows use `primaryLight` fill with `primaryLightForeground` labels and checkmarks, not the neutral secondary-button background. Its action row lives in Gorhom's keyboard-aware `BottomSheetFooter`, outside the scroll content, with footer-height compensation on the scroll view. Keyboard expansion respects the top safe area (`fillParent` + `topInset`), restores the sheet on blur, and dismisses on drag or Done. Property search uses HeroUI `SearchField` with a leading search icon and a trailing clear button shown only for non-empty text; clearing restores the list without changing the selected property. Search never autofocuses; Cancel, Apply, Reset and tab changes dismiss the keyboard.

Charts use brand blue for collected rent and the soft red `dangerMid` for recorded spending, a text-color optional net-income line, and labeled legends/controls (never color alone: list the series beside `● Collected` to contrast the `◆ Expenses` glyph). Income has 3/6/12-month controls and selectable bars that update the month details card; category rows show the peso amount at the top and the category's share of the month's expenses at the bottom of the bar, and tapping one opens that category's transactions page for the applied month and property (when nothing is recorded the "Where expenses go" card shows the landlord `EmptyState` instead — receipt icon, title, description); the Budget tab's "Budget versus actual" and "Planned reserves" cards show the landlord `EmptyState` when the month has no budgets of that kind (target-arrow and shield icons, title and description), and both cards' Add actions lead with an `IconPlus` 18 in the tertiary button's label color; the cards group their budgets into one row per category (property count, summed limit and spending) and a category row opens that plan's per-property page; budget bars spell out overages even above 100%; collection segments open filtered rent lists; property bars switch collected/expenses/net and filter the report. Missing expense reviews show “Not calculated”, never zero-profit estimates; capital improvements, cash-month receipts, rental-period balances and reserve plans are explicitly distinguished. Reserve goals never look like funded savings.

Budget category rows in both Budget versus actual and Planned reserves use soft category fills, 16px corners (`rounded-2xl`), 16px inner padding and 12px gaps. The outer cards keep their standard surface color. These fills identify categories only, never financial status; labels and values retain foreground/muted text, and progress bars remain blue normally and red when over budget. Over-budget text on tinted rows uses `finance-over-budget-text` (`#C4111E` light / `#F87171` dark) for at least 4.5:1 contrast. `financeCategoryStyles.ts` maps category IDs to literal `bg-finance-*` utilities; `app/global.css`, `constants/theme.ts` and `design-tokens.json` carry matching theme values. No typography changes.

| Category | Light fill | Dark fill |
|---|---|---|
| Maintenance & repairs | `#EDF3FF` blue | `#1B2538` |
| Furniture & appliances | `#F3EEFF` lavender | `#282238` |
| Turnover & refurbishment | `#FFF0E6` peach | `#30251F` |
| Insurance | `#E8F5F3` teal | `#192C2A` |
| Taxes & permits | `#F7F1E5` sand | `#2B271E` |
| Owner-paid utilities & dues | `#EAF6FC` cyan | `#1B2932` |
| Management & payment fees | `#F6EDF5` mauve | `#302330` |
| Emergency reserve | `#EAF5EC` mint | `#1D2B21` |
| Vacancy & late-payment buffer | `#FFF5DF` amber | `#30291B` |
| Other | `#F0F2F5` cool gray | `#25282D` |

Category transactions is its own page, like property performance: a standard header titled with the category, the applied property (or “All properties”) with the report month, then that month's transactions for the category as rows that open the same expense editor sheet. The list pulls to refresh, offers Load more expenses for long months, and shows the landlord `EmptyState` when the category has nothing recorded. The page reads the applied month and property from route params, so it always matches the report that opened it. The Expenses tab itself ends at the category chart, with no transaction list: every expense is reached through its category page, while the Add expense button stays on the report.

A budget category is its own page in the same shape: a standard header titled with the category, the applied property (or “All properties”) with the report month and plan type, a plain-language totals line, and one `bg-surface border-border rounded-3xl` card per property holding that plan — the property name, its caption, the limit-versus-spending figures, the progress bar and the over-budget line, all with the report's 20px page padding. Reserve cards with a goal lead with the apartment name, then a vertically centered amount row (`items-center`): the saved allocation as `₱X / month` in bold accent text on the left, and the muted `Goal amount` label above the saved target on the right. Without a goal, a right-aligned header amount block beside the apartment name reads `Monthly allocation` and shows the saved monthly amount once, with no repeated amount below. When a goal and month count exist, a muted rounded inset at the bottom reads `Goal spread across N months. This is a plan, not money transferred.` No goal means no invented total or timeline. Never recalculate or replace the saved allocation for display. Reserves use individual padded cards, not a ListGroup or column headings. Cards open `/landlord/edit-budget`, pull to refresh, and fall back to the landlord `EmptyState` when nothing is planned for the applied scope. So the report reads one row per category and this page carries the properties under it.

---

### Landlord profit & planning (web Overview) ✅

`/landlord/analytics` is laid out for the web rather than mirroring mobile's single column. The title row keeps the icon tile and blue Nunito "Profit & planning" heading on the left; Guidelines (outline) and the primary action sit on the right, with the primary action rightmost and reading "Add expense" on Overview and Expenses and "Add budget" on Budget. A controls row follows: the Property `Select`, the month picker (a `Popover` with the year stepper and 12-month grid) and an icon-only Refresh on the left, and the Overview / Expenses / Budget tabs on the right. Below it are two independent columns (about 1.9fr / 1fr from `lg`) whose cards keep their natural heights; rows are never stretched to match. Left: the mobile-style soft-blue earnings summary, then the active tab's main cards. Right: Needs attention first (the review card takes its place on Expenses and Budget versus actual on Budget), then the tab's side cards. Needs attention is the one emphasized card: a solid brand-blue surface with a white count badge and one tile per open item (icon, semibold line, detail line, chevron) on a translucent white fill; items come from the same shared figures as before. Below `lg` the columns stack with Needs attention above the earnings summary. Overview: Income trends and the Property performance table on the left, the monthly plan and collection health on the right. Collected cash and billing-period balances are explicitly distinguished; losses retain a minus sign and unreviewed income stays unavailable. Motion: when the page opens or the tab changes, each column block rises 8px and fades in over about 320ms, the second block of each column 70ms later (`.finance-enter`, tab panel keyed by tab so switching replays it; month and property changes do not). It is disabled under `prefers-reduced-motion` and leaves no transform behind once it ends.

Tables are HeroUI `Table`s inside the card, scrolling horizontally on narrow screens: Property performance (sortable Collected / Expenses / Net income columns; unreviewed net income shows "Not reviewed" and sorts last; a row focuses the whole report), Transactions on the Expenses tab, and the two Budget tables. Progress uses the HeroUI `ProgressBar` recolored through `.finance-meter` (brand, destructive when over). Editors are right-hand `Drawer`s, not centered modals (see below); confirmation, collection and guidelines dialogs stay centered modals.

Property and month apply immediately and live in the URL: selecting one navigates like any link, so there is no draft, Apply or Reset. The month grid marks months with collected rent (loaded only while the picker is open; a failed load never blocks choosing a month) and disables months outside the 24-month window. The collection modal uses HeroUI status tabs, a desktop table and narrow-screen cards with bounded Load more. The full property-comparison route retains the report month and returns a property selection to Overview. Charts use the existing brand/danger colors with labeled series, keyboard month controls and 3M/6M/12M ranges. Report refreshes retain settled same-scope content; scope changes hide the preceding figures. Loading mirrors the earnings panel, tabs and Overview cards. Persistent toolbar actions carry notification-bell clearance. No new design tokens are introduced.

On the Expenses tab the left column holds the review card and then a Transactions table (Paid, Description with property and treatment, Category chip, Amount; a `Select` filters by category on the server, "Load more expenses" pages by keyset, "Export CSV" downloads exactly the loaded rows, and a row opens the editor drawer); the category bars sit in the right column. The Expenses tab carries the review card (mobile's copy: title, description and "Mark expenses reviewed"; the confirm dialog repeats the applied scope in one sentence and success raises the "Expenses reviewed" toast with "Operating income is now available for this month."), then the "Where expenses go" bars — one brand-colored horizontal bar per category with the amount and a "Previous comparable period" line, each an accessible button opening `/landlord/analytics/category-expenses` for the applied scope. The category drill-down (`/landlord/analytics/category-expenses`) uses the same two-column page as the report: a muted "Back to report" link, then the category title with its icon tile in the category's soft fill and an "Add expense" action (new expenses preset to that category). The shared property select, month picker and a single icon Refresh follow, and changing either stays on the category page. Left: the Transactions table (Paid, Description with property and treatment, Amount; no category column or filter because the category is fixed) with keyset "Load more expenses", Export CSV of the loaded rows, empty and retryable error states, and a row opening the editor drawer. Right: a "Category total" card filled with the category's soft color (total, share of recorded spending, meter, previous comparable period; every figure from the report's category rows, never from paged rows) and an "Other categories" card whose rows link to the other categories. Without a recognized category the title is "Expense transactions" and only the category list shows. Mobile's category screen shows the same solid total card (`CategoryTotalCard`, saturated colors in `financeCategoryStyles.ts`) under its heading and uses skeleton rows, not a spinner, while only the list loads. The `ExpenseEditorDrawer` (a right-hand drawer; toolbar "Add expense" for create, rows for edit) mirrors mobile's entry sheet on the web: required Property / Category / Expense treatment selects with asterisk labels, peso amount input, date and description; the two-step danger-soft delete lives below the form and closes quietly; validation messages and defaults come from `@repo/utils`; the date input pairs a real `htmlFor` label with its native control. Writes reopen the reviewed month, so income falls back to "Not calculated" exactly as on mobile.

On the Budget tab the right column is Budget versus actual as one tinted card per category, like mobile (category name and property count, spent / limit with the percent used, a meter that turns destructive when over, and the remaining or over-budget amount; a card opens the category page), and the left column holds Planned reserves as the same kind of tinted category card (name and property count, the planned monthly amount, "planned this month"); a card opens the category page where each property's plan is edited. Neither section is a table. There is no Needs attention or suggestions card; goals are set from the plan drawer's "Calculate from a goal" button, which opens a modal (amount still needed or annual bill, months to spread over, a transparent suggested monthly amount and a "Use suggested amount" button; closing it discards the draft) and applies only when the landlord uses the suggestion. The Budget tab keeps two separate sections, never mixing reserves with spending limits. "Budget versus actual" groups plans by the shared category order into one card per `(kind, category)`: the summed limit against recorded spending, the property count (or the single property's name), a brand progress bar that turns destructive when over, and the remaining or over-budget amount with a real percentage only when one exists (a zero limit shows no percentage). "Planned reserves" shows each category's planned monthly amount and the properties it covers, with its own empty state and an emergency/reserve Add preset. Web has no suggestions card or goal starters: the plan drawer keeps the optional goal and its transparent "Use suggestion", and the suggestion review that opened a plan from a card is gone (mobile keeps its suggestions section).

The category drill-down (`/landlord/analytics/budget-category`) lists each property's plan with the same arithmetic (reserves show the planned amount alone), a totals line, refresh, and a missing-category state for an unknown category; an unknown plan kind reads as spending limits. The shared plan drawer (`PlanBudgetDrawer`) creates and edits: property, plan type, category and month lock while editing, the amount stays editable, a "Calculate from a goal" button opens the goal modal (shown above) and a saved goal appears as "Goal: ₱ X over N months" under the button, removal is a two-step danger-soft action, and a plan removed while its editor is open shows a missing-record state instead of silently recreating it.

## 12. Lists

- **Mobile:** `FlatList` `gap-3`–`gap-16`, `contentContainerStyle paddingBottom: 84` when a floating bar exists; `ListGroup` for settings/profile (icon 22 + `font-nunitoSemiBold` title + `Separator mx-4`); `Separator` between items; pull-to-refresh uses the shared `PullToRefreshControl` gesture with its native indicator transparent and a `PullToRefreshIndicator` HeroUI spinner in `colors.primary`
- **Grid/list toggle (web):** document and favorites collections offer `isIconOnly size="sm"` buttons (`primary` = active, `ghost` = inactive, `aria-pressed`) with `IconLayoutGrid`/`IconLayoutList`; list rows are `rounded-2xl border p-3` with a `size-16 rounded-lg` thumbnail, title + meta, status chip, chevron
- **Web:** shadcn `Table` on `bg-darker-white`, header `text-[11px] tracking-wider`, rows `hover:bg-default-50` cursor-pointer, thumbs `w-12 h-12 rounded-lg`; search grids `grid-cols-1 sm:2 lg:4 gap-3`
- **Admin list filters (web)** ✅: shared parts in `app/admin/_components/filters/`, all HeroUI. Toolbar: `SearchField` (visually hidden label) plus an icon-only refresh `Button` on the left; **Filters** on the right (`Popover` with a `Badge` count; every choice is a selectable `TagGroup` pill group (`FilterPillGroup`: default-size `rounded-full px-3` tags, selected = solid `bg-primary` + white text, `multiple` or `single` with `disallowEmptySelection`), mirroring the mobile filter sheet; a custom date range adds a `DateRangePicker`; footer has ghost Reset and primary Apply) and **Sort** (`Dropdown` single selection). Below it, right-aligned under the Filters button, a `TagGroup` of removable active-filter tags with a ghost "Clear all" (hidden when no filters are on). Under the table, `AdminListFooter` centers the `Pagination` and right-aligns the "Showing X–Y of N" `Description`. Search applies as you type (debounced); sort and tag removal apply at once; popover changes apply on Apply. Applied filters update the toolbar instantly while results load; `PendingList` dims the current results and fades in a small spinner after a short delay (no full overlay). Sortable table headers (`Table.SortableColumnHeader`) share the Sort dropdown's URL value. All filter state lives in the URL
- **Messages list (mobile)** ✅: Messenger-style, no section headers. Pinned chats on top (tenant: the current landlord first, always pinned with a filled pin icon by the name), a `Separator`, then the rest (unread first). Archived chats open from an icon-only `ghost` `IconArchive` (26, `gray500`) button at the top right of the "Messages" title. Rows (`ConversationRow`) swipe **left** to reveal three actions: 56pt filled circles with white 24px icons and a `text-xs` label below (`actionMore` More, `actionPin` Pin/Unpin, `actionArchive` Archive/Unarchive); actions close the row; disabled actions are 40% opacity. The same actions are exposed as card accessibility actions. Holding a row (350 ms, light haptic) or tapping "More" opens an options-only `BottomSheet` (no name/apartment header or header divider, `min-h-14` icon rows: Pin/Unpin and Archive/Unarchive first — disabled at 40% opacity on the always-pinned landlord chat — then read state, profile, apartment, mute, and destructive Report/Block in `text-danger`). Muted rows show `IconBellOff` 14; marked-unread rows show a `size-3.5` danger (red) dot on the avatar and bold text. While loading, the list shows six `ConversationListSkeleton` rows (HeroUI `SkeletonGroup`) shaped like a row: `size-16` avatar circle, name + time, apartment and message lines
- **Chat emoji:** the chat box's emoji button swaps the keyboard for an inline 300pt `rn-emoji-keyboard` `EmojiKeyboard` panel under the input (message stays visible; stays open for several picks; the keyboard button or tapping the input returns the keyboard, and touching or scrolling the conversation closes it) and inserts at the cursor, replacing any selection. The reaction "+" uses the same library's expandable `EmojiPicker` sheet. Both share `useEmojiPickerSettings`: a Recently used tab (saved on the device in AsyncStorage), a search bar, categories on top, and app colors in light and dark (`surface` panel, `surfaceSecondary` category bar and search, `primary` active icon on `primaryLight` / dark `surfaceTertiary`).
- **Chat:** inquiry chats (no active tenancy between the two at that apartment, either portal) float an apartment strip (`ChatApartmentCard`) under the header while messages scroll beneath: full width and flush with the header, `bg-background border-b border-border` `PressableFeedback`, `px-4 py-2.5` row with a `size-14 rounded-xl` cover thumbnail (`IconBuilding` on `bg-surface-tertiary` fallback), name `text-sm font-nunitoSemiBold`, "Barangay, City" `text-xs text-gray-500`, rent `font-nunitoBold text-primary` + "/ month", `IconChevronRight` 18; tapping opens the apartment, and the list pads its top edge by the card's height. The start of every conversation shows an intro card (`ChatEmptyState`): `size-24` avatar with a 2px `border-border` ring, name `text-xl font-nunitoBold` with a filled `IconRosetteDiscountCheckFilled` 20 in `primary` when the account is verified, a `text-sm text-gray-500` context line "Landlord · Apartment" / "Tenant · Apartment" (from the active portal), small `tertiary` rounded-full "View profile" / "View apartment" buttons (16px `textPrimary` icons), and a `text-xs text-gray-500` `IconShieldCheck` payment-safety line. `ChatBubble` `max-w-[80%] mb-4`, sent `self-end` / received `self-start`; "Seen" (`text-[11px] font-inter text-gray-500`, right-aligned under the bubble) marks the newest sent message the other person has read, hidden once they reply (`getSeenMessageId`); it loads from `chat.is_read` and updates live through the chat channel's `messages_read` broadcast; consecutive bubbles from the same sender form a run (Messenger style): the gap inside a run tightens to 4pt (the full 16pt stays below a bubble with a reaction badge) and text bubbles shrink the sender-side corners where they meet to 6pt (`rounded-3xl` 24pt elsewhere; first/middle/last via `getBubbleGroupPosition`, also on the held clone); received bubbles sit after a 40pt gutter (`w-8 mr-2`) holding the sender's `size-8` avatar (`SenderAvatar`, HeroUI `Avatar` with initials fallback, taps open their profile) beside only the newest bubble of each consecutive run, bottom-aligned, with received bubbles capped at `max-w-[75%]` (the held clone shifts by the same gutter); inverted list (newest at bottom) with history paged in 30-message keyset loads at the top edge — loading indicator at the history edge, never a full-screen spinner; swiping a bubble toward the middle (received → right, sent → left, like Messenger; `SwipeToReply`) starts a reply: the bubble follows the finger up to 80pt with resistance past 56pt, a 32pt `bg-surface-tertiary` reply-arrow circle fades in behind it, a light haptic marks the 56pt threshold and the bubble springs back on release (also a "Reply" accessibility action; not on messages still sending); swiping the chat left (anywhere except a sent bubble, whose swipe left is a reply) shows every bubble's send time iMessage-style while held: sent bubbles slide up to 72pt left, each time fades in at the right edge (`text-[11px] font-inter text-gray-500`, e.g. "4:39 PM", hidden while sending), and everything springs back on release (`TimestampRevealRow`); holding a bubble (350 ms, light haptic) blurs the chat (expo-blur; on Android the chat is wrapped in a `BlurTargetView` and the backdrop uses `blurMethod="dimezisBlurViewSdk31Plus"`, plain tint below Android 12) and shows a centered stack — quick-reaction pill (`ReactionStrip`: HeroUI `Surface` `rounded-full shadow-lg` with icon-only ghost `Button`s, current reaction `bg-accent/15`) above, the lifted bubble, and the actions card (`HoldMenu`: HeroUI `ListGroup` with the timestamp then Reply, Copy, Unsend items (`py-2.5`), one `Separator mx-4` under the timestamp only, disabled items 40% opacity, Unsend in `text-danger`) below — aligned to the bubble's side. The bubble springs from its place in the chat to the center and the pill/card scale in from its side (`HoldStack`; no motion with Reduce Motion)
- **Chat (web)** ✅: desktop-first two-pane messaging from `lg`; smaller viewports swap between list and thread so the portal sidebar cannot squeeze the conversation. Tenant My Landlord / Past Inquiries sections and Landlord Current Tenants / Inquiries tabs retain their apartment-scoped identities. Shared `ConversationRow` uses 48px avatars, 14px Nunito names, 12px Inter previews and 11px times from existing RPC metadata only; no message means no invented preview or time. Browser-local dates render after hydration. Selected rows use `secondary`, not a heavy border. `ConversationHeader` keeps a 40px avatar, compact name/apartment lines and the existing notification-bell dock; no oversized property card.
- **Web message presentation** ✅: Inter 14px/24px body, preserved newlines and long-word wrapping; sent bubbles `primary`/white, received `muted` tint/foreground. The existing inclusive five-minute same-sender run rule remains unchanged: 4px inside runs, 16px between runs, adjoining sender-side corners 6px. Actual local-date separators remain; per-message times appear only in the message actions menu, never beneath bubbles. Incoming messages reserve a 36px left gutter; only the last bubble in each run displays the contact's 28px circular `UserAvatar`, bottom-aligned with the bubble itself (not replies or reactions). Outgoing run ends reserve a 16px status lane plus 4px top gap, so existing read updates cannot shift the timeline: the newest outgoing message alone can display the actual recipient's 16px circular avatar when its own `is_read` is true; pending and unread messages never display Seen. The avatar has a "Seen by [name]" accessible label/title, with the same contact's initials if the photo is unavailable. Sending status remains. Reaction pills visually touch the bubble with their own in-flow row above any status, with the current user's reaction selected and announced. Images/GIFs and controlled videos render inline, bounded to 320px without cropping. Replies keep quoted previews and the unavailable-original fallback.
- **Web conversation context** ✅: shared `ConversationApartmentRow` sits flush beneath the unchanged compact header, with a 44px photo/building fallback, truncated Nunito title, general barangay/city location, actual monthly rent (below the title on narrow screens), and chevron. Only the selected thread's exact apartment and expected owner can supply context; unavailable/unlinked properties have a quiet non-clickable fallback. Tenant links use `/tenant/browse/[apartmentId]`; owners use `/landlord/properties/[apartmentId]`. Shared `ConversationIntroduction` scrolls at the true start of history (only after earlier pages are exhausted), never bottom-aligned or repeated per batch: 40px contact avatar, compact name, authoritative verified-account badge only, conversation role, two-line property context, tertiary View Apartment link and the payment-safety reminder. No other-user profile action exists on web. Both use the same caller-authorized read-only context; changing threads hides stale context while loading.
- **Web conversation spacing** ✅: both portals use the full conversation pane width, without a centered maximum-width timeline. History has 12px horizontal and 16px vertical padding at all viewport sizes; incoming bubbles retain their 36px avatar gutter and outgoing bubbles align to the right content edge. Bubble width limits and same-sender run spacing remain unchanged.

- **Web composer placement** ✅: one compact bottom-aligned row with brand-colored attachment controls on the left (see attachment expansion below), a flexible rounded field with “Aa” placeholder and the emoji button inside its right edge, then a transparent brand-colored send icon outside the field. The keyboard hint remains screen-reader-only. Existing attachment, GIF and sending behavior is unchanged; no unsupported sticker or quick-like actions are displayed.

- **Web composer attachment expansion** ✅: an empty draft shows Photo and GIF, without Plus (no sticker). Typing replaces Photo/GIF with Plus; pressing Plus reveals those controls in its place without clearing the draft. Further typing collapses them again, and clearing or sending the draft restores the default row.

- **Chat documents** ✅: the web Photo attachment control also accepts PDF and DOCX, up to 25 MB per file (10 files per batch, alongside existing images/videos). Documents are staged as compact filename-and-size cards with Remove, never image previews. Sent documents render as accessible filename/type/size links in the existing bubble colors; pending files cannot open until sent. Both mobile portals can receive and open documents, with filename/size cards and a document label in conversation/reply previews; the mobile picker remains image/video-only.

- **Web composer scrolling** ✅: short drafts have no scrollbar; the field grows to 144px before scrolling, accounting for its border when measuring content. Overflow uses a thin scrollbar without separate arrow buttons.

- **Web reaction placement** ✅: compact 20px-high reaction badges overlap the bottom-right edge of both incoming and outgoing bubbles by 8px, including media. Single reactions are fixed 20×20px circles showing only the emoji; counts appear only above one in a wider pill (the accessible label always includes the count). Their alignment follows the bubble width, not a wider quoted reply; they remain in flow above the status lane.

- **Web message hover boundary** ✅: the bubble and toolbar share one shrink-to-content interaction boundary, excluding quotes, timestamps and the full-width lane. On hover-capable desktop layouts an invisible CSS hit area extends 124px horizontally and 12px vertically; adjacent grouped bubbles each own only their 2px half of the 4px gap, preventing cross-activation. The boundary bridges the toolbar gap without changing visible dimensions. Keyboard focus or that message's open reaction/context overlay keeps its toolbar visible; touch controls remain available without hover. No hover timers or document-wide pointer tracking.
- **Web reply navigation** ✅: the entire quoted preview is a native button with a pointer cursor, soft primary hover and visible focus ring; it jumps to the original, never starts another reply. Existing loaded originals center inside the thread (smooth unless reduced motion is requested), receive focus without scrolling the page, and get a primary outline for 1.8 seconds. Older originals reuse bounded history pages (at most five per lookup, 30-second timeout), preserving the viewport anchor while prepending. A small in-thread live status offers Cancel while locating or Dismiss for unavailable/limit/error feedback. Switching account/property/thread cancels the lookup; repeated clicks share pending work. Deleted originals retain the existing unavailable block. Quotes stay outside media viewers and message-action interaction boundaries; selecting quoted text does not jump.
- **Web message controls/composer** ✅: persisted bubbles reveal a quiet React/Reply/More toolbar on hover or keyboard focus; narrow screens keep only the 44px More target, with the same actions in its contextual dialog. React opens a portaled HeroUI popover with the existing quick emoji set. Right-click, long-press or keyboard activation opens `MessageContextMenu`: quick reactions, actual timestamp, Reply and text-only Copy—never unimplemented actions. The coordinate-anchored dialog measures its real dimensions, clamps to viewport edges, cycles keyboard focus, closes on Escape and restores focus; double-click still hearts. Both portals reuse the shared HeroUI `TextArea` composer: grows to 144px then scrolls, Enter sends, Shift+Enter inserts a newline, IME Enter never sends. Cursor-aware emoji insertion, attachment staging, GIFs, reply cancellation, typing, receipts and history controls remain; jump-to-latest stays inside the history pane, not over the composer. All new surfaces follow existing theme tokens; reduced motion disables message transitions and typing bounce.
- **Notifications (mobile)** ✅: the screen copies the web drawer — a flat list, no row cards, borders or backgrounds. Header: All / Unread pills (`NotificationFilterTabs`: `rounded-full px-3 py-1.5`; selected `bg-primary-light` + `text-primary-light-foreground` Nunito SemiBold, idle `text-muted`) and a "Mark all read" text button while unread > 0. Rows sit under local-date section headers (`groupNotificationsByLocalDate`: Today, Yesterday, then dates; `text-sm font-nunitoBold uppercase tracking-wide text-muted`). `NotificationRow`: 48px `bg-primary-light` circular icon tile (`NotificationIconTile`, 24px type icon in `primary`, `danger` for rent-due), a `text-base` Nunito sentence (bold sender/title + regular action, e.g. "**Name** sent you a message", two-line clamp), a one-line `text-sm text-muted` preview (quoted for chat, plain otherwise), a `text-xs` muted time and an 8px `bg-primary` unread dot in a reserved right slot. Row/group copy comes from `getNotificationRowPresentation` and `groupNotificationFeed` in `@repo/utils`, shared with web. `NotificationGroupRow`: two or more consecutive chat messages from one sender (15-minute rolling window, reactions and other events stay single) collapse into "**Name** sent you N messages" with a muted `Latest: “…”` line; a separate chevron button expands members in place (indented under the text, compact rows, no icon or sender) without navigating or marking anything read. Tapping a row marks it read and deep-links; tapping a summary opens the conversation and marks its unread members read only when the target resolves. Loading uses flat `NotificationRowSkeleton` rows. Empty states reuse `EmptyState`: no notifications shows a muted `IconBellOff` with "No notifications yet" and a hint; the Unread tab shows a primary `IconBellCheck` with "You're all caught up" and a secondary "View all notifications" button that switches back to All.
- **Notifications (web)** ✅: `NotificationsOverlay` renders one HeroUI `Drawer` (right placement) per portal — consumer feed and the admin queue — opened by the shared `?notifications=open` query, with All/Unread filters, date groups, tap-to-read, "Mark all read", and a "Reset bell position" row. `NotificationRow` uses a `size-8` tinted type-icon circle (18px icon), a primary Nunito `text-sm leading-5` sentence (semibold sender/title inline with a regular-weight chat/reaction action; two-line clamp with long-word wrapping), a one-line Inter `text-xs` muted preview (quoted for chat; no second preview icon), and an Inter 11px muted timestamp. A reserved right-hand slot aligns the 6px unread dot. The row is one keyboard-operable button with a visible primary focus outline; its accessible name retains the full identity, action, preview, unread state and timestamp. Application/verification producer titles and descriptions remain intact. The flush drawer neutralizes HeroUI's negative body side margins so its scroll surface never exceeds the dialog. Trigger: one `size-11` circular bell (`border-border`, `bg-card/95` + `backdrop-blur-sm`, `shadow-sm`, `text-foreground/70`; hover/active primary tint, `focus-visible:outline-primary`), draggable with Pointer Events, snapping to the nearest content edge on release. Placement persists in `apt-notifications-fab:v1` as `{side, topRatio}` and is never rewritten by the automatic nudge. At rest the saved anchor is re-resolved against live DOM geometry from every `[data-fab-clearance]` control (messages composer, conversation header, contact list, payment footer, browse filter rail) with a 12px margin and a 12px viewport gap: same side when it has room, opposite edge when it does not, otherwise the least-obscuring slot. A `[data-fab-dock]` surface (the messages conversation header) wins over all of that: the bell parks inside its right end, vertically centred, and is not draggable there — so on Messages it can never cover the thread. The mobile menu entry stays the only trigger below `md`. Mark any new persistent control that must stay clickable with `data-fab-clearance`; mark a designated parking spot with `data-fab-dock`.
- **Notification groups (web)** ✅: the summary uses the same row/icon/typography family: semibold sender inline with regular "sent you N messages", muted one-line `Latest: “…”` preview (collapsed only), then timestamp. The right-hand unread dot sits above a small 14px muted chevron inside a separate HeroUI `ghost` button; only that control expands/collapses, without animation or navigation. The button keeps its 44px hit target, but hover and keyboard focus paint a 24px inner circle (2px primary focus outline) so neither state draws a surface around the unread dot. Expanded members reuse `NotificationRow compact` inside a quiet inset `bg-muted/40` surface (`notification-group-members`, `ml-11`): preview and timestamp only, no repeated avatar/name and no connector rail or card borders. Expanding hides the summary's `Latest` line in both the visible row and its accessible name because the members now show that content; collapsing restores it. Unread children retain their own dot and slightly stronger preview; their complete sender/action/preview/time remains in the accessible name. Parent navigation, per-member clicks, record-based counts and read state are unchanged.
- **Notification presentation compatibility (web)** ✅: Tenant, Landlord and Admin share the same row hierarchy for every event and record age; `notification-feed-primary`, `notification-feed-preview` and `notification-feed-time` also style group summaries. Explicit chat metadata permits sender + action composition; absent, malformed or unknown payloads retain the original title and message in primary/secondary slots. Never extract names, payment amounts or actions from prose, invent missing reaction copy, or branch styling on creation date. Payment/cash, applications, maintenance, visit and verification descriptions use the same muted single-line preview and full accessible text. No record rewrite is needed; audience filtering still decides which rows may appear.
- **Single-message notifications (web)** ✅: only bursts with two or more loaded notifications use the grouped summary. A one-member burst renders the existing `NotificationRow` with its original sender, message, timestamp, unread indicator and single-row open behavior — no count line, chevron or nested copy. Re-evaluate this after feed changes, including Realtime arrivals and latest-50 window changes; the Unread tab still includes a whole multi-message group when any member is unread. Chat is filtered by the recipient's resolved Tenant/Landlord audience before grouping; unresolved chat never flashes into rows or unread badges while ownership loads (ARCHITECTURE.md §8.3).
- Empty lists use the Empty State pattern (§15), never blank space
- **Notification chronology:** web and mobile feeds order by `created_at` descending, then `id` ascending for timestamp ties, independently of read state. Web date groups use the user's local calendar day (Today, Yesterday, then older dates descending), never label-text sorting or fixed 24-hour subtraction; labels refresh across local midnight and when a backgrounded tab resumes.

---

## 13. Navigation

Sidebar unread activity uses a solid 8px dot, never a numbered section badge: `bg-primary` on ordinary items, `bg-sidebar-primary-foreground` (white) on the desktop active-blue item. Reserve a right-hand slot on every expanded row and position the dot absolutely to avoid layout shifts. Collapsed rails place it at the upper-right, outside the icon; mobile-web dropdown rows retain blue dots on their light active tint. The item announces "Unread activity"; the dot is decorative, non-focusable and pointer-events-none. Navigation never acknowledges notifications. Dots follow the same latest-50 feed as the drawer, not pending tasks or chat-specific unread state; inaccessible Passport entries remain absent.

### Web

- **Navbar** ✅ (AppNavbar/TenantNavbar): `sticky top-0 z-40 h-16 border-b border-divider bg-background/70 backdrop-blur-md backdrop-saturate-150`; `max-w-7xl mx-auto px-4 sm:px-6`; logo 100×40; links `font-medium`, active `text-primary`; avatar dropdown; `sm:hidden` hamburger panel; auth buttons `rounded-full`
- **Sidebar** ✅ (shared `AppSidebar`): `w-64` (256px), collapsible to `w-16` rail; items `gap-3`, active `bg-sidebar-primary text-sidebar-primary-foreground`, icons `w-5 h-5`; footer user block; content `bg-background min-h-screen w-full`. Collapse preference persists per portal (`admin-`/`tenant-`/`landlord-sidebar-collapsed`); mobile uses the `MobileSidebarNavigation` FAB menu with `pb-20 md:pb-0` content clearance. Nav items may carry a `section`: consecutive items sharing it form one group (`role="group"`, accessible name only — no visible headings) with a HeroUI `Separator` between groups, in both the expanded sidebar and the collapsed rail; the mobile menu uses one `Dropdown.Section` per group split by separators. Items without a `section` render as one flat group. The landlord sidebar groups Dashboard | My Properties, Applications, Maintenance, Messages | Payments, Profit & planning | APT Passport; tenant and admin stay flat. A Notifications tab (`SidebarNotificationsItem`) sits below the last page when the user picks "Sidebar tab" in Settings → Notifications → Display: a bell button styled like the page links that opens the drawer through `?notifications=open`, never active, with the standard 8px unread dot (no count) and an "Unread activity" accessible name; it replaces the floating bell on desktop (the mobile menu entry is unchanged). The same section sets the drawer edge (Right default, Left mirrors the corner radius). Both are per-browser display preferences in `apt-notifications-display:v1` (`lib/notification-display-preferences.ts`, `useNotificationDisplayPreferences`), applied instantly across tabs, never account data.
- **Tenant Favorites (web)** ✅: lives directly below Profile in the desktop account dropdown and the small-screen web menu's Account section, not in the main page list. Retain the heart icon, active-page tint and existing `/tenant/favorites` destination; landlord/admin menus are unchanged.
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
  - `AppDialog` ✅: shared wrapper (optional `titleIcon`, `description`, `footer`); `scrollable` wraps long bodies in a max-height (360px) `ScrollView` while the title, close button and footer stay fixed
  - `ConfirmDialog` ✅: footer `justify-end gap-3` — `ghost sm` cancel + `sm` confirm (default `danger`)
  - `ErrorDialog`/`SuccessDialog` ✅: icon 20 `danger`/`success`, title `text-danger`/`text-success-text`, dismiss `secondary sm`
  - `RejectDialog` ✅: `TextField` + `TextArea numberOfLines={3}`, footer `secondary` Cancel / `danger-soft` Reject (both `flex-1`)
- **BottomSheet** ✅: snapPoints `["85%"]` (filters) / `["50%","75%"]` (DropdownField); `enableOverDrag false`; handle `bg-[#D0D0D0] w-10`; `bg-surface rounded-t-[20px]`; sticky header `border-b border-border`; sticky footer `border-t pt-3` (Apply `flex-1 sm` + Clear All `tertiary sm`)
  - Content gutter ✅: HeroUI's `BottomSheet.Content` already insets every edge by 20px (`.bottom-sheet__content-container`, `calc(--spacing * 5)`; bottom becomes `safe-area-inset-bottom + 12px`). Sheets never add horizontal padding on top of it — except the finance option sheets: `FinanceSelect` adds 12px (`px-3`; the label, search and list share it) so row pills clear the sheet edges and option text sits 20px inside the sheet gutter (40px from the screen edge). Scroll content adds vertical spacing only (browse filters 16px top / 32px bottom; finance entry 32px bottom). Footers rendered outside the container (gorhom `footerComponent`, e.g. the finance filter footer) keep their own `px-5`, and row/cell internals (`button` padding, `p-1` month cells) stay as designed.
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
- **Client-owned detail loading (web)**: Rent Payment, both Passport wallets/document details and landlord application/maintenance details keep their existing route shell, heading/back navigation and a compact `RouteLoadingStatus` (accessible busy status); the client alone renders the unresolved body skeleton. Nested payment history, checkout return and receipt routes have destination-specific boundaries, never their parent's unrelated page skeleton. `PaymentStatusLoading` shares the neutral blue loading screen with receipt/success/verification clients and never implies a completed payment. Landlord property payment history shares `PropertyPaymentHistoryShell` across loading/content/error states; its known property name remains during loading, but is withheld after a failed read or a changed session. `ReconciliationNotice` labels the last loaded status while mutation details refresh; failures offer a read-only Refresh details action instead of inviting a repeated write.
- **Portal navigation feedback (web)**: solid sidebar selection and `aria-current="page"` follow the committed pathname, never an optimistic click. Pending desktop Links show a thin bottom indicator and an accessible “Opening…” status via Next's `useLinkStatus`; the lighter hover fill remains a hover state. Dropdown/mobile navigation uses React transition-scoped feedback (account spinner or “Opening…” menu label), cleared when the transition ends or is interrupted. The sidebar stays interactive; unread-dot position and collapsed/mobile behavior do not change. No artificial loading delay or second selected item.
- **Favorites reuse (web)**: cold/expired data keeps the existing skeleton; valid retained cards render immediately after the route is available. Background refresh keeps cards and announces progress; failure adds a recoverable notice and Retry above them instead of a full-page error. Bounded saved-apartment pages retain grid/list presentation with Previous/Next controls and an explicit “on this page” count when paged; an empty later page keeps navigation available. Retained listing prices are presentation, not a current rental offer or eligibility decision.
- **Browse loading (web)**: the search row renders before results. Default discovery shows aria-busy section-row shimmer placeholders, or the card grid when discovery is empty. Filtered/search/paged states keep the real search row and show a filter-panel shimmer in the rail position, an 11-unit circular placeholder where the mobile filter entry will be, and shimmer apartment cards in the result grid. Skeletons preserve the loaded responsive columns and never invent prices, titles or result counts.
- **Profile Passport loading (web)**: the Passport card renders immediately from the authoritative account status, including its action and status description. The verification activity timeline alone streams in beneath a divider, using a small heading and two timeline-row shimmer placeholders. A missing or failed timeline leaves the card unchanged rather than showing an error or an unverified state.
- **My Rental finance loading (web)**: the route fallback owns the initial rental-context wait; the client starts with fresh server-loaded context instead of showing another full-page skeleton. The apartment, landlord, signed lease and maintenance sections stay visible while the bill and payment history load. Route and localized finance placeholders reuse the same brand-blue rent surface, geometry, calendar and history rows. An unresolved applications list uses its own card placeholders, not another full-page variant. Lease confirmation stays pending through reconciliation and never blanks the loaded rental; a saved confirmation's Retry refreshes details rather than submitting it again. If either the bill or payment history fails, both finance regions offer Retry without inferring an amount or an empty history from partial data. Payment actions remain behind authoritative finance.
- **Messages loading (web)**: one two-pane skeleton is shared by the route fallback and the in-page boundary: the contact list on mobile, both panes from `lg` up. It keeps the loaded header height, avatar rows, thread header, chat-bubble rhythm and composer bar, with no names, previews or unread counts.
- **Landlord Dashboard loading (web)**: route-level loading keeps the shared Dashboard heading and welcome text visible above HeroUI shimmer placeholders for the four statistics cards and chart panels. It preserves the loaded page's responsive grid and themed surfaces; the portal sidebar stays available during navigation.
- **Landlord My Properties loading (web)**: route-level loading keeps the shared title and description visible with HeroUI shimmer placeholders for the four statistics cards, Property Actions and property table rows. The skeleton follows the existing responsive grids and contains table overflow. Dashboard and My Properties also prefetch on sidebar hover/keyboard focus and when the mobile navigation menu opens; navigation keeps the shared portal shell mounted without artificial delays or page animations.
- **Landlord Applications loading (web)**: the route fallback and client data-loading state share HeroUI shimmer table rows on desktop and application cards below `md`. The heading stays visible; the route fallback includes search/filter placeholders, while client loading keeps the real controls and replaces the unknown total with a placeholder. Applications opts into the same sidebar hover/focus and mobile-menu prefetching as Dashboard and My Properties; prefetching warms the route, not the browser-fetched application records.
- **Landlord Maintenance loading (web)**: route and client loading reuse HeroUI shimmer placeholders for the six-column desktop table and mobile request cards (issue, property, tenant, date, urgency and status). The shared heading stays visible, the unknown total is a placeholder, and client loading keeps search/filters usable. Maintenance opts into sidebar hover/focus and mobile-menu prefetching; records still load through the existing client hook.
- **Landlord Payments loading (web)**: route and Suspense fallbacks keep the Payments header, selector placeholder, year-row placeholder and HeroUI shimmer payment cards. The client always renders its real heading and selector (disabled while units are unknown); only the unresolved payment region uses card placeholders. Safe background reads preserve the known selector and payment cards. Unit/account changes immediately hide the previous resource's payments. The real Filters control stays on the year row. Payments opts into sidebar hover/focus and mobile-menu prefetching; financial records remain freshly caller-bound, not retained across route mounts.
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

My Rental uses available content width (container queries), not viewport width alone, for its dashboard: rent/calendar, quick actions/landlord and maintenance/signed lease become two columns at 64rem of content width, sharing the same column tracks and gap. Maintenance aligns below Quick actions in the wide left column; Signed lease aligns below Landlord in the narrow right column. Below that breakpoint, Maintenance stacks before Signed lease. Lease details use three columns only at 36rem of rent-card content width. Quick Action tiles fill equal-width, equal-height grid cells: one column below 28rem of card content, two from 28rem, four from 44rem. Narrow layouts wrap headers and signed-lease actions; payment history stays full-width below the supporting cards and scrolls within its card, never the page. Loading placeholders mirror these layouts.

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
