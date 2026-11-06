-- First-time tutorial progress.
--
-- One row per (user, portal): tenant and landlord tutorials are tracked
-- separately, and the row is shared by web and mobile. A missing row means
-- "not seen yet" (the app then offers the tutorial once); `completed_at` /
-- `skipped_at` both stop the automatic prompt. Replaying from Settings never
-- needs a write unless the user finishes it again.
--
-- Owner-only: a person reads and writes only their own rows, and only for a
-- portal they hold. Rows are never deleted by clients.

create table if not exists public.tutorial_progress (
  user_id uuid not null references public.users (id) on delete cascade,
  portal text not null check (portal in ('tenant', 'landlord')),
  completed_at timestamptz,
  skipped_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, portal)
);

alter table public.tutorial_progress enable row level security;

-- Supabase's default privileges also hand `authenticated` delete and the
-- rest, so clear them before granting exactly what clients need.
revoke all on public.tutorial_progress from public, anon, authenticated;
grant select, insert, update on public.tutorial_progress to authenticated;

create policy "Users read own tutorial progress"
  on public.tutorial_progress for select to authenticated
  using (user_id = (select id from public.users where user_id = auth.uid()));

create policy "Users insert own tutorial progress"
  on public.tutorial_progress for insert to authenticated
  with check (
    user_id = (select id from public.users where user_id = auth.uid())
    and portal = any (
      coalesce((select roles from public.users where user_id = auth.uid()), '{}'::text[])
    )
  );

create policy "Users update own tutorial progress"
  on public.tutorial_progress for update to authenticated
  using (user_id = (select id from public.users where user_id = auth.uid()))
  with check (user_id = (select id from public.users where user_id = auth.uid()));

create policy "Active accounts only" on public.tutorial_progress as restrictive
  for all to authenticated
  using ((select app_private.is_active_user()))
  with check ((select app_private.is_active_user()));

-- Existing accounts with a finished profile are marked completed for every
-- portal they hold, so only accounts created from now on see the tutorial.
-- "Finished profile" is the same rule as `needsProfileOnboarding`: a mobile
-- number, or a status past `unverified`.
insert into public.tutorial_progress (user_id, portal, completed_at)
select u.id, p.portal, now()
from public.users u
cross join lateral unnest(u.roles) as p(portal)
where p.portal in ('tenant', 'landlord')
  and (u.mobile_number is not null or coalesce(u.account_status, 'unverified') <> 'unverified')
on conflict (user_id, portal) do nothing;
