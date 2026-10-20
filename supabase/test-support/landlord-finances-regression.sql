-- Runs only in the isolated bootstrap above. Every fixture is rolled back.
\set ON_ERROR_STOP on
begin;
create function pg_temp.assert(ok boolean,label text) returns void language plpgsql as $$
begin if ok is distinct from true then raise exception 'FAIL: %',label; end if; raise notice 'PASS: %',label; end $$;
grant execute on function pg_temp.assert(boolean,text) to authenticated,anon;
create temp table fixture as select gen_random_uuid() owner,gen_random_uuid() owner_auth,
  gen_random_uuid() other,gen_random_uuid() other_auth,gen_random_uuid() tenant,gen_random_uuid() tenant_auth,
  gen_random_uuid() admin,gen_random_uuid() admin_auth,gen_random_uuid() apt,gen_random_uuid() apt2,
  gen_random_uuid() foreign_apt,gen_random_uuid() tenancy,gen_random_uuid() tenancy2,
  gen_random_uuid() expense,gen_random_uuid() second_expense,
  date_trunc('month',current_date)::date as month,
  (date_trunc('month',current_date)-interval '1 month')::date as previous,
  (date_trunc('month',(current_timestamp at time zone 'Asia/Manila')::date)-interval '23 months')::date as oldest_pick,
  (date_trunc('month',(current_timestamp at time zone 'Asia/Manila')::date)-interval '24 months')::date as before_oldest;
grant select on fixture to authenticated,anon;
insert into public.users(id,user_id,roles,first_name) select owner,owner_auth,'{tenant,admin,landlord}'::text[],'Owner' from fixture
  union all select other,other_auth,'{landlord}','Other' from fixture
  union all select tenant,tenant_auth,'{tenant}','Tenant' from fixture
  union all select admin,admin_auth,'{admin}','Admin' from fixture;
insert into public.apartments(id,landlord_id,name,monthly_rent) select apt,owner,'Villa',10000 from fixture
  union all select apt2,owner,'Second',5000 from fixture
  union all select foreign_apt,other,'Foreign',9999 from fixture;
insert into public.tenancies(id,apartment_id,tenant_id,lease_start,monthly_rent,rent_due_day)
  select tenancy,apt,tenant,previous,10000,1 from fixture
  union all select tenancy2,apt2,tenant,previous,5000,31 from fixture;
insert into public.payment(apartment_id,tenancy_id,date,amount,status,period_start)
  select apt,tenancy,month,4000,'paid',month from fixture union all
  select apt,tenancy,month,10000,'pending',month from fixture union all
  select apt,tenancy,month,10000,'rejected',month from fixture union all
  select apt,null,month,3000,'paid',null from fixture union all
  select apt,tenancy,previous,10000,'paid',previous from fixture union all
  select apt,tenancy,oldest_pick,2000,'paid',oldest_pick from fixture union all
  select apt,tenancy,before_oldest,700,'paid',before_oldest from fixture;

set local role anon;
do $$ begin
  begin perform * from public.landlord_expenses; raise exception 'anon read allowed'; exception when insufficient_privilege then null; end;
  begin perform public.get_landlord_finances(current_date); raise exception 'anon RPC allowed'; exception when insufficient_privilege then null; end;
