-- Top Rated now requires average_rating >= 4.5 (approved cohort definition), and
-- when all six cohorts are empty the RPC appends a newest 'All Results' section.
-- Patches the existing definition in place so it works whether or not the phase2
-- admin migration (is_hidden_by_admin) has been applied. The fallback query uses
-- "where (a.deleted_at is null)" so the phase2 patch, which requires exactly six
-- "where a.deleted_at is null" predicates, keeps working if applied afterwards.
do $migration$
declare
  v_def text := pg_get_functiondef('public.get_search_sections(text,text,jsonb,integer)'::regprocedure);
  v_hidden text := case when v_def like '%is_hidden_by_admin%' then ' and a.is_hidden_by_admin = false' else '' end;
  v_fallback text;
  v_old_return text := '  return jsonb_build_object(';
  v_old_tail text := E'\'apartments\', v_spacious)\n    )';
begin
  if (length(v_def) - length(replace(v_def, 'and a.average_rating is not null', ''))) / length('and a.average_rating is not null') <> 1
     or position(v_old_return in v_def) = 0 or position(v_old_tail in v_def) = 0
     or position('v_all_results' in v_def) > 0 then
    raise exception 'Search RPC has changed; audit it before migrating.';
  end if;

  v_def := replace(v_def, 'and a.average_rating is not null', 'and a.average_rating >= 4.5');
  v_def := replace(v_def, E'  v_spacious jsonb;\n', E'  v_spacious jsonb;\n  v_all_results jsonb := ''[]''::jsonb;\n');

  v_fallback := $f$  -- Global newest fallback when every cohort is empty
  if v_verified = '[]'::jsonb and v_budget_low = '[]'::jsonb and v_studio = '[]'::jsonb
     and v_top_rated = '[]'::jsonb and v_near_you = '[]'::jsonb and v_spacious = '[]'::jsonb then
    select coalesce(jsonb_agg(to_jsonb(t) order by t.created_at desc, t.id), '[]'::jsonb)
    into v_all_results
    from (
      select
        a.id, a.name, a.barangay, a.city, a.average_rating, a.monthly_rent,
        a.no_bedrooms, a.no_bathrooms, a.area_sqm, a.is_verified, a.type, a.created_at,
        coalesce((select jsonb_agg(to_jsonb(img) order by img.created_at) from public.apartment_images img where img.apartment_id = a.id), '[]'::jsonb) as apartment_images
      from public.apartments a
      where (a.deleted_at is null)$f$ || v_hidden || $f$
        and a.status in ('available','unverified')
        and (v_city = 'CAMANAVA' or a.city = v_city)
      order by a.created_at desc, a.id
      limit p_limit
    ) t;
  end if;

$f$;
  v_def := replace(v_def, v_old_return, v_fallback || v_old_return);
  v_def := replace(v_def, v_old_tail,
    E'\'apartments\', v_spacious)\n    ) || case when v_all_results = ''[]''::jsonb then ''[]''::jsonb\n              else jsonb_build_array(jsonb_build_object(''id'', ''all_results'', ''title'', ''All Results'', ''apartments'', v_all_results)) end');
  execute v_def;
end;
$migration$;
