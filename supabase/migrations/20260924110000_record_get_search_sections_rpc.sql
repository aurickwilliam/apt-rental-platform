-- Records the get_search_sections RPC that already exists in the live database
-- but was never captured as a migration. The later phase2_admin_operations
-- migration patches this function in place and requires exactly six
-- "where a.deleted_at is null" predicates, so this must sort before it.
create or replace function public.get_search_sections(
  p_city text default 'CAMANAVA',
  p_search text default null,
  p_filters jsonb default '{}'::jsonb,
  p_limit integer default 8
)
returns jsonb
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_search text := nullif(trim(coalesce(p_search, '')), '');
  v_city text := coalesce(nullif(trim(p_city), ''), 'CAMANAVA');
  v_verified jsonb;
  v_budget_low jsonb;
  v_studio jsonb;
  v_top_rated jsonb;
  v_near_you jsonb;
  v_spacious jsonb;
begin
  -- Verified
  select coalesce(jsonb_agg(to_jsonb(t) order by t.average_rating desc nulls last, t.id), '[]'::jsonb)
  into v_verified
  from (
    select
      a.id, a.name, a.barangay, a.city, a.average_rating, a.monthly_rent,
      a.no_bedrooms, a.no_bathrooms, a.area_sqm, a.is_verified, a.type, a.created_at,
      coalesce((select jsonb_agg(to_jsonb(img) order by img.created_at) from public.apartment_images img where img.apartment_id = a.id), '[]'::jsonb) as apartment_images
    from public.apartments a
    where a.deleted_at is null
      and a.status in ('available','unverified')
      and a.is_verified = true
      and (v_city = 'CAMANAVA' or a.city = v_city)
      and (v_search is null or a.name ilike '%'||v_search||'%' or a.barangay ilike '%'||v_search||'%' or a.city ilike '%'||v_search||'%')
    order by a.average_rating desc nulls last, a.id
    limit p_limit
  ) t;

  -- Budget low
  select coalesce(jsonb_agg(to_jsonb(t) order by t.monthly_rent asc, t.id), '[]'::jsonb)
  into v_budget_low
  from (
    select
      a.id, a.name, a.barangay, a.city, a.average_rating, a.monthly_rent,
      a.no_bedrooms, a.no_bathrooms, a.area_sqm, a.is_verified, a.type, a.created_at,
      coalesce((select jsonb_agg(to_jsonb(img) order by img.created_at) from public.apartment_images img where img.apartment_id = a.id), '[]'::jsonb) as apartment_images
    from public.apartments a
    where a.deleted_at is null
      and a.status in ('available','unverified')
      and a.monthly_rent <= 10000
      and (v_city = 'CAMANAVA' or a.city = v_city)
      and (v_search is null or a.name ilike '%'||v_search||'%' or a.barangay ilike '%'||v_search||'%' or a.city ilike '%'||v_search||'%')
    order by a.monthly_rent asc, a.id
    limit p_limit
  ) t;

  -- Studio
  select coalesce(jsonb_agg(to_jsonb(t) order by t.created_at desc, t.id), '[]'::jsonb)
  into v_studio
  from (
    select
      a.id, a.name, a.barangay, a.city, a.average_rating, a.monthly_rent,
      a.no_bedrooms, a.no_bathrooms, a.area_sqm, a.is_verified, a.type, a.created_at,
      coalesce((select jsonb_agg(to_jsonb(img) order by img.created_at) from public.apartment_images img where img.apartment_id = a.id), '[]'::jsonb) as apartment_images
    from public.apartments a
    where a.deleted_at is null
      and a.status in ('available','unverified')
      and a.type = 'Studio'
      and (v_city = 'CAMANAVA' or a.city = v_city)
      and (v_search is null or a.name ilike '%'||v_search||'%' or a.barangay ilike '%'||v_search||'%' or a.city ilike '%'||v_search||'%')
    order by a.created_at desc, a.id
    limit p_limit
  ) t;

  -- Top rated
  select coalesce(jsonb_agg(to_jsonb(t) order by t.average_rating desc nulls last, t.id), '[]'::jsonb)
  into v_top_rated
  from (
    select
      a.id, a.name, a.barangay, a.city, a.average_rating, a.monthly_rent,
      a.no_bedrooms, a.no_bathrooms, a.area_sqm, a.is_verified, a.type, a.created_at,
      coalesce((select jsonb_agg(to_jsonb(img) order by img.created_at) from public.apartment_images img where img.apartment_id = a.id), '[]'::jsonb) as apartment_images
    from public.apartments a
    where a.deleted_at is null
      and a.status in ('available','unverified')
      and a.average_rating is not null
      and (v_city = 'CAMANAVA' or a.city = v_city)
      and (v_search is null or a.name ilike '%'||v_search||'%' or a.barangay ilike '%'||v_search||'%' or a.city ilike '%'||v_search||'%')
    order by a.average_rating desc nulls last, a.id
    limit p_limit
  ) t;

  -- Near you (city match, newest)
  select coalesce(jsonb_agg(to_jsonb(t) order by t.created_at desc, t.id), '[]'::jsonb)
  into v_near_you
  from (
    select
      a.id, a.name, a.barangay, a.city, a.average_rating, a.monthly_rent,
      a.no_bedrooms, a.no_bathrooms, a.area_sqm, a.is_verified, a.type, a.created_at,
      coalesce((select jsonb_agg(to_jsonb(img) order by img.created_at) from public.apartment_images img where img.apartment_id = a.id), '[]'::jsonb) as apartment_images
    from public.apartments a
    where a.deleted_at is null
      and a.status in ('available','unverified')
      and (v_city = 'CAMANAVA' or a.city = v_city)
      and (v_search is null or a.name ilike '%'||v_search||'%' or a.barangay ilike '%'||v_search||'%' or a.city ilike '%'||v_search||'%')
    order by a.created_at desc, a.id
    limit p_limit
  ) t;

  -- Spacious
  select coalesce(jsonb_agg(to_jsonb(t) order by t.area_sqm desc, t.id), '[]'::jsonb)
  into v_spacious
  from (
    select
      a.id, a.name, a.barangay, a.city, a.average_rating, a.monthly_rent,
      a.no_bedrooms, a.no_bathrooms, a.area_sqm, a.is_verified, a.type, a.created_at,
      coalesce((select jsonb_agg(to_jsonb(img) order by img.created_at) from public.apartment_images img where img.apartment_id = a.id), '[]'::jsonb) as apartment_images
    from public.apartments a
    where a.deleted_at is null
      and a.status in ('available','unverified')
      and a.area_sqm >= 60
      and (v_city = 'CAMANAVA' or a.city = v_city)
      and (v_search is null or a.name ilike '%'||v_search||'%' or a.barangay ilike '%'||v_search||'%' or a.city ilike '%'||v_search||'%')
    order by a.area_sqm desc, a.id
    limit p_limit
  ) t;

  return jsonb_build_object(
    'sections', jsonb_build_array(
      jsonb_build_object('id', 'verified', 'title', case when v_city='CAMANAVA' then 'Verified in CAMANAVA' else 'Verified in '||v_city end, 'apartments', v_verified),
      jsonb_build_object('id', 'budget_low', 'title', 'Under ₱10k', 'apartments', v_budget_low),
      jsonb_build_object('id', 'studio', 'title', 'Studio Units', 'apartments', v_studio),
      jsonb_build_object('id', 'top_rated', 'title', 'Top Rated', 'apartments', v_top_rated),
      jsonb_build_object('id', 'near_you', 'title', case when v_city='CAMANAVA' then 'Near You' else 'Near '||v_city end, 'apartments', v_near_you),
      jsonb_build_object('id', 'spacious', 'title', 'Spacious (≥60sqm)', 'apartments', v_spacious)
    )
  );
end;
$function$;

grant execute on function public.get_search_sections(text, text, jsonb, integer) to authenticated, anon;