end $$;
reset role;
select pg_temp.assert(not has_table_privilege('anon','public.landlord_budgets','SELECT'),'anonymous budgets denied');
select pg_temp.assert(not has_table_privilege('anon','public.landlord_finance_reviews','INSERT'),'anonymous reviews denied');
select pg_temp.assert(not has_column_privilege('authenticated','public.landlord_expenses','landlord_id','UPDATE'),'expense owner immutable');
select pg_temp.assert(not has_column_privilege('authenticated','public.landlord_expenses','apartment_id','UPDATE'),'expense property immutable');
select pg_temp.assert((select bool_and(relrowsecurity) from pg_class where oid in('public.landlord_expenses'::regclass,'public.landlord_budgets'::regclass,'public.landlord_finance_reviews'::regclass)),'all finance tables have RLS');
select set_config('request.jwt.claim.sub',(select owner_auth::text from fixture),true);
set local role authenticated;
select pg_temp.assert((select (public.get_landlord_finances(month)->'months'->-1->>'collected')::numeric=4000 from fixture),'cash excludes unclassified and pending/rejected payments');
select pg_temp.assert((select (public.get_landlord_finances(month)->>'unclassified')::numeric=3000 from fixture),'unclassified money surfaced separately');
select pg_temp.assert((select (public.get_landlord_finances(month)->'months'->-1->>'reviewed')::boolean=false from fixture),'missing expenses never assumed complete');
select pg_temp.assert((select sum(outstanding)=11000 from fixture f cross join lateral public.landlord_rent_ledger(f.month) l),'partial receipts reduce rent due and failed attempts do not duplicate it');
select pg_temp.assert((select count(*)=1 from fixture f cross join lateral public.landlord_rent_ledger(f.month) l where l.id=f.tenancy2 and extract(day from due_date)=extract(day from (f.month+interval '1 month - 1 day'))),'due day clamped at month end');
select pg_temp.assert((select (public.get_landlord_finances(month)->'comparison'->>'collected')::numeric=10000 from fixture),'comparison uses previous same-elapsed-day cash');
select pg_temp.assert((select jsonb_array_length(public.get_landlord_finances(month)->'income_months')=24 from fixture),'picker summary spans the selectable 24-month window');
select pg_temp.assert((select public.get_landlord_finances(month)->'income_months'->0->>'month'=to_char(oldest_pick,'YYYY-MM') from fixture),'picker summary starts 23 months back');
select pg_temp.assert((select (public.get_landlord_finances(month)->'income_months'->0->>'collected')::numeric=2000 from fixture),'picker summary reports older collected rent');
select pg_temp.assert((select (public.get_landlord_finances(month,apt2)->'income_months'->0->>'collected')::numeric=0 from fixture),'picker summary follows the selected property');
select pg_temp.assert((select (public.get_landlord_finances(oldest_pick,apt)->'comparison'->>'collected')::numeric=700 from fixture),'oldest selectable month still compares against its previous month');
insert into public.landlord_expenses(id,landlord_id,apartment_id,category,treatment,amount,spent_on,description)
  select expense,owner,apt,'maintenance','operating',1000,month,'Repair' from fixture;
insert into public.landlord_expenses(id,landlord_id,apartment_id,category,treatment,amount,spent_on,description)
  select second_expense,owner,apt,'furniture','capital',2000,month,'Replacement' from fixture;
select pg_temp.assert((select count(*)=2 from public.landlord_expenses),'owner creates and reads expenses');
select public.confirm_landlord_finance_month(month) from fixture;
select pg_temp.assert((select count(*)=2 from public.landlord_finance_reviews),'review covers every selected property including zero-expense property');
select pg_temp.assert((select (public.get_landlord_finances(month)->'months'->-1->>'reviewed')::boolean from fixture),'review enables income');
select pg_temp.assert((select (public.get_landlord_finances(month)->'months'->-1->>'operating')::numeric=1000 from fixture),'operating excludes capital replacements');
select pg_temp.assert((select (public.get_landlord_finances(month)->'months'->-1->>'capital')::numeric=2000 from fixture),'capital cash reported separately');
select public.save_landlord_finance_budget(apt,month,'maintenance','expense',1500) from fixture;
select public.save_landlord_finance_budget(apt,month,'maintenance','expense',1800) from fixture;
select pg_temp.assert((select count(*)=1 and max(amount)=1800 from public.landlord_budgets),'budget upsert is idempotent');
select pg_temp.assert((select (public.get_landlord_finances(month)->'budgets'->0->>'spent')::numeric=1000 from fixture),'actual category spending is property-specific');
select public.save_landlord_finance_budget(apt,month,'insurance','reserve',1000,12000,12) from fixture;
select pg_temp.assert((select (public.get_landlord_finances(month)->'months'->-1->>'operating')::numeric=1000 from fixture),'reserve is not an operating expense');
update public.landlord_expenses set amount=1100 where id=(select expense from fixture);
select pg_temp.assert((select count(*)=1 from public.landlord_finance_reviews),'editing invalidates review');
select public.confirm_landlord_finance_month(month) from fixture;
update public.landlord_expenses set spent_on=(select previous from fixture) where id=(select expense from fixture);
select pg_temp.assert((select count(*)=1 from public.landlord_finance_reviews),'moving an expense invalidates both affected months');
select public.confirm_landlord_finance_month(month) from fixture;
delete from public.landlord_expenses where id=(select second_expense from fixture);
select pg_temp.assert((select count(*)=1 from public.landlord_finance_reviews),'deleting invalidates review');
do $$ begin
  begin
    insert into public.landlord_expenses(landlord_id,apartment_id,category,treatment,amount,spent_on,description)
      select owner,foreign_apt,'maintenance','operating',1,month,'Wrong property' from fixture;
    raise exception 'foreign property write allowed'; exception when insufficient_privilege then null;
  end;
  begin
    insert into public.landlord_expenses(landlord_id,apartment_id,category,treatment,amount,spent_on,description)
      select owner,apt,'maintenance','operating',1,current_date+1,'Future' from fixture;
    raise exception 'future expense allowed'; exception when raise_exception then
      if sqlerrm <> 'Record expenses already paid, not future spending.' then raise; end if;
  end;
  begin
    perform public.get_landlord_finances(current_date,(select foreign_apt from fixture));
    raise exception 'foreign report allowed'; exception when insufficient_privilege then null;
  end;
