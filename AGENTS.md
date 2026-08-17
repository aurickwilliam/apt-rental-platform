## Read Order

This is the primary entry point for AI coding agents.

Before making changes:

1. Read AGENTS.md.
2. If modifying UI, read DESIGN.md.
3. If modifying system behavior, read ARCHITECTURE.md.
4. Use Graphify to navigate the codebase.
5. Use design-tokens.json for machine-readable design values.

# AGENTS.md — APT (A Place to Thrive)

Operating manual for AI coding agents (OpenCode, Junie, Kiro, Claude Code, Codex CLI, and future agents). Durable engineering conventions only — not sprint status. For visual/design decisions, see DESIGN.md.

## Canonical Sources

Authority order — when sources conflict, the highest-ranked source wins.

| Domain | Source of truth | Fallback |
|---|---|---|
| Engineering | 1. AGENTS.md | 2. Source code · 3. Graphify |
| Design | 1. DESIGN.md | 2. design-tokens.json |
| Database | 1. Supabase schema | 2. Migrations |

- Engineering decisions belong in AGENTS.md; visual decisions belong in DESIGN.md.
- Never duplicate design documentation — cross-reference DESIGN.md instead.
- DESIGN.md is the single source of truth for UI (status markers: ✅ canonical · 🚧 transitional · ⚠ legacy).

## Project

Rental management platform for the Philippine market (CAMANAVA area focus), serving tenants and landlords across web and mobile.

## Stack & Monorepo Structure

- pnpm@10.25.0 monorepo (Node 22.17.0 — see `.nvmrc`), workspace roots: `apps/*`, `packages/*`
- Backend: Supabase (Postgres, Auth, Realtime, Storage)
- No CI or formatter config exists; `apps/mobile` has a Jest suite (`jest-expo` + `@testing-library/react-native` + `fast-check`) run via `pnpm --filter mobile test`

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
- State: server state via **React Query** (`@tanstack/react-query`) — single `QueryProvider` at the root layout, shared client in `utils/queryClient.ts`; Zustand for client state only (`stores/`)
- Auth: PKCE flow with `@react-native-async-storage/async-storage`; the platform-aware Supabase client lives in `@repo/supabase` (`packages/supabase/src/client.ts` handles RN/SSR branching)
- Babel: `react-native-reanimated/plugin` in `babel.config.js`
- Services: `service/` mirrors the `hooks/` domain folder layout (e.g. `service/chat/chatService.ts`, `service/media/privateMediaResolver.ts`); tests co-locate in their domain folder, imported via direct file paths (no barrels)
- Payment receipt: GCash-style receipt in `apps/mobile/app/tenant/payment/success.tsx` via `components/ReceiptCard.tsx` (same folder)

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
- `pnpm --filter mobile test` (jest) / `pnpm --filter mobile exec jest --runInBand` (CI-style run)

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
- Notifications are generated **server-side only**: DB triggers insert into `notifications` via `create_notification()` (which also fires the `push-notify` edge function through pg_net). Clients only SELECT their own rows and UPDATE `is_read` — never INSERT. Expo push tokens live in `push_tokens` (upsert on sign-in, delete on sign-out).
- `create_notification()` EXECUTE is revoked from `authenticated` — only SECURITY DEFINER triggers (and service_role) call it. Trigger functions identify the acting user via `auth.uid()` (PostgREST JWT GUC), e.g. to skip self-notifications (tenant self-cancel of a visit request).
- `push-notify` includes `notificationId` in the push payload `data`; clients mark the feed row read on tap or banner action (fire-and-forget) so the in-app unread count stays accurate.
- Trigger payloads include the `apartmentId` needed to resolve deep links (payment, maintenance); never rely on payloads without it.

## Engineering Philosophy

- Prefer reuse over duplication.
- Extend existing components before creating new ones.
- Minimize custom implementations — let HeroUI / shadcn / platform primitives do the work.
- Keep Web and Mobile behavior aligned (mobile-first; web mirrors its semantics).
- Prioritize readability over cleverness.
- Type safety over convenience.
- Keep business logic separate from UI.
- Prefer composition over inheritance.
- Optimize for maintainability.

## Architecture Principles

- Shared logic belongs in `packages/`; platform-specific code stays inside `apps/`.
- UI components remain presentation-focused.
- Business logic belongs in hooks/services, not components.
- Database logic belongs in Supabase (RLS, policies, migrations) — not in client code.
- Never duplicate validation logic — use `@repo/hooks` / `@repo/utils` / `@repo/constants`.
- Keep state as local as possible (see State Management Rules).

## Decision Hierarchy

When multiple solutions are possible, follow this order:

1. Reuse existing code.
2. Extend an existing implementation.
3. Share code between platforms.
4. Create a new abstraction.
5. Create a new component.

Always prefer the smallest change that satisfies the requirement. For UI-component decisions, follow DESIGN.md §21 (AI Decision Hierarchy).

## Repository Conventions

