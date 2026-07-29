# AGENTS.md — APT (A Place to Thrive)

Guidelines for AI coding agents working in this repo. Durable conventions only — not sprint status.

## Project

Rental management platform for the Philippine market (CAMANAVA area focus), serving tenants and landlords across web and mobile.

## Stack & Monorepo Structure

- pnpm@10.25.0 monorepo (Node 22.17.0 — see `.nvmrc`), workspace roots: `apps/*`, `packages/*`
- Backend: Supabase (Postgres, Auth, Realtime, Storage)
- No test, CI, or formatter config exists in the repo

### `apps/web` — Next.js 16 (App Router)
- Styling: **Tailwind CSS v4** + PostCSS (`@tailwindcss/postcss`)
- UI: **HeroUI v3** (`@heroui/react`) **and** shadcn/ui (`components/ui/`)
- Supabase: use `@supabase/ssr` (`createBrowserClient` / `createServerClient`) directly — NOT the shared `@repo/supabase` client (mobile-oriented). Server client imported from `@repo/supabase/server`, middleware from `@repo/supabase/middleware`.
- Icons: `@tabler/icons-react` + `lucide-react` + `react-icons` (mixed codebase)
- `pnpm overrides` pins `react-native-reanimated` to 4.2.1 for `react-native-awesome-gallery`

### `apps/mobile` — React Native (Expo 55), Expo Router
- Styling: **Uniwind** utility classes — NOT NativeWind (migrated away; don't reintroduce)
- UI: **HeroUI Native v3** (`heroui-native`)
- Icons: `@tabler/icons-react-native` — NOT `lucide-react-native` (migrated away; existing dep not yet cleaned up but don't use it)
- State: Zustand for client state (`stores/`)
- Auth: PKCE flow with `@react-native-async-storage/async-storage`; platform-specific Supabase clients split via `client.ts` / `client.native.ts` pattern
- Babel: `react-native-reanimated/plugin` in `babel.config.js`
- Payment receipt UI: `apps/mobile/app/tenant/payment/success.tsx` renders a GCash-style digital receipt using `ReceiptCard` (`./components/ReceiptCard.tsx`). The receipt card uses HeroUI Native (`Card`, `Button`) and shows apartment/landlord name, date/time, payment method, amount, and reference number. Save/Share buttons (no-op) are inside the card below a scalloped "torn paper" circle separator.

### Shared packages (`packages/`)
| Package | Exports | Notes |
|---|---|---|
| `@repo/supabase` | `.`, `./browser`, `./server`, `./middleware` | `client.ts` handles RN/SSR branching; peer deps for `next`, `react-native`, `async-storage` are optional |
| `@repo/constants` | `.` | Colors, apartment/user constants, PH address data |
| `@repo/utils` | `.` | Shared utilities |
| `@repo/hooks` | `.` | `usePasswordValidation`, `usePHMobileValidation`, `usePHPostalCode` |

## Commands (root `package.json`)

```bash
pnpm web          # pnpm --filter web dev
pnpm mobile       # pnpm --filter mobile start
```

Individual app scripts:
- `pnpm --filter web dev` / `pnpm --filter web build` / `pnpm --filter web lint`
- `pnpm --filter mobile start` / `pnpm --filter mobile ios` / `pnpm --filter mobile android` / `pnpm --filter mobile lint` (expo lint)

No root-level `dev`, `lint`, `typecheck`, or `build` scripts exist.

## Config & Hoisting

- `.npmrc` hoists `@heroui/*` and `@types/*` to root `node_modules`
- Mobile `@source` directives in `global.css` reference sibling packages (`../../../packages/`) — when adding monorepo package deps to Tailwind content, check there too

## Supabase Conventions

- `public.users` has both `user_id` (→ `auth.uid()`) and internal `id` UUID PK. **All RLS policies and FK relationships use the internal `id`**, resolved via:
  ```sql
  (SELECT id FROM public.users WHERE user_id = auth.uid())
  ```
- When a table has multiple FKs to `public.users` (e.g. `reviews`, `chat`), disambiguate joins explicitly: `users!reviews_tenant_id_fkey`.
- Use DB migrations for schema changes; direct SQL only for read-only queries or one-off DML.
- Storage buckets are private by default; store **storage paths** (not public URLs) in DB columns, generate signed URLs on read.

## What NOT to do

- Don't reintroduce NativeWind or `lucide-react-native` on mobile.
- Don't bypass `public.users.id` indirection in new RLS policies or FK joins.
- Don't store public URLs for private bucket assets — store paths and sign on read.
- Don't use `@repo/supabase`'s default export on web (it's mobile-oriented); use `@supabase/ssr` directly or `@repo/supabase/server` / `@repo/supabase/browser`.
