-- Landlord membership permits access to the caller's own finances, even when
-- the same profile also holds admin. Admin membership itself grants nothing.
-- Keep restrictive active-account RLS, column grants and property ownership.
do $$
declare
  tbl text;
  owner_check text := $policy$
    landlord_id = (select id from public.users where user_id = (select auth.uid()))
    and exists (select 1 from public.users where user_id = (select auth.uid())
      and 'landlord' = any(roles) and not is_suspended)
  $policy$;
  property_check text;
begin
  foreach tbl in array array['landlord_expenses','landlord_budgets','landlord_finance_reviews'] loop
    property_check := format($policy$
      exists (select 1 from public.apartments a
        where a.id = %I.apartment_id and a.deleted_at is null
          and a.landlord_id = (select id from public.users where user_id = (select auth.uid())))
    $policy$, tbl);
    execute format('alter policy "Owner reads finances" on public.%I using (%s)', tbl, owner_check);
    execute format('alter policy "Owner inserts finances" on public.%I with check (%s and %s)', tbl, owner_check, property_check);
    execute format('alter policy "Owner updates finances" on public.%I using (%s and %s) with check (%s and %s)', tbl, owner_check, property_check, owner_check, property_check);
    execute format('alter policy "Owner deletes finances" on public.%I using (%s)', tbl, owner_check);
  end loop;
end $$;

-- Preserve the deployed accounting calculations and SECURITY INVOKER settings;
-- remove only the admin veto in the two caller-scoped report functions.
do $$
declare
  signature text;
  definition text;
  admin_veto text := ' and not (''admin'' = any(roles))';
begin
  foreach signature in array array[
    'public.get_landlord_finances(date,uuid)',
    'public.landlord_rent_ledger(date,uuid)'
  ] loop
    definition := pg_get_functiondef(signature::regprocedure);
    if strpos(definition, admin_veto) = 0 then
      raise exception 'Expected finance role guard missing in %', signature;
    end if;
    execute replace(definition, admin_veto, '');
  end loop;
end $$;
