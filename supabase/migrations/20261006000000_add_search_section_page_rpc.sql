-- Paginated "See All" page for one search section. Mirrors the predicates and
-- ordering of get_search_sections; ordering ends in a.id so offset pages are stable.
create or replace function public.get_search_section_page(
  p_section_id text,
  p_city text default 'CAMANAVA',
  p_search text default null,
  p_offset integer default 0,
  p_limit integer default 10
)
returns jsonb
language plpgsql
stable
security definer
set search_path to 'public'
as $function$
declare
  v_search text := nullif(trim(coalesce(p_search, '')), '');
  v_city text := coalesce(nullif(trim(p_city), ''), 'CAMANAVA');
  v_offset integer := greatest(coalesce(p_offset, 0), 0);
  v_limit integer := least(greatest(coalesce(p_limit, 10), 1), 50);
  result jsonb;
begin
  if p_section_id = 'verified' then
    select coalesce(jsonb_agg(to_jsonb(t) - 'rn' order by t.rn), '[]'::jsonb) into result
    from (
      select row_number() over (order by a.average_rating desc nulls last, a.id) as rn, a.id, a.name, a.barangay, a.city, a.average_rating,
        a.monthly_rent, a.no_bedrooms, a.no_bathrooms, a.area_sqm, a.is_verified, a.type, a.created_at,
        coalesce((select jsonb_agg(to_jsonb(img) order by img.created_at) from public.apartment_images img where img.apartment_id = a.id), '[]'::jsonb) as apartment_images
      from public.apartments a
      where a.deleted_at is null and a.is_hidden_by_admin = false
        and a.status in ('available','unverified')
        and a.is_verified = true
        and (v_city = 'CAMANAVA' or a.city = v_city)
        and (v_search is null or a.name ilike '%'||v_search||'%' or a.barangay ilike '%'||v_search||'%' or a.city ilike '%'||v_search||'%')
      order by a.average_rating desc nulls last, a.id
      offset v_offset limit v_limit
    ) t;
  elsif p_section_id = 'budget_low' then
    select coalesce(jsonb_agg(to_jsonb(t) - 'rn' order by t.rn), '[]'::jsonb) into result
    from (
      select row_number() over (order by a.monthly_rent asc, a.id) as rn, a.id, a.name, a.barangay, a.city, a.average_rating,
        a.monthly_rent, a.no_bedrooms, a.no_bathrooms, a.area_sqm, a.is_verified, a.type, a.created_at,
        coalesce((select jsonb_agg(to_jsonb(img) order by img.created_at) from public.apartment_images img where img.apartment_id = a.id), '[]'::jsonb) as apartment_images
      from public.apartments a
      where a.deleted_at is null and a.is_hidden_by_admin = false
        and a.status in ('available','unverified')
        and a.monthly_rent <= 10000
        and (v_city = 'CAMANAVA' or a.city = v_city)
        and (v_search is null or a.name ilike '%'||v_search||'%' or a.barangay ilike '%'||v_search||'%' or a.city ilike '%'||v_search||'%')
      order by a.monthly_rent asc, a.id
      offset v_offset limit v_limit
    ) t;
  elsif p_section_id = 'studio' then
    select coalesce(jsonb_agg(to_jsonb(t) - 'rn' order by t.rn), '[]'::jsonb) into result
    from (
      select row_number() over (order by a.created_at desc, a.id) as rn, a.id, a.name, a.barangay, a.city, a.average_rating,
        a.monthly_rent, a.no_bedrooms, a.no_bathrooms, a.area_sqm, a.is_verified, a.type, a.created_at,
        coalesce((select jsonb_agg(to_jsonb(img) order by img.created_at) from public.apartment_images img where img.apartment_id = a.id), '[]'::jsonb) as apartment_images
      from public.apartments a
      where a.deleted_at is null and a.is_hidden_by_admin = false
        and a.status in ('available','unverified')
        and a.type = 'Studio'
        and (v_city = 'CAMANAVA' or a.city = v_city)
        and (v_search is null or a.name ilike '%'||v_search||'%' or a.barangay ilike '%'||v_search||'%' or a.city ilike '%'||v_search||'%')
      order by a.created_at desc, a.id
      offset v_offset limit v_limit
    ) t;
  elsif p_section_id = 'top_rated' then
    select coalesce(jsonb_agg(to_jsonb(t) - 'rn' order by t.rn), '[]'::jsonb) into result
    from (
      select row_number() over (order by a.average_rating desc nulls last, a.id) as rn, a.id, a.name, a.barangay, a.city, a.average_rating,
        a.monthly_rent, a.no_bedrooms, a.no_bathrooms, a.area_sqm, a.is_verified, a.type, a.created_at,
        coalesce((select jsonb_agg(to_jsonb(img) order by img.created_at) from public.apartment_images img where img.apartment_id = a.id), '[]'::jsonb) as apartment_images
      from public.apartments a
      where a.deleted_at is null and a.is_hidden_by_admin = false
        and a.status in ('available','unverified')
        and a.average_rating is not null
        and (v_city = 'CAMANAVA' or a.city = v_city)
        and (v_search is null or a.name ilike '%'||v_search||'%' or a.barangay ilike '%'||v_search||'%' or a.city ilike '%'||v_search||'%')
      order by a.average_rating desc nulls last, a.id
      offset v_offset limit v_limit
    ) t;
  elsif p_section_id = 'near_you' then
    select coalesce(jsonb_agg(to_jsonb(t) - 'rn' order by t.rn), '[]'::jsonb) into result
    from (
      select row_number() over (order by a.created_at desc, a.id) as rn, a.id, a.name, a.barangay, a.city, a.average_rating,
        a.monthly_rent, a.no_bedrooms, a.no_bathrooms, a.area_sqm, a.is_verified, a.type, a.created_at,
        coalesce((select jsonb_agg(to_jsonb(img) order by img.created_at) from public.apartment_images img where img.apartment_id = a.id), '[]'::jsonb) as apartment_images
      from public.apartments a
      where a.deleted_at is null and a.is_hidden_by_admin = false
        and a.status in ('available','unverified')
        
        and (v_city = 'CAMANAVA' or a.city = v_city)
        and (v_search is null or a.name ilike '%'||v_search||'%' or a.barangay ilike '%'||v_search||'%' or a.city ilike '%'||v_search||'%')
      order by a.created_at desc, a.id
      offset v_offset limit v_limit
    ) t;
  elsif p_section_id = 'spacious' then
    select coalesce(jsonb_agg(to_jsonb(t) - 'rn' order by t.rn), '[]'::jsonb) into result
    from (
      select row_number() over (order by a.area_sqm desc, a.id) as rn, a.id, a.name, a.barangay, a.city, a.average_rating,
        a.monthly_rent, a.no_bedrooms, a.no_bathrooms, a.area_sqm, a.is_verified, a.type, a.created_at,
        coalesce((select jsonb_agg(to_jsonb(img) order by img.created_at) from public.apartment_images img where img.apartment_id = a.id), '[]'::jsonb) as apartment_images
      from public.apartments a
      where a.deleted_at is null and a.is_hidden_by_admin = false
        and a.status in ('available','unverified')
        and a.area_sqm >= 60
        and (v_city = 'CAMANAVA' or a.city = v_city)
        and (v_search is null or a.name ilike '%'||v_search||'%' or a.barangay ilike '%'||v_search||'%' or a.city ilike '%'||v_search||'%')
      order by a.area_sqm desc, a.id
      offset v_offset limit v_limit
    ) t;
  else
    raise exception 'Unknown search section: %', p_section_id using errcode = '22023';
  end if;
  return result;
end;
$function$;

revoke all on function public.get_search_section_page(text, text, text, integer, integer) from public;
grant execute on function public.get_search_section_page(text, text, text, integer, integer) to authenticated, anon;
