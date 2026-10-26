-- Keeps every published Android release, so the admin App updates page can show
-- what was shipped and when. app_releases still holds only the current row that
-- apps read; this table is append-only and admin-only.
create table public.app_release_history (
  id uuid primary key default gen_random_uuid(),
  platform text not null check (platform = 'android'),
  latest_version text not null check (latest_version ~ '^\d{1,4}\.\d{1,4}\.\d{1,4}$'),
  min_version text not null check (min_version ~ '^\d{1,4}\.\d{1,4}\.\d{1,4}$'),
  apk_url text not null,
  release_notes text,
  published_by uuid references public.users (id) on delete set null,
  published_at timestamptz not null default now()
);

create index app_release_history_platform_published_idx
  on public.app_release_history (platform, published_at desc);
create index app_release_history_published_by_idx
  on public.app_release_history (published_by);

alter table public.app_release_history enable row level security;

revoke all on public.app_release_history from public, anon, authenticated;
grant select on public.app_release_history to authenticated;

-- private.is_admin() includes the admin second step.
create policy "Admins can read app release history"
  on public.app_release_history for select to authenticated
  using ((select private.is_admin()));

-- The release that is live today becomes the first history entry.
insert into public.app_release_history
  (platform, latest_version, min_version, apk_url, release_notes, published_by, published_at)
select platform, latest_version, min_version, apk_url, release_notes, updated_by, updated_at
from public.app_releases;

-- Same publish function as before, now also recording a history row. Saving the
-- exact values that are already live is not a new release, so it is not logged.
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
  v_apk_url text := btrim(p_apk_url);
  v_notes text := nullif(btrim(p_release_notes), '');
  v_current public.app_releases%rowtype;
  v_has_current boolean;
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
  if v_apk_url is null or v_apk_url !~ '^https://[^\s/]+\.[^\s/]+(/\S*)?$' or length(v_apk_url) > 500 then
    raise exception 'Enter a full https:// download link.';
  end if;
  if p_release_notes is not null and length(btrim(p_release_notes)) > 1000 then
    raise exception 'Keep the release notes under 1000 characters.';
  end if;

  select * into v_current from public.app_releases where platform = p_platform for update;
  v_has_current := found;

  insert into public.app_releases as r
    (platform, latest_version, min_version, apk_url, release_notes, updated_by, updated_at)
  values
    (p_platform, p_latest_version, p_min_version, v_apk_url, v_notes, v_admin_id, now())
  on conflict (platform) do update set
    latest_version = excluded.latest_version,
    min_version = excluded.min_version,
    apk_url = excluded.apk_url,
    release_notes = excluded.release_notes,
    updated_by = excluded.updated_by,
    updated_at = excluded.updated_at;

  if not v_has_current
     or v_current.latest_version is distinct from p_latest_version
     or v_current.min_version is distinct from p_min_version
     or v_current.apk_url is distinct from v_apk_url
     or v_current.release_notes is distinct from v_notes then
    insert into public.app_release_history
      (platform, latest_version, min_version, apk_url, release_notes, published_by)
    values
      (p_platform, p_latest_version, p_min_version, v_apk_url, v_notes, v_admin_id);
  end if;
end;
$$;

revoke all on public.app_release_history from public, anon;
revoke all on function public.admin_publish_app_release(text, text, text, text, text) from public, anon;
grant execute on function public.admin_publish_app_release(text, text, text, text, text) to authenticated;