### Web (`apps/web`)
- Route folders kebab-case (`browse`, `forowners`); route groups in parens (`(auth)`, `(main)`); dynamic segments camelCase (`[apartmentId]`).
- App components PascalCase with `export default function`; shadcn primitives kebab-case in `components/ui/`.
- Hooks: kebab-case files (`use-favorites.ts`) exporting camelCase (`useFavorites`); `"use client"`.
- No barrel exports — components imported directly by path.
- Alias `@/*` (tsconfig); monorepo packages via `@repo/*`.
- Server actions in `app/(auth)/actions/*.ts` with `"use server"`.
- Server pages fetch and pass props to `"use client"` children; wrapper components get a `Client` suffix (`MessageClient`, `FavoritesClient`).

### Mobile (`apps/mobile`)
- Feature folders lowercase (`apartment/`, `chat/`) or kebab-case (`document-id/`); route files kebab-case (`sign-in.tsx`); dynamic routes in brackets (`[apartmentId]`).
- `components/` subfolders plural lowercase (`buttons/`, `cards/`, `display/`, `inputs/`, `layout/`); component files PascalCase.
- Hooks: `hooks/<domain>/useX.ts` camelCase files; each domain folder has a barrel `index.ts` with named re-exports.
- Stores: `stores/useXStore.ts` — `create<State & Actions>((set) => …)` with exported `interface`, `initialState`, and `reset()`.
- Import aliases mixed (`@/*` and bare `components/*`, `hooks/*`, `constants/*`, `assets/*`) — match the surrounding file.
- Components never import the Supabase client directly — hooks/services do.

### Packages (`packages/`)
- Layout: `src/` + `package.json` + `tsconfig.json`; single entry `exports` → `./src/index.ts`.
- Named exports only; barrel `index.ts` at package root (and per-subfolder where applicable).
- Cross-platform, dependency-light; platform-specific peer deps are optional.

