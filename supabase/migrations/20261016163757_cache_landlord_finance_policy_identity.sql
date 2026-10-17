-- Cache the JWT identity once per statement in all finance policies. This
-- preserves their ownership/role/account checks and avoids per-row auth calls.
do $$
declare p record;
begin
  for p in
    select pol.polname, c.relname, pg_get_expr(pol.polqual, pol.polrelid) as using_expr,
      pg_get_expr(pol.polwithcheck, pol.polrelid) as check_expr
    from pg_policy pol join pg_class c on c.oid=pol.polrelid
    join pg_namespace n on n.oid=c.relnamespace
    where n.nspname='public' and c.relname in ('landlord_expenses','landlord_budgets','landlord_finance_reviews')
      and pol.polname <> 'Active accounts only'
  loop
    execute format('alter policy %I on public.%I %s %s', p.polname,p.relname,
      case when p.using_expr is null then '' else 'using (' || replace(p.using_expr,'auth.uid()','(select auth.uid())') || ')' end,
      case when p.check_expr is null then '' else 'with check (' || replace(p.check_expr,'auth.uid()','(select auth.uid())') || ')' end);
  end loop;
end $$;
