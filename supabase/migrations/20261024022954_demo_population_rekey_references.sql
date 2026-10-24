-- Operator-only: lets the demo population tool give already-recorded generated
-- payments real-looking references (`APT-` plus eight capital letters or digits)
-- in place of `DEMO-<id>`, without resetting or rebaselining the run.
--
-- It is NOT a bypass of the integrity rules. The re-key succeeds only when:
--   * the target plan equals the saved plan except for payment references,
--   * every tracked payment still equals its recorded after-image,
--   * no other row, tracked or not, mentions an old reference, and
--   * no new reference is used by any other payment.
-- It changes payment.reference_id, the recorded after-images of those payments
-- and the saved plan in one transaction, and nothing else.

-- 1. Generated payments may carry either the legacy or the new reference shape.
do $migration$
declare v_definition text;
  v_old text := 'p.reference_id not like ''DEMO-%''';
  v_new text := 'p.reference_id !~ ''^(DEMO-.+|APT-[A-Z0-9]{8})$''';
begin
  v_definition := pg_get_functiondef('demo_population.validate(uuid)'::regprocedure);
  if strpos(v_definition, v_old) = 0 then raise exception 'Review the changed payment validator before extending it.'; end if;
  execute replace(v_definition, v_old, v_new);
end $migration$;

