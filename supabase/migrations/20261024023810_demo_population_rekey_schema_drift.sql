-- Follow-up to the re-key operation. Tracked rows are recorded as `to_jsonb(row)`
-- when a run is applied, so a column added to a table afterwards (for example the
-- move-in billing columns on payment) makes every recorded row differ from the row
-- as it is now, even when nothing was edited. The re-key checks must compare what
-- was recorded and nothing else:
--   * every recorded column must still hold its recorded value, and
--   * a column added since must still be empty (NULL); a populated one is new
--     information the importer never wrote, so the re-key refuses.
-- Reset, cleanup and verify keep their original strict comparison.

create function demo_population.matches_recorded(p_current jsonb, p_recorded jsonb) returns boolean
language sql immutable set search_path = '' as $$
  select p_current is not null and p_recorded is not null
    and (p_current - array(select jsonb_object_keys(p_current) except select jsonb_object_keys(p_recorded))) = p_recorded
    and not exists (
      select 1 from jsonb_each(p_current) e
      where not jsonb_exists(p_recorded, e.key) and e.value <> 'null'::jsonb
    )
$$;

do $migration$
declare v_definition text;
  v_check_old text := 'if v_row is distinct from r.after_row then
      raise exception ''Tracked demo payments were changed or removed. Re-key refused.''';
  v_check_new text := 'if not demo_population.matches_recorded(v_row, r.after_row) then
      raise exception ''Tracked demo payments were changed or removed. Re-key refused.''';
  v_exec_old text := 'if v_row is distinct from r.after_row then raise exception ''Re-key verification failed.''';
  v_exec_new text := 'if not demo_population.matches_recorded(v_row, r.after_row) then raise exception ''Re-key verification failed.''';
begin
  v_definition := pg_get_functiondef('demo_population.check_rekey(uuid,jsonb,jsonb,jsonb)'::regprocedure);
  if strpos(v_definition, v_check_old) = 0 then raise exception 'Review the changed re-key check before extending it.'; end if;
  execute replace(v_definition, v_check_old, v_check_new);

  v_definition := pg_get_functiondef('demo_population.execute_rekey(text,jsonb,text,uuid,boolean)'::regprocedure);
  if strpos(v_definition, v_exec_old) = 0 then raise exception 'Review the changed re-key operation before extending it.'; end if;
  execute replace(v_definition, v_exec_old, v_exec_new);
end $migration$;

revoke all on all functions in schema demo_population from public, anon, authenticated, service_role;
