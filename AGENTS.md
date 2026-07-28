# AGENTS.md — APT (A Place to Thrive)

Guidelines for AI coding agents (opencode, Claude Code, etc.) working in this repo.
This file covers durable project conventions — not current sprint status or open bugs.

## Project

APT is a rental management platform for the Philippine market (CAMANAVA area focus),
serving tenants and landlords across web and mobile.

## Stack & Monorepo Structure

- pnpm monorepo
  - `apps/mobile` — React Native (Expo), Expo Router
  - `apps/web` — Next.js (App Router)
  - `packages/@repo/supabase` — shared Supabase client/types
  - `packages/@repo/constants` — shared constants (e.g. `ApartmentStatus`)
  - `packages/@repo/utils` — shared utilities
- Backend: Supabase (Postgres, Auth, Realtime, Storage)

### Mobile (`apps/mobile`)
- Styling: **Uniwind** utility classes — NOT NativeWind (migrated away; don't reintroduce it)
- UI kit: **HeroUI Native v3**
- Icons: `@tabler/icons-react-native` — NOT `lucide-react-native` (migrated away)
- State: Zustand for multi-step/local client state (e.g. `useApartmentFormStore`)
- Auth storage: PKCE flow requires `AsyncStorage` in the Supabase client
- Platform-specific Supabase clients: prefer `client.native.ts` / `client.ts` file
  splitting over dynamic `require()` for platform branching

### Web (`apps/web`)
- Styling: Tailwind CSS
- UI kit: **HeroUI v3**
- Supabase: use `@supabase/ssr` (`createBrowserClient` / `createServerClient`) directly —
  do NOT use the `@repo/supabase` shared client on web, it's mobile-oriented

## Commands

> Assumption — verify against the actual root `package.json` scripts and update this
> section once confirmed; these are standard for a pnpm Turborepo-style setup.

```bash
pnpm install          # install all workspace deps
pnpm dev               # run dev servers (web + mobile, or filter with --filter)
pnpm --filter web dev
pnpm --filter mobile dev
pnpm lint
pnpm typecheck
pnpm build
```

## Code Standards

- **TypeScript strict mode.** Avoid `any` — use `unknown` + narrowing, generics, or
  proper types instead. If `any` is truly unavoidable, comment why.
- Prefer simple, direct solutions over premature abstraction. Follow DRY/SOLID without
  overengineering — don't extract single-use helpers preemptively.
- Keep components responsive, accessible, and visually consistent with the existing
  HeroUI-based design language on each platform.
- **Prefer HeroUI components over custom-built ones.** Before hand-rolling a UI
  element (button, input, modal, menu, card, etc.), check whether HeroUI (v3 on web,
  HeroUI Native v3 on mobile) already provides it or a composable primitive for it.
  Only build custom when HeroUI genuinely has no suitable component or variant.
- When refactoring, preserve existing behavior unless a change is explicitly requested.
- Flag potential bugs, race conditions, and edge cases rather than silently working
  around them.

## Supabase Conventions

- `public.users` has both `user_id` (→ `auth.uid()`) and an internal `id` UUID PK.
  **All RLS policies and FK relationships use the internal `id`**, resolved via:
  ```sql
  (SELECT id FROM public.users WHERE user_id = auth.uid())
  ```
  Do not write policies comparing `auth.uid()` directly to a table's `landlord_id`,
  `tenant_id`, etc. — go through `public.users.id`.
- When a table has multiple FKs to `public.users` (e.g. `reviews`), disambiguate joins
  explicitly: `users!reviews_tenant_id_fkey`.
- Use migrations (`apply_migration` / equivalent DDL tool) for schema changes; use
  direct SQL execution only for read-only queries or one-off DML.
- To inspect an existing RLS policy's logic, use `pg_get_expr(polqual, polrelid)`
  rather than guessing from the policy name.
- Storage buckets are private by default; store the **storage path**, not a public
  URL, in DB columns (e.g. chat `attachment_path`), and generate signed URLs on read.
- Check Realtime requirements when adding column-level filters: tables need
  `REPLICA IDENTITY FULL` for `postgres_changes` filters to work correctly; Presence
  needs explicit `join`/`leave` handling, not just `sync`.

## Security & Auth Notes

- Google OAuth on mobile uses `expo-web-browser` + `expo-linking`; Android requires
  `intentFilters` for deep link interception.
- On OTP verification failure during sign-up, call `supabase.auth.signOut()` to clean
  up confirmed-but-profileless `auth.users` rows rather than leaving them orphaned.
- Be careful with anything touching `/auth/callback` on web — treat changes there as
  higher-risk given past signup-flow issues; test the full sign-up path end-to-end.

## PR / Commit Conventions

> Not yet formalized — using conventional commits (`fix:`, `feat:`, `chore:`, etc.) is
> a reasonable default; update this section once the team settles on a convention.

## What NOT to do

- Don't reintroduce NativeWind or `lucide-react-native` on mobile.
- Don't bypass `public.users.id` indirection in new RLS policies or FK joins.
- Don't store public URLs for private bucket assets — store paths and sign on read.
