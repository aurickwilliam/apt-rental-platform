-- Apartment geo search: PostGIS bbox + radius (mobile map search)
-- MVP uses direct lat/lng bbox filters in app; this migration adds optional GIST index + RPCs for faster viewport queries.
-- Keeps MapLibre fallback compatibility; works with Google Maps pins.

create extension if not exists postgis with schema public;

-- Generated geography column for apartments that have lat/lng
-- Use IF NOT EXISTS guard via DO block for idempotency on existing branches
do $$
begin
  if not exists (
    select 1 from information_schema.columns
    where table_schema='public' and table_name='apartments' and column_name='geom'
  ) then
    alter table public.apartments
      add column geom geography(Point, 4326)
      generated always as (
        case when latitude is not null and longitude is not null
          then ST_SetSRID(ST_MakePoint(longitude, latitude), 4326)::geography
          else null
        end
      ) stored;
  end if;
end $$;

create index if not exists apartments_geom_idx on public.apartments using gist (geom);
create index if not exists apartments_lat_lng_idx on public.apartments (latitude, longitude) where deleted_at is null and latitude is not null and longitude is not null;

-- Viewport bbox: returns apartments with coords inside envelope
create or replace function public.apartments_in_bbox(
  p_min_lng double precision,
  p_min_lat double precision,
  p_max_lng double precision,
  p_max_lat double precision,
  p_limit int default 100
)
returns setof public.apartments
language sql
stable
security definer
set search_path = public
as $$
  -- Prefer geography index when available; fallback to column range is also indexed
  select *
  from public.apartments
  where deleted_at is null
    and status in ('available','unverified')
    and latitude is not null and longitude is not null
    and latitude between p_min_lat and p_max_lat
    and longitude between p_min_lng and p_max_lng
    -- Additional geography containment when geom is populated (covers antimeridian edge not needed for PH)
    and (geom is null or ST_Within(geom::geometry, ST_MakeEnvelope(p_min_lng, p_min_lat, p_max_lng, p_max_lat, 4326)))
  order by created_at desc
  limit greatest(1, least(coalesce(p_limit, 100), 200));
$$;

revoke all on function public.apartments_in_bbox(double precision, double precision, double precision, double precision, int) from public;
grant execute on function public.apartments_in_bbox(double precision, double precision, double precision, double precision, int) to authenticated, service_role;

-- Radius search (future: "near me" 2km)
create or replace function public.apartments_near(
  p_lat double precision,
  p_lng double precision,
  p_radius_m int default 2000,
  p_limit int default 100
)
returns setof public.apartments
language sql
stable
security definer
set search_path = public
as $$
  select *
  from public.apartments
  where deleted_at is null
    and status in ('available','unverified')
    and latitude is not null and longitude is not null
    and geom is not null
    and ST_DWithin(geom, ST_SetSRID(ST_MakePoint(p_lng, p_lat), 4326)::geography, greatest(100, least(p_radius_m, 50000)))
  order by ST_Distance(geom, ST_SetSRID(ST_MakePoint(p_lng, p_lat), 4326)::geography)
  limit greatest(1, least(coalesce(p_limit,100),200));
$$;

revoke all on function public.apartments_near(double precision, double precision, int, int) from public;
grant execute on function public.apartments_near(double precision, double precision, int, int) to authenticated, service_role;
