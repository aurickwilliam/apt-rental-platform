-- Lets the Add Property form check a prospective pin before the landlord can
-- continue. The trigger remains the final enforcement point for all writes.

create or replace function public.validate_camanava_location(
  p_city text,
  p_latitude double precision,
  p_longitude double precision
)
returns boolean
language sql
security definer
set search_path = private, extensions, public
stable
as $$
  select p_city in ('Caloocan', 'Malabon', 'Navotas', 'Valenzuela')
    and p_latitude is not null
    and p_longitude is not null
    and exists (
      select 1
      from private.camanava_city_boundaries
      where city = p_city
        and extensions.ST_Covers(
          boundary,
          extensions.ST_SetSRID(extensions.ST_MakePoint(p_longitude, p_latitude), 4326)
        )
    );
$$;

revoke all on function public.validate_camanava_location(text, double precision, double precision) from public;
revoke all on function public.validate_camanava_location(text, double precision, double precision) from anon;
grant execute on function public.validate_camanava_location(text, double precision, double precision) to authenticated;
