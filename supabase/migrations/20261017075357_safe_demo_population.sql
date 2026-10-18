-- Operator tooling only. This schema must NEVER be added to exposed_schemas.
-- No fixture data, identities or listings are created by this migration.
create schema demo_population;
revoke all on schema demo_population from public, anon, authenticated, service_role;
alter default privileges in schema demo_population revoke execute on functions from public;

create table demo_population.runs (
  id uuid primary key,
  singleton boolean not null default true unique check (singleton),
  plan jsonb not null,
  baseline_ids jsonb not null default '{}'::jsonb,
  status text not null check (status in ('applied', 'cleaned')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table demo_population.changes (
  run_id uuid not null references demo_population.runs(id),
  table_name text not null,
  row_id uuid not null,
  before_row jsonb,
  after_row jsonb not null,
  primary key (run_id, table_name, row_id)
);
-- A fail-closed audit of the trigger functions reviewed for this importer.
-- Updating application triggers requires reviewing and updating these hashes.
create table demo_population.audited_functions (name text primary key, hash text not null);
insert into demo_population.audited_functions values
('public.cancel_other_applications_on_approval','a2afc3aab7b46039f89b00a6cef3de91'),
('public.cancel_pending_applications_on_apartment_soft_delete','5f1a12ad3adfa1059a1c42d2bdc00259'),
('public.cancel_visit_requests_on_application_approved','4d86de37d9900be6f9ad3b0a6ef22dbf'),
('public.close_other_applications_on_approval','d04ecec3c572d4a57aed493e3e22b094'),
('public.create_notification','eb584140bdec7dbef4bfed77c8292962'),
('public.enforce_review_stay_eligibility','9400e351c7908dd071806ea284b322a1'),
('public.enforce_visit_request_role_permissions','2c5dcf3d2304fb092728ba479991a38c'),
('public.guard_apartment_chat_participants','61c15704896c84e626fbcad7b5ab1158'),
('public.guard_apartment_moderation_fields','0787118b63a095c0c8792f2c7b6d8bda'),
('public.guard_apartment_pricing','4ce187786cc92ee839d64f6e504a0d95'),
('public.guard_apartment_status_update','c1e2446f37b43ec23e4b7cfa509f5803'),
('public.guard_camanava_apartment_location','fd8b335522716dcebffe7702047c77fd'),
('public.guard_cash_payment_insert','8ee15bbbc8cd763597507df3cb295386'),
('public.guard_cash_payment_status_transition','1d36c6988b2984ef2b38303d37522fdd'),
('public.guard_chat_blocks','e77848a3162da5e7c6e512a136445743'),
('public.guard_new_apartment_listing','ffdae7d4409ba137783fea5ee9e02a16'),
('public.guard_rental_application_insert','33658c06cd7749ed82b0c16b94fc38e3'),
('public.guard_rental_application_update','4da7a962a4ef8588c835ec96f8b7aa1e'),
('public.guard_tenancy_signed_lease_fields','39d771f73c0551ec6ac5744fb3b701bb'),
('public.handle_application_approved','81c90f2e8aa01079800331c792b0b0db'),
('public.notify_application_status','bf6a878fdebb53e6429649a03ce310d3'),
('public.notify_application_submitted','9e460c108540c8dd47df332c8a3ba088'),
('public.notify_chat_message','917a83557b3c1ca1999de1287f5fc857'),
('public.notify_maintenance_request','40bf98379382deea1fae87c31357d5f9'),
('public.notify_payment_created','56d54533834a4300d96ff4b043f4890f'),
('public.notify_visit_request','d31e1bddd5f631d19ee307614059626f'),
('public.prevent_self_apartment_transaction','e20065dc98c0ee6f80ab50200c8960bf'),
('public.prevent_self_apartment_transfer','b82ad3ba1498c33021aac849871ce062'),
('public.require_tenant_membership_for_new_transaction','b9719fbedd9f5280f8c8d94493924eef'),
('public.set_updated_at','884bbfb7462544779bacbcd105beb30f'),
('public.sync_apartment_availability_on_tenancy_end','230ac4c2806545bf5fa848a8dc5af216'),
('public.sync_apartment_favorites_count','5d4629c21a4d46cdc04c56f17f9b1f8e'),
('public.sync_review_tenancy_fields','cf4dd503ac047efde426155967979d1e'),
('public.unarchive_conversation_on_message','03f1a146b481c592fde262eff3a056d2'),
('public.update_apartment_rating','c948fdaa60df6f0e4e358fdc5fe84468');

alter table demo_population.runs enable row level security;
alter table demo_population.changes enable row level security;
alter table demo_population.audited_functions enable row level security;
revoke all on all tables in schema demo_population from public, anon, authenticated, service_role;

-- Keep the normal deletion webhook unchanged, except for tracked operator
-- cleanup. Reused Passport/verification objects must NEVER be deleted.
create or replace function public.notify_delete_application_documents()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if session_user = 'postgres'
    and current_setting('app.demo_population_cleanup', true) = 'true'
    and exists (select 1 from demo_population.changes c
      where c.table_name = 'rental_application' and c.row_id = old.id and c.before_row is null
        and c.run_id::text = current_setting('app.demo_population_run', true)) then
    return old;
  end if;
  perform net.http_post(
    url := 'https://ezxirkpgfpripjydcqnt.supabase.co/functions/v1/delete-application-documents',
    headers := jsonb_build_object('Content-Type', 'application/json'),
    body := jsonb_build_object('record', row_to_json(old))
  );
  return old;
end;
$$;
revoke all on function public.notify_delete_application_documents() from public, anon, authenticated;
insert into demo_population.audited_functions
select 'public.notify_delete_application_documents', md5(pg_get_functiondef('public.notify_delete_application_documents()'::regprocedure));

create function demo_population.require_operator() returns void
language plpgsql set search_path = '' as $$
begin
  if session_user <> 'postgres' or current_user <> 'postgres' or auth.uid() is not null then
    raise exception 'A direct postgres operator session without a JWT is required.' using errcode = 'AP001';
  end if;
end;
$$;

create function demo_population.audit() returns void
language plpgsql set search_path = '' as $$
begin
  perform demo_population.require_operator();
  if exists (
    select 1 from pg_catalog.pg_trigger t
    join pg_catalog.pg_class c on c.oid = t.tgrelid
    join pg_catalog.pg_namespace cn on cn.oid = c.relnamespace
    join pg_catalog.pg_proc p on p.oid = t.tgfoid
    join pg_catalog.pg_namespace pn on pn.oid = p.pronamespace
    left join demo_population.audited_functions a on a.name = pn.nspname || '.' || p.proname
    where cn.nspname = 'public' and not t.tgisinternal
      and c.relname in ('apartments','tenancies','rental_application','visit_request','payment','maintenance_request','favorites','reviews','chat','notifications')
      and (a.hash is null or a.hash <> md5(pg_catalog.pg_get_functiondef(p.oid)) or t.tgenabled <> 'O')
  ) or not exists (
    select 1 from demo_population.audited_functions a
    where a.name = 'public.create_notification'
      and a.hash = md5(pg_catalog.pg_get_functiondef('public.create_notification(uuid,text,text,text,jsonb)'::regprocedure))
  ) then
    raise exception 'Unreviewed, changed or disabled triggers: review the population safety audit before proceeding.' using errcode = 'AP002';
  end if;
  if exists (
    select 1 from pg_catalog.pg_constraint fk
    join pg_catalog.pg_class target on target.oid = fk.confrelid
    join pg_catalog.pg_namespace tn on tn.oid = target.relnamespace
    join pg_catalog.pg_class source on source.oid = fk.conrelid
    join pg_catalog.pg_namespace sn on sn.oid = source.relnamespace
    where fk.contype = 'f' and tn.nspname = 'public' and sn.nspname <> 'public'
      and target.relname in ('tenancies','rental_application','visit_request','payment','maintenance_request','favorites','reviews','chat','notifications')
  ) then
    raise exception 'Unreviewed cross-schema dependencies: extend the population locking/snapshot audit first.' using errcode = 'AP002';
  end if;
end;
$$;

-- Snapshot ALL public tables, not just those we write. Unexpected trigger
-- changes, soft dependencies and future FK tables are therefore visible.
create function demo_population.snapshot() returns jsonb
language plpgsql set search_path = '' as $$
declare r record; v_rows jsonb; v_result jsonb := '{}'::jsonb; v_count bigint; v_total bigint := 0;
begin
  perform demo_population.require_operator();
  for r in select tablename from pg_catalog.pg_tables where schemaname = 'public' order by tablename loop
    execute format('select count(*) from public.%I', r.tablename) into v_count;
    v_total := v_total + v_count;
    if v_total > 20000 then raise exception 'Database exceeds the 20,000-row demo safety limit.'; end if;
    execute format('select coalesce(jsonb_agg(j order by j::text), ''[]''::jsonb) from (select to_jsonb(t) j from public.%I t) q', r.tablename) into v_rows;
    v_result := v_result || jsonb_build_object(r.tablename, v_rows);
  end loop;
  return v_result;
end;
$$;

create function demo_population.inventory() returns jsonb
language plpgsql set search_path = '' as $$
declare v_tables jsonb; v_storage jsonb; v_schema text; v_run jsonb;
begin
  perform demo_population.audit();
  v_tables := demo_population.snapshot();
  if (select count(*) from storage.objects) > 20000 then raise exception 'Storage exceeds demo safety limit.'; end if;
  select coalesce(jsonb_agg(jsonb_build_object('bucket_id', bucket_id, 'name', name) order by bucket_id, name), '[]'::jsonb)
    into v_storage from storage.objects;
  -- Include trigger definitions, constraints and ALL app helper bodies. A
  -- schema/function change between preview and apply invalidates the preview.
  select md5(coalesce(string_agg(def, E'\n' order by def), '')) into v_schema from (
    select pg_catalog.pg_get_triggerdef(t.oid) def from pg_catalog.pg_trigger t where not t.tgisinternal
    union all select pg_catalog.pg_get_constraintdef(c.oid) from pg_catalog.pg_constraint c
    union all select c.oid::text || ':' || a.attname || ':' || pg_catalog.format_type(a.atttypid,a.atttypmod) || ':' || a.attnotnull::text || ':' || coalesce(pg_catalog.pg_get_expr(d.adbin,d.adrelid), '')
      from pg_catalog.pg_attribute a join pg_catalog.pg_class c on c.oid = a.attrelid
      join pg_catalog.pg_namespace n on n.oid = c.relnamespace
      left join pg_catalog.pg_attrdef d on d.adrelid = a.attrelid and d.adnum = a.attnum
      where n.nspname = 'public' and a.attnum > 0 and not a.attisdropped
    union all select pg_catalog.pg_get_functiondef(p.oid) from pg_catalog.pg_proc p
      join pg_catalog.pg_namespace n on n.oid = p.pronamespace
      where n.nspname in ('public','private','demo_population') and p.prokind = 'f'
  ) defs;
  select to_jsonb(r) into v_run from demo_population.runs r;
  return jsonb_build_object('tables', v_tables, 'storage', v_storage, 'run', v_run,
    'stateHash', md5(jsonb_build_object('tables', v_tables, 'storage', v_storage, 'schema', v_schema, 'run', v_run)::text));
end;
$$;

create function demo_population.lock_database() returns void
language plpgsql set search_path = '' as $$
declare r record;
begin
  perform demo_population.require_operator();
  if not pg_catalog.pg_try_advisory_xact_lock(17102026, 1) then raise exception 'Another population operation is running.' using errcode = 'AP003'; end if;
  -- Ordinary writes do not take the advisory lock. These short table locks
  -- also protect against application writes, cron and concurrent webhooks.
  for r in select tablename from pg_catalog.pg_tables where schemaname = 'public' order by tablename loop
    execute format('lock table public.%I in share row exclusive mode', r.tablename);
  end loop;
  lock table storage.objects in share mode;
  lock table demo_population.runs, demo_population.changes in share row exclusive mode;
end;
$$;

-- Row comparisons are deliberately strict: even reading a generated
-- notification changes it, so reset/cleanup must stop instead of guessing.
create function demo_population.check_unchanged(p_run uuid) returns void
language plpgsql set search_path = '' as $$
declare r record; v_row jsonb;
begin
  perform demo_population.require_operator();
  for r in select * from demo_population.changes where run_id = p_run loop
    execute format('select to_jsonb(t) from public.%I t where id = $1', r.table_name) into v_row using r.row_id;
    if v_row is distinct from r.after_row then
      raise exception 'Tracked demo data was changed or removed. Cleanup/reset refused.' using errcode = 'AP005';
    end if;
  end loop;
end;
$$;

create function demo_population.check_dependencies(p_run uuid, p_tables jsonb, p_storage jsonb) returns void
language plpgsql set search_path = '' as $$
declare r record; v_row jsonb; v_baseline jsonb;
begin
  perform demo_population.require_operator();
  select baseline_ids into v_baseline from demo_population.runs where id = p_run;
  -- Covers FK references AND UUIDs embedded in JSON notification payloads,
  -- replies, conversation keys and storage paths (not only declared FKs).
  for r in select key, value from jsonb_each(p_tables) loop
    for v_row in select value from jsonb_array_elements(r.value) loop
      if exists (select 1 from demo_population.changes c where c.run_id = p_run and c.table_name = r.key and c.row_id::text = v_row->>'id') then continue; end if;
      if exists (
        select 1 from regexp_matches(v_row::text, '[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}', 'g') m
        join demo_population.changes c on c.row_id::text = m[1] and c.run_id = p_run and c.before_row is null
      ) then raise exception 'Untracked activity depends on generated records. Cleanup/reset refused.' using errcode = 'AP006'; end if;
    end loop;
  end loop;
  if exists (
    select 1 from jsonb_array_elements(p_storage) o,
      lateral regexp_matches(o->>'name', '[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}', 'g') m
    join demo_population.changes c on c.row_id::text = m[1] and c.run_id = p_run and c.before_row is null
  ) then raise exception 'Stored files depend on generated records. Cleanup/reset refused.' using errcode = 'AP006'; end if;
  -- Chats/preferences have no tenancy FK. Preserve any new activity in a
  -- generated conversation rather than removing its original history.
  if exists (
    select 1 from demo_population.changes c
    join public.chat generated on generated.id = c.row_id
    join public.chat newer on newer.apartment_id is not distinct from generated.apartment_id
      and least(newer.sender_id, newer.receiver_id) = least(generated.sender_id, generated.receiver_id)
      and greatest(newer.sender_id, newer.receiver_id) = greatest(generated.sender_id, generated.receiver_id)
    where c.run_id = p_run and c.table_name = 'chat'
      and not exists (select 1 from demo_population.changes tracked where tracked.run_id = p_run and tracked.table_name = 'chat' and tracked.row_id = newer.id)
  ) or exists (
    select 1 from demo_population.changes c join public.chat generated on generated.id = c.row_id
    join public.conversation_preferences cp on cp.apartment_id is not distinct from generated.apartment_id
      and cp.user_id in (generated.sender_id, generated.receiver_id) and cp.other_user_id in (generated.sender_id, generated.receiver_id)
    where c.run_id = p_run and c.table_name = 'chat'
  ) or exists (
    select 1 from demo_population.changes c join public.tenancies newer on newer.apartment_id = c.row_id
    where c.run_id = p_run and c.table_name = 'apartments' and c.before_row->>'status' is distinct from c.after_row->>'status'
      and not exists (select 1 from demo_population.changes tracked where tracked.run_id = p_run and tracked.table_name = 'tenancies' and tracked.row_id = newer.id)
      and not exists (select 1 from jsonb_array_elements_text(v_baseline->'tenancies') baseline where baseline = newer.id::text)
  ) then raise exception 'New conversation or rental activity must be preserved. Cleanup/reset refused.' using errcode = 'AP006'; end if;
  -- These legacy activity tables do not carry a tenancy FK either. New work
  -- by the generated tenancy's tenant must not be stranded by cleanup.
  for r in select key, value from jsonb_each(p_tables) where key in ('maintenance_request','visit_request','rental_application') loop
    for v_row in select value from jsonb_array_elements(r.value) loop
      if exists (select 1 from demo_population.changes c where c.run_id = p_run and c.table_name = r.key and c.row_id::text = v_row->>'id')
        or exists (select 1 from jsonb_array_elements_text(v_baseline->r.key) baseline where baseline = v_row->>'id') then continue; end if;
      if exists (select 1 from demo_population.changes c join public.tenancies t on t.id = c.row_id
        where c.run_id = p_run and c.table_name = 'tenancies' and t.status = 'active'
          and t.tenant_id::text = v_row->>'tenant_id' and t.apartment_id::text = v_row->>'apartment_id') then
        raise exception 'New activity depends on a generated rental. Cleanup/reset refused.' using errcode = 'AP006';
      end if;
    end loop;
  end loop;
end;
$$;

create function demo_population.cleanup_rows(p_run uuid) returns void
language plpgsql set search_path = '' as $$
declare r record;
begin
  perform demo_population.require_operator();
  perform set_config('app.demo_population_cleanup', 'true', true);
  perform set_config('app.demo_population_run', p_run::text, true);
  for r in select * from demo_population.changes where run_id = p_run and before_row is null
    order by array_position(array['notifications','chat','reviews','favorites','maintenance_request','payment','visit_request','rental_application','tenancies'], table_name), row_id
  loop
    execute format('delete from public.%I where id = $1', r.table_name) using r.row_id;
  end loop;
  for r in select * from demo_population.changes where run_id = p_run and before_row is not null loop
    if r.table_name <> 'apartments' then raise exception 'Unexpected baseline patch.'; end if;
    -- Only the explicitly allowed fields; never names, pricing or ownership.
    update public.apartments set status = r.before_row->>'status',
      no_favorites = (r.before_row->>'no_favorites')::integer,
      no_ratings = (r.before_row->>'no_ratings')::integer,
      average_rating = (r.before_row->>'average_rating')::numeric,
      updated_at = (r.before_row->>'updated_at')::timestamptz
    where id = r.row_id;
  end loop;
  perform set_config('app.demo_population_cleanup', 'false', true);
end;
$$;

create function demo_population.record_changes(p_run uuid, p_before jsonb, p_after jsonb, p_plan jsonb) returns void
language plpgsql set search_path = '' as $$
declare r record; v_row jsonb; v_old jsonb;
begin
  for r in select key, value from jsonb_each(p_after) loop
    if r.key not in ('apartments','tenancies','rental_application','visit_request','payment','maintenance_request','favorites','reviews','chat','notifications') then
      if r.value is distinct from p_before->r.key then raise exception 'A protected table changed during population.'; end if;
      continue;
    end if;
    for v_old in select value from jsonb_array_elements(p_before->r.key) loop
      select value into v_row from jsonb_array_elements(r.value) where value->>'id' = v_old->>'id';
      if v_row is null then raise exception 'Population removed an existing row.'; end if;
      -- A legacy NULL counter can remain NULL on INSERT but become zero on
      -- DELETE. Track every touched apartment, even if insertion left it equal.
      if v_row <> v_old or (r.key = 'apartments' and exists (
        select 1 from jsonb_array_elements(p_plan->'rows') planned where planned->'data'->>'apartment_id' = v_old->>'id'
      )) then
        if r.key <> 'apartments' or (v_row - array['status','no_favorites','no_ratings','average_rating','updated_at']) <> (v_old - array['status','no_favorites','no_ratings','average_rating','updated_at']) then
          raise exception 'Population changed protected existing data.';
        end if;
        insert into demo_population.changes values(p_run, r.key, (v_row->>'id')::uuid, v_old, v_row);
      end if;
    end loop;
    for v_row in select value from jsonb_array_elements(r.value) loop
      if exists (select 1 from jsonb_array_elements(p_before->r.key) old where old->>'id' = v_row->>'id') then continue; end if;
      if r.key <> 'notifications' and not exists (select 1 from jsonb_array_elements(p_plan->'rows') planned where planned->>'table' = r.key and planned->'data'->>'id' = v_row->>'id') then
        raise exception 'Unexpected trigger-generated record.';
      end if;
      insert into demo_population.changes values(p_run, r.key, (v_row->>'id')::uuid, null, v_row);
    end loop;
  end loop;
end;
$$;

create function demo_population.insert_plan(p_run uuid, p_plan jsonb) returns void
language plpgsql set search_path = '' as $$
declare v_item jsonb; v_data jsonb; v_table text; v_columns text; v_notification record; v_before uuid[]; v_i integer; v_time timestamptz; v_document record; v_bucket text;
begin
  perform demo_population.require_operator();
  if p_plan->>'version' <> '1' or jsonb_array_length(p_plan->'rows') > 5000 or jsonb_array_length(p_plan->'rows') = 0 then raise exception 'Unsupported or empty population plan.'; end if;
  for v_item in select value from jsonb_array_elements(p_plan->'rows') loop
    v_table := v_item->>'table'; v_data := v_item->'data';
    if v_table not in ('tenancies','rental_application','visit_request','payment','maintenance_request','favorites','reviews','chat') then raise exception 'Unexpected population table.'; end if;
    if not exists (
      select 1 from public.apartments a join public.users owner on owner.id = a.landlord_id
      join public.users tenant on tenant.id = case when v_table = 'chat' then
        case when (v_data->>'sender_id')::uuid = a.landlord_id then (v_data->>'receiver_id')::uuid else (v_data->>'sender_id')::uuid end
        else (v_data->>'tenant_id')::uuid end
      where a.id = (v_data->>'apartment_id')::uuid and a.deleted_at is null and not a.is_hidden_by_admin
        and a.status in ('available','occupied') and 'landlord' = any(owner.roles) and not owner.is_suspended
        and 'tenant' = any(tenant.roles) and not tenant.is_suspended and tenant.id <> owner.id
        and (v_table not in ('tenancies','rental_application','payment','maintenance_request','reviews') or tenant.account_status = 'verified')
    ) then raise exception 'Plan eligibility changed or references invalid participants.' using errcode = 'AP008'; end if;
    if v_table = 'rental_application' then
      if private.application_document_problem((v_data->>'tenant_id')::uuid, v_data->>'gov_id_url', 'ID', true) is not null
        or private.application_document_problem((v_data->>'tenant_id')::uuid, v_data->>'proof_of_billing_url', 'Billing', false) is not null
        or private.application_document_problem((v_data->>'tenant_id')::uuid, v_data->>'proof_of_income_url', 'Income', false) is not null
        or private.application_document_problem((v_data->>'tenant_id')::uuid, v_data->>'nbi_clearance_url', 'NBI', false) is not null
        or v_data->>'gov_id_url' is null or v_data->>'proof_of_billing_url' is null then raise exception 'Application documents are no longer usable.'; end if;
      for v_document in select key, value from jsonb_each_text(v_data)
        where key in ('gov_id_url','gov_id_back_url','proof_of_billing_url','proof_of_income_url','nbi_clearance_url') and value is not null
      loop
        -- Same path-shape routing as @repo/passport isVerifiedIdPath. Never
        -- probe/fall back between buckets, including on a saved-plan reset.
        v_bucket := case when v_document.key in ('gov_id_url','gov_id_back_url') and v_document.value ~*
          '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/id-(front|back)\.(jpe?g|png|webp)$'
          then 'user-verification' else 'application-documents' end;
        if not exists (select 1 from storage.objects o where o.bucket_id = v_bucket and o.name = v_document.value) then
          raise exception 'An application document file is no longer present.' using errcode = 'AP008';
        end if;
      end loop;
      if v_data->>'gov_id_back_url' is not null and not (
        exists (select 1 from public.passport_documents pd where pd.user_id = (v_data->>'tenant_id')::uuid
          and pd.storage_path = v_data->>'gov_id_url' and pd.storage_path_back = v_data->>'gov_id_back_url'
          and pd.review_status <> 'rejected' and (pd.expires_at is null or pd.expires_at >= current_date))
        or exists (select 1 from public.user_verifications uv where uv.user_id = (v_data->>'tenant_id')::uuid
          and uv.status = 'approved' and uv.id_front_path = v_data->>'gov_id_url' and uv.id_back_path = v_data->>'gov_id_back_url')
      ) then raise exception 'The saved ID back is no longer paired with its front.' using errcode = 'AP008'; end if;
    end if;
    -- Explicit column list preserves defaults for absent fields. No upserts:
    -- collisions are errors, never permission to overwrite an existing row.
    select string_agg(format('%I', key), ',' order by key) into v_columns from jsonb_object_keys(v_data) key;
    select coalesce(array_agg(id), '{}'::uuid[]) into v_before from public.notifications;
    if v_table = 'payment' and v_data->>'method' = 'cash' then
      v_data := jsonb_set(v_data, '{status}', '"pending"');
    end if;
    execute format('insert into public.%1$I (%2$s) select %2$s from jsonb_populate_record(null::public.%1$I, $1)', v_table, v_columns) using v_data;
    if v_table = 'payment' and v_item->'data'->>'method' = 'cash' and v_item->'data'->>'status' = 'paid' then
      update public.payment set status = 'paid', updated_at = (v_item->'data'->>'updated_at')::timestamptz where id = (v_data->>'id')::uuid;
    end if;
    -- Keep trigger-created feed entries, but make their IDs and dates stable.
    -- Push suppression is checked by the audited create_notification helper.
    v_i := 0; v_time := (v_item->>'eventTime')::timestamptz;
    for v_notification in select * from public.notifications where not (id = any(v_before)) order by user_id, type, title, message, data::text, id loop
      update public.notifications set
        id = md5(p_run::text || v_table || (v_data->>'id') || ':' || v_i)::uuid,
        created_at = v_time, is_read = v_time < (p_plan->>'asOf')::date - interval '7 days',
        read_at = case when v_time < (p_plan->>'asOf')::date - interval '7 days' then v_time + interval '1 hour' else null end
      where id = v_notification.id;
      v_i := v_i + 1;
    end loop;
  end loop;
  -- Direct operator import of final approved applications deliberately avoids
  -- UPDATE-to-approved workflows (which cancel other users' existing work).
  update public.apartments a set status = 'occupied'
    where a.status = 'available' and exists (
      select 1 from jsonb_array_elements(p_plan->'rows') r where r->>'table' = 'tenancies'
        and r->'data'->>'status' = 'active' and r->'data'->>'apartment_id' = a.id::text);
end;
$$;

create function demo_population.validate(p_run uuid) returns void
language plpgsql set search_path = '' as $$
begin
  perform demo_population.require_operator();
  perform demo_population.check_unchanged(p_run);
  if exists (
    select 1 from public.tenancies t join demo_population.changes c on c.row_id = t.id and c.table_name = 'tenancies' and c.run_id = p_run
    join public.tenancies other on other.id <> t.id and (other.tenant_id = t.tenant_id or other.apartment_id = t.apartment_id)
      and (daterange(t.lease_start, t.lease_end, '[]') && daterange(other.lease_start, other.lease_end, '[]') or (t.status = 'active' and other.status = 'active'))
  ) then raise exception 'Generated tenancy overlaps another tenancy.'; end if;
  if exists (
    select 1 from public.payment p join demo_population.changes c on c.row_id = p.id and c.table_name = 'payment' and c.run_id = p_run
    join public.tenancies t on t.id = p.tenancy_id
    where p.tenant_id <> t.tenant_id or p.apartment_id <> t.apartment_id or p.landlord_id <> t.landlord_id
      or p.amount <> t.monthly_rent or p.due_date < t.lease_start or p.due_date > t.lease_end
      or p.reference_id not like 'DEMO-%' or p.paymongo_session_id is not null or p.paymongo_payment_id is not null or p.paymongo_intent_id is not null
  ) or exists (
    select 1 from public.payment p where exists(select 1 from demo_population.changes c where c.row_id = p.tenancy_id and c.table_name = 'tenancies' and c.run_id = p_run)
    group by tenancy_id, period_start having count(*) filter(where status = 'paid') > 1
  ) then raise exception 'Generated payments are inconsistent.'; end if;
  if exists (
    select 1 from public.tenancies t join demo_population.changes c on c.row_id = t.id and c.table_name = 'tenancies' and c.run_id = p_run
    join public.apartments a on a.id = t.apartment_id
    where t.landlord_id <> a.landlord_id or t.monthly_rent is distinct from a.monthly_rent
      or t.rent_due_day <> coalesce(a.rent_due_day,5)
      or (t.status = 'active' and (a.status <> 'occupied' or t.lease_end < (select (plan->>'asOf')::date from demo_population.runs where id = p_run)))
  ) then raise exception 'Generated occupancy is inconsistent.'; end if;
end;
$$;

-- p_preview=true never writes, including for reset/cleanup. The CLI additionally
-- wraps it in BEGIN READ ONLY. Every write is a single transaction.
create function demo_population.execute(p_mode text, p_plan jsonb, p_expected_state text, p_run uuid, p_preview boolean default true) returns jsonb
language plpgsql set search_path = '' as $$
declare v_inventory jsonb; v_before jsonb; v_after jsonb; v_saved demo_population.runs%rowtype; v_counts jsonb; v_baseline jsonb; r record;
begin
  perform demo_population.require_operator();
  if p_mode not in ('apply','reset','cleanup','verify') then raise exception 'Unknown population mode.'; end if;
  if not p_preview then perform demo_population.lock_database(); end if;
  v_inventory := demo_population.inventory();
  if v_inventory->>'stateHash' is distinct from p_expected_state then raise exception 'Database changed since preview. Generate and review a fresh preview.' using errcode = 'AP004'; end if;
  select * into v_saved from demo_population.runs;
  if v_saved.id is not null and v_saved.id <> p_run then raise exception 'Run ID does not match the recorded baseline.' using errcode = 'AP007'; end if;
  if v_saved.id is not null and v_saved.plan is distinct from p_plan then raise exception 'Dataset options or plan changed. Use the saved run; a second dataset is not allowed.' using errcode = 'AP007'; end if;
  if p_mode <> 'apply' and v_saved.id is null then raise exception 'No recorded population run.'; end if;
  if v_saved.status = 'applied' then
    perform demo_population.validate(p_run);
    if p_mode in ('reset','cleanup') then perform demo_population.check_dependencies(p_run, v_inventory->'tables', v_inventory->'storage'); end if;
  elsif p_mode <> 'apply' then raise exception 'The recorded run has already been cleaned.';
  end if;
  select coalesce(jsonb_object_agg(table_name, n), '{}'::jsonb) into v_counts from (
    select table_name, count(*) n from demo_population.changes where run_id = p_run group by table_name) counts;
  if p_preview or p_mode = 'verify' or (p_mode = 'apply' and v_saved.status = 'applied') then
    return jsonb_build_object('mode', p_mode, 'preview', p_preview, 'run', p_run, 'status', coalesce(v_saved.status, 'not_applied'), 'tracked', v_counts, 'summary', p_plan->'summary');
  end if;
  perform set_config('app.suppress_push_delivery', 'true', true);
  perform set_config('app.demo_population_run', p_run::text, true);
  if p_mode in ('cleanup','reset') then
    perform demo_population.cleanup_rows(p_run);
    -- Verify the exact tracked baseline was restored before discarding records.
    for r in select * from demo_population.changes where run_id = p_run and before_row is not null loop
      execute format('select to_jsonb(t) from public.%I t where id = $1', r.table_name) into v_after using r.row_id;
      if v_after is distinct from r.before_row then raise exception 'Baseline restoration failed.'; end if;
    end loop;
    if p_mode = 'cleanup' then
      update demo_population.runs set status = 'cleaned', updated_at = now() where id = p_run;
      return jsonb_build_object('mode', p_mode, 'run', p_run, 'status', 'cleaned', 'removed', v_counts);
    end if;
  end if;
  v_before := demo_population.snapshot();
  -- Preserve original tracking until cleanup has finished (the document guard
  -- depends on it). Replaying a cleaned run keeps its original plan and dates.
  delete from demo_population.changes where run_id = p_run;
  select jsonb_object_agg(key, ids) into v_baseline from (
    select key, coalesce((select jsonb_agg(value->>'id') from jsonb_array_elements(value) where value ? 'id'), '[]'::jsonb) ids
    from jsonb_each(v_before)) base;
  insert into demo_population.runs(id, plan, status, baseline_ids) values(p_run, p_plan, 'applied', v_baseline)
    on conflict(id) do update set status = 'applied', baseline_ids = excluded.baseline_ids, updated_at = now();
  perform demo_population.insert_plan(p_run, p_plan);
  v_after := demo_population.snapshot();
  perform demo_population.record_changes(p_run, v_before, v_after, p_plan);
  perform demo_population.validate(p_run);
  return jsonb_build_object('mode', p_mode, 'run', p_run, 'status', 'applied', 'summary', p_plan->'summary');
end;
$$;

revoke all on all functions in schema demo_population from public, anon, authenticated, service_role;
