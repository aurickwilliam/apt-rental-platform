-- Keep the See All page in line with the Top Rated preview row: only
-- apartments rated 4.5 or higher belong to the cohort (see 20261007000000).
-- Patches the top_rated branch in place; a no-op once already patched.
do $$
declare
  v_definition text := pg_get_functiondef('public.get_search_section_page(text,text,text,jsonb,integer)'::regprocedure);
  v_start int := position('p_section_id = ''top_rated''' in v_definition);
  v_end int := position('p_section_id = ''near_you''' in v_definition);
  v_branch text;
  v_old text := 'and a.average_rating is not null';
begin
  if v_start = 0 or v_end <= v_start then
    raise exception 'Search page RPC changed; audit the top_rated branch.';
  end if;
  v_branch := substr(v_definition, v_start, v_end - v_start);
  if position('average_rating >= 4.5' in v_branch) = 0 then
    if (length(v_branch) - length(replace(v_branch, v_old, ''))) / length(v_old) <> 1 then
      raise exception 'Search page RPC changed; audit the top_rated predicate.';
    end if;
    execute substr(v_definition, 1, v_start - 1)
      || replace(v_branch, v_old, 'and a.average_rating >= 4.5')
      || substr(v_definition, v_end);
  end if;
end;
$$;