-- 2. The saved plan and the target plan may differ ONLY in payment references.
-- Returns one row per payment whose reference changes.
create function demo_population.rekey_pairs(p_saved jsonb, p_target jsonb)
returns table(row_id uuid, old_reference text, new_reference text)
language plpgsql stable set search_path = '' as $$
begin
  if (p_saved - 'rows') is distinct from (p_target - 'rows')
    or jsonb_array_length(p_saved->'rows') is distinct from jsonb_array_length(p_target->'rows') then
    raise exception 'The re-key plan differs from the saved plan beyond payment references.' using errcode = 'AP007';
  end if;
  if exists (
    select 1
    from jsonb_array_elements(p_saved->'rows') with ordinality s(v, i)
    join jsonb_array_elements(p_target->'rows') with ordinality t(v, i) using (i)
    where s.v->>'table' is distinct from t.v->>'table'
      or (s.v->>'table' = 'payment' and (s.v #- '{data,reference_id}') is distinct from (t.v #- '{data,reference_id}'))
      or (s.v->>'table' <> 'payment' and s.v is distinct from t.v)
  ) then
    raise exception 'The re-key plan differs from the saved plan beyond payment references.' using errcode = 'AP007';
  end if;
  return query
    select (s.v->'data'->>'id')::uuid, s.v->'data'->>'reference_id', t.v->'data'->>'reference_id'
    from jsonb_array_elements(p_saved->'rows') with ordinality s(v, i)
    join jsonb_array_elements(p_target->'rows') with ordinality t(v, i) using (i)
    where s.v->>'table' = 'payment'
      and s.v->'data'->>'reference_id' is distinct from t.v->'data'->>'reference_id';
end;
$$;

-- 3. Read-only checks shared by preview and apply. Raises on anything unexpected.
create function demo_population.check_rekey(p_run uuid, p_saved jsonb, p_target jsonb, p_tables jsonb) returns void
language plpgsql set search_path = '' as $$
declare r record; v_row jsonb; v_match text; v_old text[];
begin
  perform demo_population.require_operator();
  select coalesce(array_agg(old_reference), '{}') into v_old from demo_population.rekey_pairs(p_saved, p_target);

  -- Every pair must be a tracked payment going from DEMO- to the new shape.
  for r in select * from demo_population.rekey_pairs(p_saved, p_target) loop
    if r.old_reference not like 'DEMO-%' or r.new_reference !~ '^APT-[A-Z0-9]{8}$' then
      raise exception 'Only legacy DEMO- references can be re-keyed to the APT- format.' using errcode = 'AP007';
    end if;
    if not exists (select 1 from demo_population.changes c
      where c.run_id = p_run and c.table_name = 'payment' and c.row_id = r.row_id and c.after_row->>'reference_id' = r.old_reference) then
      raise exception 'A re-keyed payment is not tracked with its recorded reference.' using errcode = 'AP007';
    end if;
  end loop;
  if (select count(distinct new_reference) from demo_population.rekey_pairs(p_saved, p_target))
     <> (select count(*) from demo_population.rekey_pairs(p_saved, p_target)) then
    raise exception 'Re-keyed references are not unique.' using errcode = 'AP007';
  end if;
  -- The saved plan's payments are exactly the tracked payments, with unique final references.
  if (select count(*) from jsonb_array_elements(p_target->'rows') x where x->>'table' = 'payment')
     <> (select count(*) from demo_population.changes c where c.run_id = p_run and c.table_name = 'payment')
     or (select count(distinct x->'data'->>'reference_id') from jsonb_array_elements(p_target->'rows') x where x->>'table' = 'payment')
     <> (select count(*) from jsonb_array_elements(p_target->'rows') x where x->>'table' = 'payment') then
    raise exception 'The saved plan and the tracked payments do not match.' using errcode = 'AP007';
  end if;

  -- Tracked payments must still be exactly as recorded: edited work is preserved, not guessed at.
  for r in select * from demo_population.changes where run_id = p_run and table_name = 'payment' loop
    select to_jsonb(t) into v_row from public.payment t where t.id = r.row_id;
    if v_row is distinct from r.after_row then
      raise exception 'Tracked demo payments were changed or removed. Re-key refused.' using errcode = 'AP005';
    end if;
  end loop;

  -- A new reference may not already belong to a different payment.
  if exists (
    select 1 from demo_population.rekey_pairs(p_saved, p_target) k
    join public.payment p on p.reference_id = k.new_reference and p.id <> k.row_id
  ) then raise exception 'A new reference is already used by another payment.' using errcode = '23505'; end if;

  -- No other row (any table, tracked or not) may mention an old reference.
  if cardinality(v_old) > 0 then
    for r in select key, value from jsonb_each(p_tables) loop
      for v_row in select value from jsonb_array_elements(r.value) loop
        if r.key = 'payment' and exists (select 1 from demo_population.rekey_pairs(p_saved, p_target) k where k.row_id::text = v_row->>'id') then continue; end if;
        for v_match in select m[1] from regexp_matches(v_row::text, '(DEMO-[0-9a-fA-F-]+)', 'g') m loop
          if v_match = any(v_old) then
            raise exception 'Other records mention a reference being re-keyed. Re-key refused.' using errcode = 'AP006';
          end if;
        end loop;
      end loop;
    end loop;
  end if;
end;
$$;

-- 4. The operation. p_preview = true never writes; the CLI also wraps it in BEGIN READ ONLY.
create function demo_population.execute_rekey(p_mode text, p_plan jsonb, p_expected_state text, p_run uuid, p_preview boolean default true) returns jsonb
language plpgsql set search_path = '' as $$
declare v_inventory jsonb; v_saved demo_population.runs%rowtype; v_count integer; v_updated integer; r record; v_row jsonb; v_after jsonb;
begin
  perform demo_population.require_operator();
  if p_mode is distinct from 'rekey' or p_preview is null then raise exception 'Unknown re-key mode.'; end if;
  if not p_preview then perform demo_population.lock_database(); end if;
  v_inventory := demo_population.inventory();
  if v_inventory->>'stateHash' is distinct from p_expected_state then
    raise exception 'Database changed since preview. Generate and review a fresh preview.' using errcode = 'AP004';
  end if;
  select * into v_saved from demo_population.runs;
  if v_saved.id is null or v_saved.id <> p_run then raise exception 'Run ID does not match the recorded baseline.' using errcode = 'AP007'; end if;
  if v_saved.status <> 'applied' then raise exception 'Only an applied run can be re-keyed.' using errcode = 'AP007'; end if;

  select count(*) into v_count from demo_population.rekey_pairs(v_saved.plan, p_plan);
  perform demo_population.check_rekey(p_run, v_saved.plan, p_plan, v_inventory->'tables');
  if p_preview or v_count = 0 then
    return jsonb_build_object('mode', 'rekey', 'preview', p_preview, 'run', p_run, 'status', v_saved.status, 'rekeyed', v_count);
  end if;

  perform set_config('app.suppress_push_delivery', 'true', true);
  for r in select * from demo_population.rekey_pairs(v_saved.plan, p_plan) loop
    update public.payment set reference_id = r.new_reference where id = r.row_id and reference_id = r.old_reference;
    get diagnostics v_updated = row_count;
    if v_updated <> 1 then raise exception 'A payment could not be re-keyed.' using errcode = 'AP005'; end if;
    update demo_population.changes
      set after_row = jsonb_set(after_row, '{reference_id}', to_jsonb(r.new_reference))
      where run_id = p_run and table_name = 'payment' and row_id = r.row_id;
  end loop;
  update demo_population.runs set plan = p_plan, updated_at = now() where id = p_run;

  -- Prove the result: each tracked payment equals its updated after-image and the saved plan matches.
  for r in select * from demo_population.changes where run_id = p_run and table_name = 'payment' loop
    select to_jsonb(t) into v_row from public.payment t where t.id = r.row_id;
    if v_row is distinct from r.after_row then raise exception 'Re-key verification failed.' using errcode = 'AP005'; end if;
  end loop;
  select plan into v_after from demo_population.runs where id = p_run;
  if v_after is distinct from p_plan then raise exception 'Re-key verification failed.' using errcode = 'AP005'; end if;
  return jsonb_build_object('mode', 'rekey', 'run', p_run, 'status', 'applied', 'rekeyed', v_count);
end;
$$;

revoke all on all functions in schema demo_population from public, anon, authenticated, service_role;
