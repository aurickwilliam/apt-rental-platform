-- QR-code verification sessions (desktop -> phone handoff).
--
-- A logged-in user on desktop creates a short-lived session; the page renders
-- a QR code containing ONLY an opaque bearer token (no user id, email, or PII).
-- The phone signs into the SAME account, claims the session (read-only check),
-- completes the ID/selfie wizard, and submits. Submission atomically consumes
-- the session via consume_verification_session() and inserts the
-- user_verifications row (status pending). Abandoned sessions simply expire.
--
-- Token model: the raw token is shown to its owner exactly once at creation
-- and never stored. Only its SHA-256 hex digest (token_hash) is persisted.
-- Sessions are single-use (active -> completed in one guarded UPDATE) and
-- short-lived (10 minutes; CHECK-capped at 15). Claim (read) never consumes.

-- Table --------------------------------------------------------------------

create table if not exists public.verification_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  verification_id uuid not null default gen_random_uuid(),
  token_hash text not null,
  status text not null default 'active'
    check (status in ('active', 'completed', 'expired')),
  expires_at timestamptz not null,
  created_at timestamptz not null default now(),
  completed_at timestamptz null,
  updated_at timestamptz null,
  constraint verification_sessions_short_expiry
    check (expires_at <= created_at + interval '15 minutes')
);

create unique index if not exists verification_sessions_token_hash_uidx
  on public.verification_sessions (token_hash);

create index if not exists verification_sessions_user_idx
  on public.verification_sessions (user_id);

-- One live session per user: creating a new QR replaces the need for the old
-- one (the server action deactivates prior active rows before inserting).
create unique index if not exists verification_sessions_one_active_per_user
  on public.verification_sessions (user_id)
  where status = 'active';

-- Grants (table privileges are checked before RLS) --------------------------
-- No UPDATE/DELETE grant at all: clients can never flip status, extend
-- expiry, or delete history. Consumption happens only through the
-- SECURITY DEFINER function below, which re-validates everything.

grant select, insert on public.verification_sessions to authenticated;

-- RLS -----------------------------------------------------------------------

alter table public.verification_sessions enable row level security;

-- Owners read only their own sessions (desktop polling + phone claim).
create policy "Users read own verification sessions"
  on public.verification_sessions for select
  using (user_id = (select id from public.users where user_id = auth.uid()));

-- Owners insert only their own row, always active with a future expiry.
-- The short-expiry CHECK above caps lifetime at the privilege level too.
create policy "Users insert own verification session"
  on public.verification_sessions for insert
  with check (
    user_id = (select id from public.users where user_id = auth.uid())
    and status = 'active'
    and expires_at > now()
    and completed_at is null
  );

-- Admins read sessions for support/debugging (never write).
create policy "Admins read verification sessions"
  on public.verification_sessions for select
  using (
    exists (
      select 1 from public.users
      where user_id = auth.uid() and 'admin' = any (roles)
    )
  );

-- Atomic single-use consume --------------------------------------------------
-- Called at submit time only. The guarded UPDATE...RETURNING makes double
-- submission safe: exactly one caller transitions active -> completed.
-- Abandoned (never-consumed) sessions just expire; claim paths never call this.

create or replace function public.consume_verification_session(p_token_hash text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid;
  v_verification_id uuid;
begin
  select id into v_user_id
  from public.users
  where user_id = auth.uid();

  if v_user_id is null then
    raise exception 'Not authenticated.';
  end if;

  update public.verification_sessions
     set status = 'completed',
         completed_at = now(),
         updated_at = now()
   where token_hash = p_token_hash
     and user_id = v_user_id
     and status = 'active'
     and expires_at > now()
  returning verification_id into v_verification_id;

  if v_verification_id is null then
    raise exception 'Session invalid, expired, or already used.';
  end if;

  return v_verification_id;
end;
$$;

revoke all on function public.consume_verification_session(text) from public, anon;
grant execute on function public.consume_verification_session(text) to authenticated;
