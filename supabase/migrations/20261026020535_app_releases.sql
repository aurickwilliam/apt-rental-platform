-- Sideloaded Android builds have no store to announce updates, so the app asks
-- this table which version is current. One row per platform: the newest
-- version, the oldest version still allowed to run, where to download it and
-- what changed. Anyone (signed out included) may read it, because the app
-- checks before sign-in and nothing here is private. Only the admin RPC below
-- writes it: no table-level write grant exists for clients.
create table public.app_releases (
  platform text primary key check (platform = 'android'),
  latest_version text not null check (latest_version ~ '^\d{1,4}\.\d{1,4}\.\d{1,4}$'),
  min_version text not null check (min_version ~ '^\d{1,4}\.\d{1,4}\.\d{1,4}$'),
  apk_url text not null check (apk_url ~ '^https://[^\s/]+\.[^\s/]+(/\S*)?$' and length(apk_url) <= 500),
  release_notes text check (release_notes is null or length(release_notes) <= 1000),
  updated_by uuid references public.users (id) on delete set null,
  updated_at timestamptz not null default now(),
  -- Integer arrays compare element by element, so 1.10.0 is newer than 1.9.0.
  constraint app_releases_min_not_newer check (
    string_to_array(min_version, '.')::int[] <= string_to_array(latest_version, '.')::int[]
  )
);

alter table public.app_releases enable row level security;

revoke all on public.app_releases from public, anon, authenticated;
-- Column-scoped like other public reads: updated_by (an internal profile id) stays private.
grant select (platform, latest_version, min_version, apk_url, release_notes, updated_at)
  on public.app_releases to anon, authenticated;

create policy "Anyone can read app releases"
  on public.app_releases for select to anon, authenticated
  using (true);

-- Admin-only: publishes (or replaces) the current release for a platform. The
-- caller is authorised from auth.uid() and must have passed the admin second
-- step (private.is_admin()).
create or replace function public.admin_publish_app_release(
  p_platform text,
  p_latest_version text,
  p_min_version text,
  p_apk_url text,
  p_release_notes text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_admin_id uuid;
begin
  if not (select private.is_admin()) then
    raise exception 'Admin access required.';
  end if;
  select id into v_admin_id from public.users
    where user_id = (select auth.uid()) and 'admin' = any (roles) and not is_suspended;
  if v_admin_id is null then raise exception 'Admin access required.'; end if;

  if p_platform is distinct from 'android' then
    raise exception 'Unsupported platform.';
  end if;

  -- The table checks repeat these rules; raising here gives readable messages.
  if p_latest_version is null or p_latest_version !~ '^\d{1,4}\.\d{1,4}\.\d{1,4}$'
     or p_min_version is null or p_min_version !~ '^\d{1,4}\.\d{1,4}\.\d{1,4}$' then
    raise exception 'Versions must look like 1.2.3.';
  end if;
  if string_to_array(p_min_version, '.')::int[] > string_to_array(p_latest_version, '.')::int[] then
    raise exception 'The required version cannot be newer than the latest version.';
  end if;
  if p_apk_url is null or p_apk_url !~ '^https://[^\s/]+\.[^\s/]+(/\S*)?$' or length(p_apk_url) > 500 then
    raise exception 'Enter a full https:// download link.';
  end if;
  if p_release_notes is not null and length(btrim(p_release_notes)) > 1000 then
    raise exception 'Keep the release notes under 1000 characters.';
  end if;

  insert into public.app_releases as r
    (platform, latest_version, min_version, apk_url, release_notes, updated_by, updated_at)
  values
    (p_platform, p_latest_version, p_min_version, btrim(p_apk_url), nullif(btrim(p_release_notes), ''), v_admin_id, now())
  on conflict (platform) do update set
    latest_version = excluded.latest_version,
    min_version = excluded.min_version,
    apk_url = excluded.apk_url,
    release_notes = excluded.release_notes,
    updated_by = excluded.updated_by,
    updated_at = excluded.updated_at;
end;
$$;

revoke all on function public.admin_publish_app_release(text, text, text, text, text) from public, anon;
grant execute on function public.admin_publish_app_release(text, text, text, text, text) to authenticated;
