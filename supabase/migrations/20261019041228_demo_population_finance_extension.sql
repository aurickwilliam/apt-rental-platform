-- Additive operator-only finance component. Never replace/rebaseline an existing
-- rental plan or its change records, even when the rental run has been used.
create table demo_population.finance_runs (
  run_id uuid primary key references demo_population.runs(id),
  plan jsonb not null,
  status text not null check (status in ('applied','cleaned')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table demo_population.finance_changes (
  run_id uuid not null references demo_population.finance_runs(run_id),
  table_name text not null check (table_name in ('landlord_expenses','landlord_budgets')),
  row_id uuid not null,
  after_row jsonb not null,
  primary key (run_id,table_name,row_id)
);
alter table demo_population.finance_runs enable row level security;
alter table demo_population.finance_changes enable row level security;
revoke all on demo_population.finance_runs, demo_population.finance_changes from public, anon, authenticated, service_role;

-- Reviewed guard from the schema contract: validates dates and invalidates both
-- old/new property-month reviews. Do not auto-accept a changed function body.
insert into demo_population.audited_functions values
  ('public.guard_landlord_finance_expense','c4da65127c0e25e41487393593aa9137');
alter function demo_population.audit() rename to rental_audit;
create function demo_population.audit() returns void
language plpgsql set search_path = '' as $$
begin
  perform demo_population.rental_audit();
  if exists (
    select 1 from pg_catalog.pg_trigger t
    join pg_catalog.pg_class c on c.oid=t.tgrelid
    join pg_catalog.pg_namespace n on n.oid=c.relnamespace
    join pg_catalog.pg_proc p on p.oid=t.tgfoid
    join pg_catalog.pg_namespace pn on pn.oid=p.pronamespace
    left join demo_population.audited_functions a on a.name=pn.nspname||'.'||p.proname
    where n.nspname='public' and not t.tgisinternal
      and c.relname in ('landlord_expenses','landlord_budgets','landlord_finance_reviews')
      and (a.hash is null or a.hash<>md5(pg_catalog.pg_get_functiondef(p.oid)) or t.tgenabled<>'O')
  ) or not exists (
    select 1 from pg_catalog.pg_trigger t
    where t.tgrelid='public.landlord_expenses'::regclass and t.tgname='guard_landlord_finance_expense'
      and t.tgfoid='public.guard_landlord_finance_expense()'::regprocedure and t.tgenabled='O'
  ) or exists (
    select 1 from pg_catalog.pg_constraint fk
    join pg_catalog.pg_class target on target.oid=fk.confrelid
    join pg_catalog.pg_namespace tn on tn.oid=target.relnamespace
    join pg_catalog.pg_class source on source.oid=fk.conrelid
    join pg_catalog.pg_namespace sn on sn.oid=source.relnamespace
    where fk.contype='f' and tn.nspname='public' and sn.nspname<>'public'
      and target.relname in ('landlord_expenses','landlord_budgets','landlord_finance_reviews')
  ) then raise exception 'Unreviewed finance triggers or dependencies.' using errcode='AP002'; end if;
end $$;

-- Include the independent private registry in every preview fingerprint.
alter function demo_population.inventory() rename to rental_inventory;
create function demo_population.inventory() returns jsonb
language plpgsql set search_path = '' as $$
declare v_base jsonb; v_finance jsonb; v_changes jsonb;
begin
  v_base := demo_population.rental_inventory();
  select to_jsonb(r) into v_finance from demo_population.finance_runs r;
  select coalesce(jsonb_agg(to_jsonb(c) order by table_name,row_id),'[]'::jsonb)
    into v_changes from demo_population.finance_changes c;
  return v_base || jsonb_build_object('financeRun',v_finance,
    'stateHash',md5(jsonb_build_array(v_base->>'stateHash',v_finance,v_changes)::text));
end $$;

create function demo_population.finance_check_unchanged(p_run uuid) returns void
language plpgsql set search_path = '' as $$
declare r record; v_row jsonb; v_plan jsonb;
begin
  perform demo_population.require_operator();
  select plan into strict v_plan from demo_population.finance_runs where run_id=p_run and status='applied';
  if (select count(*) from demo_population.finance_changes where run_id=p_run) <> jsonb_array_length(v_plan->'rows') then
    raise exception 'Finance tracking is incomplete.' using errcode='AP005';
  end if;
  for r in select * from demo_population.finance_changes where run_id=p_run loop
    execute format('select to_jsonb(t) from public.%I t where id=$1',r.table_name) into v_row using r.row_id;
    if v_row is distinct from r.after_row then
      raise exception 'Tracked finance data changed or was removed.' using errcode='AP005';
    end if;
  end loop;
end $$;

create function demo_population.finance_dependencies(p_run uuid, p_tables jsonb, p_storage jsonb) returns void
language plpgsql set search_path = '' as $$
declare r record; v_row jsonb;
begin
  perform demo_population.require_operator();
  -- Expense deletion would delete these confirmations through the normal guard.
  if exists (
    select 1 from demo_population.finance_changes c
    join public.landlord_finance_reviews review on review.landlord_id=(c.after_row->>'landlord_id')::uuid
      and review.apartment_id=(c.after_row->>'apartment_id')::uuid
      and review.month=date_trunc('month',(c.after_row->>'spent_on')::date)::date
    where c.run_id=p_run and c.table_name='landlord_expenses'
  ) then raise exception 'New expense review must be preserved.' using errcode='AP009'; end if;
  for r in select key,value from jsonb_each(p_tables) loop
    for v_row in select value from jsonb_array_elements(r.value) loop
      if exists (select 1 from demo_population.finance_changes c where c.run_id=p_run and c.table_name=r.key and c.row_id::text=v_row->>'id') then continue; end if;
      if exists (
        select 1 from regexp_matches(v_row::text,'[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}','g') m
        join demo_population.finance_changes c on c.row_id::text=m[1] and c.run_id=p_run
      ) then raise exception 'New activity depends on generated finances.' using errcode='AP006'; end if;
    end loop;
  end loop;
  if exists (
    select 1 from jsonb_array_elements(p_storage) o,
      lateral regexp_matches(o->>'name','[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}','g') m
      join demo_population.finance_changes c on c.row_id::text=m[1] and c.run_id=p_run
  ) then raise exception 'Stored files depend on generated finances.' using errcode='AP006'; end if;
end $$;

create function demo_population.finance_validate_plan(p_run uuid,p_plan jsonb,p_parent jsonb default null) returns void
language plpgsql set search_path = '' as $$
declare v_parent jsonb; r jsonb; d jsonb; v_month date; v_asof date; v_goal numeric;
begin
  perform demo_population.require_operator();
  if p_parent is null then
    select plan into strict v_parent from demo_population.runs where id=p_run and status='applied';
  else v_parent := p_parent;
  end if;
  if p_plan->>'component' is distinct from 'finance' or p_plan->>'version' is distinct from '1'
    or jsonb_typeof(p_plan->'rows') is distinct from 'array'
    or p_plan->>'seed' is distinct from v_parent->>'seed'
    or p_plan->>'years' is distinct from v_parent->>'years'
    or p_plan->>'asOf' is distinct from v_parent->>'asOf'
  then raise exception 'Finance plan must use the saved rental options.' using errcode='AP007'; end if;
  if jsonb_array_length(p_plan->'rows')+jsonb_array_length(v_parent->'rows')>5000 then raise exception 'Combined plan exceeds the 5,000-row safety limit.'; end if;
  if (select count(distinct value->'data'->>'id') from jsonb_array_elements(p_plan->'rows'))<>jsonb_array_length(p_plan->'rows') then raise exception 'Duplicate or missing finance IDs.'; end if;
  if exists (select 1 from jsonb_array_elements(p_plan->'rows') q where q.value->>'table'='landlord_budgets'
    group by q.value->'data'->>'landlord_id',q.value->'data'->>'apartment_id',q.value->'data'->>'month',q.value->'data'->>'category',q.value->'data'->>'kind' having count(*)>1)
  then raise exception 'Duplicate finance budget keys.'; end if;
  v_asof := (p_plan->>'asOf')::date;
  if v_asof>(current_timestamp at time zone 'Asia/Manila')::date then raise exception 'Finance date is in the future.'; end if;
  for r in select value from jsonb_array_elements(p_plan->'rows') loop
    d := r->'data';
    if r->>'table' not in ('landlord_expenses','landlord_budgets') or r->>'table' is null
      or jsonb_typeof(d) is distinct from 'object' then raise exception 'Unexpected finance table.'; end if;
    if not exists (
      select 1 from public.apartments a join public.users u on u.id=a.landlord_id
      where a.id=(d->>'apartment_id')::uuid and u.id=(d->>'landlord_id')::uuid
        and 'landlord'=any(u.roles) and not u.is_suspended
        and a.deleted_at is null and not a.is_hidden_by_admin and a.status in ('available','occupied') and a.monthly_rent>0
    ) then raise exception 'Finance owner/property eligibility changed.' using errcode='AP008'; end if;
    if r->>'table'='landlord_expenses' then
      if exists (select 1 from jsonb_object_keys(d) k where k not in ('id','landlord_id','apartment_id','category','treatment','amount','spent_on','description','created_at')) then raise exception 'Unexpected expense columns.'; end if;
      v_month := date_trunc('month',(d->>'spent_on')::date)::date;
      if (d->>'spent_on')::date>v_asof or (d->>'spent_on')::date<date '2000-01-01'
        or (d->>'amount')::numeric<=0 or (d->>'amount')::numeric>999999999.99
        or round((d->>'amount')::numeric,2)<>(d->>'amount')::numeric
        or d->>'description' not like 'Demo scenario:%'
        or (d->>'created_at')::timestamptz is distinct from ((d->>'spent_on')||' 10:00:00+08:00')::timestamptz
      then raise exception 'Invalid demo expense.'; end if;
      if exists (select 1 from public.landlord_finance_reviews f where f.landlord_id=(d->>'landlord_id')::uuid and f.apartment_id=(d->>'apartment_id')::uuid and f.month=v_month)
        or exists (select 1 from public.landlord_expenses e where e.landlord_id=(d->>'landlord_id')::uuid and e.apartment_id=(d->>'apartment_id')::uuid and date_trunc('month',e.spent_on)::date=v_month
          and not exists (select 1 from demo_population.finance_changes c where c.run_id=p_run and c.table_name='landlord_expenses' and c.row_id=e.id))
      then raise exception 'Existing expense month must be preserved.' using errcode='AP009'; end if;
    else
      if exists (select 1 from jsonb_object_keys(d) k where k not in ('id','landlord_id','apartment_id','month','category','kind','amount','target_amount','months_remaining')) then raise exception 'Unexpected budget columns.'; end if;
      v_month := (d->>'month')::date;
      if extract(day from v_month)<>1 or (d->>'amount')::numeric<0 or (d->>'amount')::numeric>999999999.99 or round((d->>'amount')::numeric,2)<>(d->>'amount')::numeric then raise exception 'Invalid demo budget.'; end if;
      if exists (select 1 from public.landlord_budgets b where b.landlord_id=(d->>'landlord_id')::uuid and b.apartment_id=(d->>'apartment_id')::uuid and b.month=v_month and b.category=d->>'category' and b.kind=d->>'kind'
        and not exists (select 1 from demo_population.finance_changes c where c.run_id=p_run and c.table_name='landlord_budgets' and c.row_id=b.id)) then
        raise exception 'An existing budget must be preserved.' using errcode='AP009';
      end if;
      if d->>'kind'='reserve' and d->>'target_amount' is not null then
        v_goal := ceil((d->>'target_amount')::numeric/(d->>'months_remaining')::integer*100)/100;
        if v_goal is distinct from (d->>'amount')::numeric then raise exception 'Invalid reserve allocation.'; end if;
      end if;
    end if;
    if v_month is null or v_month<date_trunc('month',v_asof)::date-interval '5 months' or v_month>date_trunc('month',v_asof)::date then raise exception 'Finance month outside the frozen window.'; end if;
  end loop;
end $$;

-- Finance recording intentionally has no apartment-patch logic. Compare EVERY
-- existing public row, including tables without IDs, before accepting inserts.
create function demo_population.finance_record(p_run uuid,p_before jsonb,p_after jsonb,p_plan jsonb) returns void
language plpgsql set search_path = '' as $$
declare r record; v_remaining jsonb; v_row jsonb;
begin
  perform demo_population.require_operator();
  for r in select key,value from jsonb_each(p_after) loop
    select coalesce(jsonb_agg(e.value order by e.value::text),'[]'::jsonb) into v_remaining
      from jsonb_array_elements(r.value) e where not exists (
        select 1 from jsonb_array_elements(p_plan->'rows') p
        where p.value->>'table'=r.key and p.value->'data'->>'id'=e.value->>'id');
    if v_remaining is distinct from p_before->r.key then raise exception 'Finance operation changed existing public data.' using errcode='AP009'; end if;
  end loop;
  for r in select value->>'table' as table_name,value->'data'->>'id' as id from jsonb_array_elements(p_plan->'rows') loop
    execute format('select to_jsonb(t) from public.%I t where id=$1',r.table_name) into v_row using r.id::uuid;
    if v_row is null then raise exception 'Finance insertion missing.'; end if;
    insert into demo_population.finance_changes values(p_run,r.table_name,r.id::uuid,v_row);
  end loop;
end $$;

create function demo_population.execute_finance(p_mode text,p_plan jsonb,p_expected_state text,p_run uuid,p_preview boolean default true) returns jsonb
language plpgsql set search_path = '' as $$
declare v_inventory jsonb; v_saved demo_population.finance_runs%rowtype; v_before jsonb; v_after jsonb; r record; d jsonb;
begin
  perform demo_population.require_operator();
  if p_mode not in ('apply','reset','cleanup','verify') or p_mode is null then raise exception 'Unknown finance mode.'; end if;
  if p_preview is null then raise exception 'Preview mode must be explicit.'; end if;
  if not p_preview then
    perform demo_population.lock_database();
    lock table demo_population.finance_runs,demo_population.finance_changes in share row exclusive mode;
  end if;
  v_inventory := demo_population.inventory();
  if v_inventory->>'stateHash' is distinct from p_expected_state then raise exception 'Database changed since preview.' using errcode='AP004'; end if;
  if not exists (select 1 from demo_population.runs where id=p_run and status='applied') then raise exception 'An applied parent rental run is required.' using errcode='AP007'; end if;
  select * into v_saved from demo_population.finance_runs where run_id=p_run;
  if v_saved.run_id is not null and v_saved.plan is distinct from p_plan then raise exception 'Use the saved finance plan.' using errcode='AP007'; end if;
  if v_saved.status='applied' then
    perform demo_population.finance_check_unchanged(p_run);
    if p_mode in ('cleanup','reset') then perform demo_population.finance_dependencies(p_run,v_inventory->'tables',v_inventory->'storage'); end if;
    if p_mode='reset' then perform demo_population.finance_validate_plan(p_run,p_plan); end if;
  elsif p_mode<>'apply' then raise exception 'No applied finance extension.' using errcode='AP007';
  end if;
  if v_saved.status is distinct from 'applied' then perform demo_population.finance_validate_plan(p_run,p_plan); end if;
  if p_preview or p_mode='verify' or (p_mode='apply' and v_saved.status='applied') then
    return jsonb_build_object('mode',p_mode,'component','finance','preview',p_preview,'run',p_run,'status',coalesce(v_saved.status,'not_applied'),'summary',p_plan->'summary');
  end if;
  perform set_config('app.suppress_push_delivery','true',true);
  if p_mode in ('cleanup','reset') then
    v_before := demo_population.snapshot();
    for r in select * from demo_population.finance_changes where run_id=p_run order by table_name,row_id loop
      execute format('delete from public.%I where id=$1',r.table_name) using r.row_id;
    end loop;
    v_after := demo_population.snapshot();
    -- Removing the tracked IDs must be the ONLY public effect of cleanup.
    for r in select key,value from jsonb_each(v_before) loop
      if (select coalesce(jsonb_agg(value order by value::text),'[]'::jsonb) from jsonb_array_elements(r.value)
        where not exists (select 1 from demo_population.finance_changes c where c.run_id=p_run and c.table_name=r.key and c.row_id::text=value->>'id')) is distinct from v_after->r.key
      then raise exception 'Finance cleanup changed existing work.' using errcode='AP009'; end if;
    end loop;
    update demo_population.finance_runs set status='cleaned',updated_at=now() where run_id=p_run;
    if p_mode='cleanup' then return jsonb_build_object('mode',p_mode,'component','finance','run',p_run,'status','cleaned','summary',p_plan->'summary'); end if;
  end if;
  perform demo_population.finance_validate_plan(p_run,p_plan);
  v_before := demo_population.snapshot();
  delete from demo_population.finance_changes where run_id=p_run;
  insert into demo_population.finance_runs(run_id,plan,status) values(p_run,p_plan,'applied')
    on conflict(run_id) do update set status='applied',updated_at=now();
  for r in select value->>'table' as table_name,value->'data' as data from jsonb_array_elements(p_plan->'rows') loop
    d := r.data;
    if r.table_name='landlord_expenses' then
      insert into public.landlord_expenses(id,landlord_id,apartment_id,category,treatment,amount,spent_on,description,created_at)
      select id,landlord_id,apartment_id,category,treatment,amount,spent_on,description,created_at from jsonb_populate_record(null::public.landlord_expenses,d);
    else
      insert into public.landlord_budgets(id,landlord_id,apartment_id,month,category,kind,amount,target_amount,months_remaining)
      select id,landlord_id,apartment_id,month,category,kind,amount,target_amount,months_remaining from jsonb_populate_record(null::public.landlord_budgets,d);
    end if;
  end loop;
  perform demo_population.finance_record(p_run,v_before,demo_population.snapshot(),p_plan);
  perform demo_population.finance_check_unchanged(p_run);
  return jsonb_build_object('mode',p_mode,'component','finance','run',p_run,'status','applied','summary',p_plan->'summary');
end $$;

-- Keep the original rental lifecycle and all its safety checks. Fresh plans can
-- contain a finance component; legacy saved plans are never rewritten. Full
-- reset/cleanup handle finance first, atomically, after previewing BOTH scopes.
-- A landlord-only fixture may have no rental journeys. Permit that only when
-- backed by a nonempty finance component; legacy empty plans remain rejected.
do $migration$
declare v_definition text; v_old text := 'or jsonb_array_length(p_plan->''rows'') = 0';
begin
  v_definition := pg_get_functiondef('demo_population.insert_plan(uuid,jsonb)'::regprocedure);
  if strpos(v_definition,v_old)=0 then raise exception 'Review changed rental plan validator before extending it.'; end if;
  execute replace(v_definition,v_old,'or (jsonb_array_length(p_plan->''rows'') = 0 and coalesce(jsonb_array_length(p_plan->''finance''->''rows''),0) = 0)');
end $migration$;
alter function demo_population.execute(text,jsonb,text,uuid,boolean) rename to execute_rentals;
create function demo_population.execute(p_mode text,p_plan jsonb,p_expected_state text,p_run uuid,p_preview boolean default true) returns jsonb
language plpgsql set search_path = '' as $$
declare v_inventory jsonb; v_finance jsonb; v_status text; v_result jsonb; v_finance_result jsonb;
begin
  perform demo_population.require_operator();
  if p_mode not in ('apply','reset','cleanup','verify') or p_mode is null or p_preview is null then raise exception 'Invalid population mode.'; end if;
  if not p_preview then
    perform demo_population.lock_database();
    lock table demo_population.finance_runs,demo_population.finance_changes in share row exclusive mode;
  end if;
  v_inventory := demo_population.inventory();
  if v_inventory->>'stateHash' is distinct from p_expected_state then raise exception 'Database changed since preview.' using errcode='AP004'; end if;
  select plan,status into v_finance,v_status from demo_population.finance_runs where run_id=p_run;
  v_finance := coalesce(v_finance,p_plan->'finance');
  -- This still refuses rental drift. Finance-only operations use their own
  -- entry point, never a bypass flag on rental validation.
  v_result := demo_population.execute_rentals(p_mode,p_plan,p_expected_state,p_run,true);
  if v_finance is not null and v_status is distinct from 'applied' and p_mode in ('apply','reset') then
    perform demo_population.finance_validate_plan(p_run,v_finance,p_plan);
  end if;
  if v_status='applied' then
    v_finance_result := demo_population.execute_finance(case when p_mode in ('reset','cleanup') then p_mode else 'verify' end,v_finance,p_expected_state,p_run,true);
  end if;
  if p_preview or p_mode='verify' then
    return v_result || jsonb_build_object('finance',coalesce(v_finance_result,jsonb_build_object('status','not_applied','summary',v_finance->'summary')));
  end if;
  if p_mode in ('reset','cleanup') and v_status='applied' then
    v_finance_result := demo_population.execute_finance('cleanup',v_finance,p_expected_state,p_run,false);
  end if;
  v_result := demo_population.execute_rentals(p_mode,p_plan,demo_population.inventory()->>'stateHash',p_run,false);
  if p_mode in ('apply','reset') and v_finance is not null then
    v_finance_result := demo_population.execute_finance('apply',v_finance,demo_population.inventory()->>'stateHash',p_run,false);
  end if;
  return v_result || jsonb_build_object('finance',v_finance_result);
end $$;

revoke all on all functions in schema demo_population from public, anon, authenticated, service_role;