end $$;
select set_config('request.jwt.claim.sub',(select other_auth::text from fixture),true);
select pg_temp.assert((select jsonb_array_length(public.get_landlord_finances(month)->'properties')=1 from fixture),'landlord-only accounts retain their own reports');
select pg_temp.assert((select count(*)=0 from public.landlord_expenses),'another landlord cannot read expenses');
select pg_temp.assert((select count(*)=0 from public.landlord_budgets),'another landlord cannot read budgets');
select pg_temp.assert((select count(*)=0 from public.landlord_finance_reviews),'another landlord cannot read reviews');
update public.landlord_expenses set amount=99 where id=(select expense from fixture);
delete from public.landlord_expenses where id=(select expense from fixture);
select set_config('request.jwt.claim.sub',(select owner_auth::text from fixture),true);
select pg_temp.assert((select amount=1100 from public.landlord_expenses where id=(select expense from fixture)),'denied update/delete leave the owner record intact');
select set_config('request.jwt.claim.sub',(select tenant_auth::text from fixture),true);
select pg_temp.assert((select count(*)=0 from public.landlord_expenses),'tenant cannot read landlord finances');
do $$ begin
  begin perform public.get_landlord_finances(current_date); raise exception 'tenant report allowed'; exception when insufficient_privilege then null; end;
end $$;
select set_config('request.jwt.claim.sub',(select admin_auth::text from fixture),true);
select pg_temp.assert((select count(*)=0 from public.landlord_expenses),'admin-only cannot read another landlord expenses');
select pg_temp.assert((select count(*)=0 from public.landlord_budgets),'admin-only cannot read another landlord budgets');
select pg_temp.assert((select count(*)=0 from public.landlord_finance_reviews),'admin-only cannot read another landlord reviews');
do $$ begin
  begin perform public.get_landlord_finances(current_date); raise exception 'admin report allowed'; exception when insufficient_privilege then null; end;
end $$;
reset role;
update public.users set roles='{tenant,admin}' where id=(select owner from fixture);
select set_config('request.jwt.claim.sub',(select owner_auth::text from fixture),true);
set local role authenticated;
select pg_temp.assert((select count(*)=0 from public.landlord_expenses),'revoked landlord membership hides previously owned expenses');
do $$ begin
  begin perform public.get_landlord_finances(current_date); raise exception 'revoked landlord report allowed'; exception when insufficient_privilege then null; end;
end $$;
reset role;
update public.users set roles='{tenant,admin,landlord}' where id=(select owner from fixture);
update public.users set is_suspended=true where id=(select owner from fixture);
select set_config('request.jwt.claim.sub',(select owner_auth::text from fixture),true);
set local role authenticated;
select pg_temp.assert((select count(*)=0 from public.landlord_expenses),'suspended owner cannot read finances');
do $$ begin
  begin
    perform public.get_landlord_finances(current_date); raise exception 'suspended report allowed'; exception when insufficient_privilege then null;
  end;
end $$;
reset role;
rollback;
