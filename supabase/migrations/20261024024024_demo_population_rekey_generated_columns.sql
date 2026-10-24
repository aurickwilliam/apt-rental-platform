-- Follow-up to 20261024023810: a column added to payment after a run was recorded
-- may be a GENERATED column (payment.rental_income_amount is derived from amount and
-- the billing columns). It is populated for every row yet nobody can write it, and
-- it depends only on columns the re-key already compares exactly. So a newer column
-- is accepted when it is empty OR generated; any other populated newer column still
-- makes the re-key refuse. Used for tracked payment rows only.

create or replace function demo_population.matches_recorded(p_current jsonb, p_recorded jsonb) returns boolean
language sql stable set search_path = '' as $$
  select p_current is not null and p_recorded is not null
    and (p_current - array(select jsonb_object_keys(p_current) except select jsonb_object_keys(p_recorded))) = p_recorded
    and not exists (
      select 1 from jsonb_each(p_current) e
      where not jsonb_exists(p_recorded, e.key) and e.value <> 'null'::jsonb
        and not exists (
          select 1 from pg_catalog.pg_attribute a
          where a.attrelid = 'public.payment'::regclass and a.attname = e.key
            and a.attgenerated <> '' and not a.attisdropped
        )
    )
$$;

revoke all on all functions in schema demo_population from public, anon, authenticated, service_role;
