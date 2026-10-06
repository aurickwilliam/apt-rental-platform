-- Keyset ("continue after this row") pagination for the See All pages.
-- Replaces the offset-based get_search_section_page. The cursor is opaque to the
-- client: {"v": <sort value of last row>, "id": <uuid of last row>}.
-- Returns {"items": [...], "next_cursor": <cursor or null>}.
drop function if exists public.get_search_section_page(text, text, text, integer, integer);

create or replace function public.get_search_section_page(
  p_section_id text,
  p_city text default 'CAMANAVA',
  p_search text default null,
  p_after jsonb default null,
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
  v_limit integer := least(greatest(coalesce(p_limit, 10), 1), 50);
  v_has_after boolean := p_after is not null and p_after ? 'id';
  v_cursor_null boolean := v_has_after and (p_after->>'v') is null;
  v_id uuid := case when v_has_after then (p_after->>'id')::uuid end;
  v_val text := case when v_has_after then p_after->>'v' end;
  v_key text;
  v_raw jsonb;
  v_items jsonb;
  v_last jsonb;
  v_next jsonb := null;
begin
  if p_section_id = 'verified' then
    v_key := 'average_rating';
    select coalesce(jsonb_agg(to_jsonb(t) - 'rn' order by t.rn), '[]'::jsonb) into v_raw
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
        and (not v_has_after or (case when v_cursor_null then (a.average_rating is null and a.id > v_id) else (a.average_rating < (v_val::numeric) or a.average_rating is null or (a.average_rating = (v_val::numeric) and a.id > v_id)) end))
      order by a.average_rating desc nulls last, a.id
      limit v_limit + 1
    ) t;
  elsif p_section_id = 'budget_low' then
    v_key := 'monthly_rent';
    select coalesce(jsonb_agg(to_jsonb(t) - 'rn' order by t.rn), '[]'::jsonb) into v_raw
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
        and (not v_has_after or a.monthly_rent > (v_val::numeric) or (a.monthly_rent = (v_val::numeric) and a.id > v_id))
      order by a.monthly_rent asc, a.id
      limit v_limit + 1
    ) t;
  elsif p_section_id = 'studio' then
    v_key := 'created_at';
    select coalesce(jsonb_agg(to_jsonb(t) - 'rn' order by t.rn), '[]'::jsonb) into v_raw
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
        and (not v_has_after or a.created_at < (v_val::timestamptz) or (a.created_at = (v_val::timestamptz) and a.id > v_id))
      order by a.created_at desc, a.id
      limit v_limit + 1
    ) t;
  elsif p_section_id = 'top_rated' then
    v_key := 'average_rating';
    select coalesce(jsonb_agg(to_jsonb(t) - 'rn' order by t.rn), '[]'::jsonb) into v_raw
    from (
      select row_number() over (order by a.average_rating desc, a.id) as rn, a.id, a.name, a.barangay, a.city, a.average_rating,
        a.monthly_rent, a.no_bedrooms, a.no_bathrooms, a.area_sqm, a.is_verified, a.type, a.created_at,
        coalesce((select jsonb_agg(to_jsonb(img) order by img.created_at) from public.apartment_images img where img.apartment_id = a.id), '[]'::jsonb) as apartment_images
      from public.apartments a
      where a.deleted_at is null and a.is_hidden_by_admin = false
        and a.status in ('available','unverified')
        and a.average_rating is not null
        and (v_city = 'CAMANAVA' or a.city = v_city)
        and (v_search is null or a.name ilike '%'||v_search||'%' or a.barangay ilike '%'||v_search||'%' or a.city ilike '%'||v_search||'%')
        and (not v_has_after or a.average_rating < (v_val::numeric) or (a.average_rating = (v_val::numeric) and a.id > v_id))
      order by a.average_rating desc, a.id
      limit v_limit + 1
    ) t;
  elsif p_section_id = 'near_you' then
    v_key := 'created_at';
    select coalesce(jsonb_agg(to_jsonb(t) - 'rn' order by t.rn), '[]'::jsonb) into v_raw
    from (
      select row_number() over (order by a.created_at desc, a.id) as rn, a.id, a.name, a.barangay, a.city, a.average_rating,
        a.monthly_rent, a.no_bedrooms, a.no_bathrooms, a.area_sqm, a.is_verified, a.type, a.created_at,
        coalesce((select jsonb_agg(to_jsonb(img) order by img.created_at) from public.apartment_images img where img.apartment_id = a.id), '[]'::jsonb) as apartment_images
      from public.apartments a
      where a.deleted_at is null and a.is_hidden_by_admin = false
        and a.status in ('available','unverified')
        
        and (v_city = 'CAMANAVA' or a.city = v_city)
        and (v_search is null or a.name ilike '%'||v_search||'%' or a.barangay ilike '%'||v_search||'%' or a.city ilike '%'||v_search||'%')
        and (not v_has_after or a.created_at < (v_val::timestamptz) or (a.created_at = (v_val::timestamptz) and a.id > v_id))
      order by a.created_at desc, a.id
      limit v_limit + 1
    ) t;
  elsif p_section_id = 'spacious' then
    v_key := 'area_sqm';
    select coalesce(jsonb_agg(to_jsonb(t) - 'rn' order by t.rn), '[]'::jsonb) into v_raw
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
        and (not v_has_after or a.area_sqm < (v_val::numeric) or (a.area_sqm = (v_val::numeric) and a.id > v_id))
      order by a.area_sqm desc, a.id
      limit v_limit + 1
    ) t;
  else
    raise exception 'Unknown search section: %', p_section_id using errcode = '22023';
  end if;

  if jsonb_array_length(v_raw) > v_limit then
    select coalesce(jsonb_agg(e order by i), '[]'::jsonb) into v_items
    from jsonb_array_elements(v_raw) with ordinality as x(e, i)
    where i <= v_limit;
    v_last := v_items -> (v_limit - 1);
    v_next := jsonb_build_object('v', v_last -> v_key, 'id', v_last -> 'id');
  else
    v_items := v_raw;
  end if;

  return jsonb_build_object('items', v_items, 'next_cursor', v_next);
end;
$function$;

revoke all on function public.get_search_section_page(text, text, text, jsonb, integer) from public;
grant execute on function public.get_search_section_page(text, text, text, jsonb, integer) to authenticated, anon;
