-- READ ONLY. Schema metadata only, never user rows or Auth configuration.
-- Output with: psql -XqAt --set ON_ERROR_STOP=1 -f ... > /protected/schema.json
begin read only;
select jsonb_build_object(
  'columns', (select jsonb_agg(x) from (select table_name,column_name,udt_schema,udt_name,is_nullable,column_default from information_schema.columns where table_schema='public' order by table_name,ordinal_position) x),
  'constraints', (select jsonb_agg(x) from (select c.relname as table_name,con.conname,pg_get_constraintdef(con.oid) as definition from pg_constraint con join pg_class c on c.oid=con.conrelid join pg_namespace n on n.oid=c.relnamespace where n.nspname='public') x),
  'indexes', (select jsonb_agg(x) from (select tablename,indexname,indexdef from pg_indexes where schemaname='public') x),
  'functions', (select jsonb_agg(x) from (select distinct p.oid,n.nspname as schema,p.proname as name,pg_get_functiondef(p.oid) as definition from pg_proc p join pg_namespace n on n.oid=p.pronamespace where p.oid in (select t.tgfoid from pg_trigger t join pg_class c on c.oid=t.tgrelid join pg_namespace cn on cn.oid=c.relnamespace where cn.nspname='public' and not t.tgisinternal) or (n.nspname='public' and p.proname='create_notification') or (n.nspname='private' and p.proname='application_document_problem')) x),
  'triggers', (select jsonb_agg(x) from (select pg_get_triggerdef(t.oid) as definition from pg_trigger t join pg_class c on c.oid=t.tgrelid join pg_namespace n on n.oid=c.relnamespace where n.nspname='public' and not t.tgisinternal) x)
);
commit;