### TypeScript
- `strict: true`. Avoid `any` — explicit typing preferred.
- `interface XxxProps` for component props; `type` for unions/statuses.
- Route-scoped shared types in `types.ts` files.
- Type-only imports: `import type { … }` or inline `type` in destructuring.
- Semicolons in app code (shadcn `components/ui/*` files omit them — don't reformat).

## Code Quality Rules

- Avoid duplicated code — extract to shared packages or reuse.
- Avoid magic numbers — name them or use `@repo/constants`.
- Prefer semantic naming over abbreviations.
- Keep functions focused on one responsibility.
- Prefer early returns.
- Avoid deeply nested logic.
- Keep components small.
- Avoid unnecessary abstractions.
- Prefer explicit typing over inference shortcuts.
- Remove dead code.

## Performance Guidelines

- Avoid unnecessary re-renders.
- Memoize only when beneficial (e.g. `React.memo` on heavy stable components — used sparingly today).
- Virtualize long lists (`FlatList`/`FlashList`); adopt as list screens grow.
- Lazy load heavy screens where the framework supports it.
- Cache signed URLs on read (see Supabase Conventions).
- Keep bundle size reasonable — mind the icon library mix and heavy deps.
- Avoid unnecessary network requests (reuse fetches, avoid refetch loops).
- Prefer optimistic updates where appropriate.
- Media uploads are **binary with client-side compression** (`compressImage.ts`) — never base64; apartment images are stored two-tier (thumb + full), thumbs render from the thumb column.
- Lists fetch **bounded pages** with keyset cursors — never unbounded selects (chat history: 30-message pages, descending `created_at, id`, ID-deduplicating merge).
- External media (GIFs) are referenced by `externalUrl` on the row — no download-then-re-upload round trips.

## State Management Rules

- **Local state** (`useState` + custom hooks) is the default — use nothing else unless needed.
- **React Query** (mobile only): the standard layer for server data. Reads via `useQuery` on stable query keys; mutations via optimistic updates + exact-key `invalidateQueries`. Default `staleTime` 30s; `clearQueryClient()` on sign-in/sign-out (sensitive in-memory state — e.g. signed URLs — clears with it). Never put tokens or signed URLs in query keys; never mirror server data in Zustand.
- Read-settling mutations (mark-read, status changes) settle with exact-key `invalidateQueries({ refetchType: "none" })` — mark-stale only; the mutation's own realtime event is the single refetch trigger. UI counters (e.g. unread) update optimistically with rollback, never via extra refetches.
- **Realtime (mobile)** — one channel per user/resource identity via refcounted registries (`useNotificationRealtime`, chat channels); never one channel per consumer. Channel identity is keyed by data identity (user/peer/apartment), never by render callbacks; event callbacks flow through refs.
- **Zustand** (mobile only): client state shared across screens — form flows, theme, personalization. Lives in `stores/`; includes `reset()`.
- **Supabase** is the source of truth for all server data; fetch in hooks/services behind React Query — never mirror it in stores.
- **URL state** (web): filters and search via `searchParams` / `useSearchParams`.
- **Context** (web): none for session state — `AuthContext` is form-state scoped to the `(auth)` route group only. Session awareness comes from `hooks/use-user.ts` (with `onAuthStateChange`) and server pages. Avoid adding global contexts.
- Never duplicate state: derive from a single source, reset stores on completion, keep stores out of server data.

## Component Guidelines

Before creating a component, ask:

- Does one already exist (app, `packages/`, HeroUI, shadcn)?
- Can HeroUI (`@heroui/react`) / HeroUI Native (`heroui-native`) solve this?
- Can it be shared between platforms (goes in `packages/`)?
- Is it platform-specific (stays in `apps/`)?
- Is it reusable, or should it stay route-scoped?

Follow DESIGN.md §22 (Before Creating a New Component — Checklist) for the full UI-side checklist.

## Error Handling

- Never silently swallow errors.
- Show user-friendly messages (`FieldError` + `isInvalid` pattern on inputs).
- Log unexpected failures.
- Keep loading and error states separate.
- Fail gracefully — degrade, don't crash.

## Accessibility

- Follow DESIGN.md §1 (Design Philosophy) — accessibility rules live there.
- Accessible labels on all inputs and icon-only buttons.
- Manage focus and show visible focus rings (`#376BF5`/15% on web, `border-focus` on mobile).
- Touch targets sized for mobile use.
- Color contrast: muted text no lighter than `#6C757D`/`gray-500`; status colors never used alone.
- Support screen readers (semantic HTML, `aria` roles, `accessibilityLabel`).

## Security

- Never expose secrets — only `NEXT_PUBLIC_*` / `EXPO_PUBLIC_*` env vars reach the client; never commit `.env*`.
- Validate all user input client-side.
- Trust server validation — RLS is the final authority; don't rely on UI hiding.
- Store storage paths, not URLs; generate signed URLs on read.
- Respect RLS — never bypass `public.users.id` indirection.
- Avoid leaking sensitive data (PII, reference numbers) in logs, URLs, or client state.

## AI Working Rules

- Read existing code before writing — start with Graphify.
- Prefer consistency over novelty.
- Follow DESIGN.md — never redesign UI unless requested.
- Reuse shared packages (`@repo/*`) before writing new utilities.
- Match the surrounding code's style.
- Don't introduce new dependencies without justification.
- Keep changes minimal.
- Preserve backwards compatibility whenever possible.
- Content/visual decisions: follow DESIGN.md §25 (AI Working Rules).

## When Modifying Existing Code

Before editing:

- Understand the nearby code and its conventions.
- Understand shared components (`app/components`, `components/`, `packages/`).
- Check platform parity — does the sibling platform implement this feature?
- Search for an existing implementation (Graphify first).

After editing:

- Run `graphify update .` to keep the graph current.
- Update documentation if necessary.
- Keep imports clean.
- Remove unused code.

## Documentation Responsibilities

When introducing new architecture:

- Update AGENTS.md if engineering conventions change.
- Update DESIGN.md if UI changes.
- Update design-tokens.json if tokens change.
- Document new shared components.

## Future-Proofing

- Prefer durable rules over implementation details; avoid naming specific components/screens unless they're long-lived architecture.
- When facts change (stack, tooling, conventions), update AGENTS.md in the same change.

## Maintaining AGENTS.md

- Capture durable engineering conventions only.
- Sprint status, tickets, and implementation details belong in PRs/issue trackers — not here.
- Every claim must be verifiable against the repo; fix or remove anything that drifts from reality.

## Graphify

This project has a knowledge graph at graphify-out/ with god nodes, community structure, and cross-file relationships.

When the user types `/graphify`, use the installed graphify skill or instructions before doing anything else.

**Graphify is the default navigation mechanism** — run it before repository-wide searching (grep) for any codebase question.

Choosing the right command:

| Goal | Use |
|---|---|
| Codebase question ("how does X work?") | `graphify query "<question>"` |
| Focused concept, component, or feature | `graphify explain "<concept>"` |
| Relationship between two files/concepts | `graphify path "<A>" "<B>"` |
| Broad navigation / first look at the repo | `graphify-out/wiki/index.md` (if present) |
| Broad architecture review, or when query/explain/path surface too little | `graphify-out/GRAPH_REPORT.md` |

These return a scoped subgraph, usually much smaller than GRAPH_REPORT.md or raw grep output.

Rules:
- Dirty graphify-out/ files are expected after hooks or incremental updates; dirty graph files are not a reason to skip graphify. Only skip graphify if the task is about stale or incorrect graph output, or the user explicitly says not to use it.
- After modifying code, run `graphify update .` to keep the graph current (AST-only, no API cost).

## What NOT to do

- Don't reintroduce NativeWind or `lucide-react-native` on mobile.
- Don't bypass `public.users.id` indirection in new RLS policies or FK joins.
- Don't store public URLs for private bucket assets — store paths and sign on read.
- Don't use `@repo/supabase`'s default export on web (it's mobile-oriented); use `@supabase/ssr` directly or `@repo/supabase/server` / `@repo/supabase/browser`.
