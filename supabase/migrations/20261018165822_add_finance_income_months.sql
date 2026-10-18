-- Provide the full selectable reporting window for the month picker without
-- expanding the 12-month chart payload.
create or replace function public.get_landlord_finances(p_month date, p_apartment_id uuid default null)
returns jsonb language plpgsql stable security invoker set search_path = '' as $$
declare
  v_owner uuid;
  v_month date := date_trunc('month',p_month)::date;
  v_today date := (current_timestamp at time zone 'Asia/Manila')::date;
  v_end date;
  v_previous_end date;
  v_result jsonb;
begin
  select id into v_owner from public.users where user_id = auth.uid()
    and 'landlord' = any(roles) and not is_suspended;
  if v_owner is null then raise exception 'Landlord access is required.' using errcode = '42501'; end if;
  if v_month is null or v_month > date_trunc('month',v_today)::date
    or v_month < (date_trunc('month',v_today) - interval '23 months')::date then
    raise exception 'Choose a month within the last 24 months.';
  end if;
  if p_apartment_id is not null and not exists (
    select 1 from public.apartments where id=p_apartment_id and landlord_id=v_owner and deleted_at is null
  ) then raise exception 'Choose one of your properties.' using errcode = '42501'; end if;
  v_end := least(v_today,(v_month + interval '1 month - 1 day')::date);
  v_previous_end := case when date_trunc('month',v_today)::date = v_month
    then least((v_month - interval '1 month')::date + extract(day from v_today)::int - 1, v_month - 1)
    else v_month - 1 end;

  with properties as (
    select id,name from public.apartments where landlord_id=v_owner and deleted_at is null
  ), scoped as (
    select * from properties where p_apartment_id is null or id=p_apartment_id
  ), months as (
    select generate_series(greatest(v_month-interval '11 months',date_trunc('month',v_today)-interval '23 months'),v_month,interval '1 month')::date as month
  ), income_months as (
    select generate_series(date_trunc('month',v_today)-interval '23 months',date_trunc('month',v_today),interval '1 month')::date as month
  ), cash as (
    -- Untagged legacy payments cannot be distinguished from deposits; exclude
    -- them rather than claiming that all payments are rental income.
    select p.apartment_id,p.date,p.amount from public.payment p
    where p.apartment_id in (select id from scoped) and p.status='paid'
      and p.tenancy_id is not null and p.period_start is not null
      and p.date >= (v_month-interval '11 months')::date and p.date <= v_end
  ), income_cash as (
    -- Same rule as cash, widened to the picker window only.
    select p.date,p.amount from public.payment p
    where p.apartment_id in (select id from scoped) and p.status='paid'
      and p.tenancy_id is not null and p.period_start is not null
      and p.date >= (date_trunc('month',v_today)-interval '23 months')::date and p.date <= v_today
  ), income_collections as (
    select m.month,coalesce(sum(c.amount),0) as collected
    from income_months m left join income_cash c on date_trunc('month',c.date)::date=m.month
    group by m.month
  ), costs as (
    select * from public.landlord_expenses where landlord_id=v_owner
      and apartment_id in (select id from scoped)
      and spent_on >= (v_month-interval '11 months')::date and spent_on <= v_end
  ), per_property as (
    select a.id,a.name,m.month,
      coalesce((select sum(c.amount) from cash c where c.apartment_id=a.id and date_trunc('month',c.date)::date=m.month),0) as collected,
      coalesce((select sum(e.amount) from costs e where e.apartment_id=a.id and date_trunc('month',e.spent_on)::date=m.month and e.treatment='operating'),0) as operating,
      coalesce((select sum(e.amount) from costs e where e.apartment_id=a.id and date_trunc('month',e.spent_on)::date=m.month and e.treatment='capital'),0) as capital,
      exists(select 1 from public.landlord_finance_reviews r where r.landlord_id=v_owner and r.apartment_id=a.id and r.month=m.month) as reviewed
    from scoped a cross join months m
  ), ledger as (
    select * from public.landlord_rent_ledger(v_month,p_apartment_id)
  )
  select jsonb_build_object(
    'properties',coalesce((select jsonb_agg(jsonb_build_object('id',id,'name',name) order by name,id) from properties),'[]'::jsonb),
    'months',coalesce((select jsonb_agg(row_to_json(q) order by q.month) from (
      select to_char(m.month,'YYYY-MM') as month,coalesce(sum(p.collected),0) as collected,
        coalesce(sum(p.operating),0) as operating,coalesce(sum(p.capital),0) as capital,
        coalesce(bool_and(p.reviewed),false) as reviewed
      from months m left join per_property p on p.month=m.month group by m.month
    ) q),'[]'::jsonb),
    'income_months',coalesce((select jsonb_agg(jsonb_build_object('month',to_char(month,'YYYY-MM'),'collected',collected) order by month)
      from income_collections), '[]'::jsonb),
    'comparison',jsonb_build_object(
      'collected',coalesce((select sum(amount) from cash where date >= (v_month-interval '1 month')::date and date<=v_previous_end),0),
      'operating',coalesce((select sum(amount) from costs where treatment='operating' and spent_on >= (v_month-interval '1 month')::date and spent_on<=v_previous_end),0),
      'reviewed',not exists(select 1 from scoped a where not exists(select 1 from public.landlord_finance_reviews r where r.landlord_id=v_owner and r.apartment_id=a.id and r.month=(v_month-interval '1 month')::date))
    ),
    'categories',coalesce((select jsonb_agg(row_to_json(q)) from (
      select category,sum(amount) filter(where spent_on>=v_month) as amount,
        coalesce(sum(amount) filter(where spent_on>=(v_month-interval '1 month')::date and spent_on<=v_previous_end),0) as previous_amount
      from costs where spent_on>=(v_month-interval '1 month')::date group by category
    ) q),'[]'::jsonb),
    'budgets',coalesce((select jsonb_agg((to_jsonb(b)-'landlord_id') || jsonb_build_object('spent',
      coalesce((select sum(e.amount) from costs e where e.apartment_id=b.apartment_id and e.category=b.category and e.spent_on>=v_month),0))
      order by b.category,b.apartment_id) from public.landlord_budgets b
      where b.landlord_id=v_owner and b.apartment_id in(select id from scoped) and b.month=v_month),'[]'::jsonb),
    'performance',coalesce((select jsonb_agg(row_to_json(p) order by p.collected desc,p.id) from per_property p where p.month=v_month),'[]'::jsonb),
    'collections',jsonb_build_object('expected',coalesce((select sum(expected) from ledger),0),
      'collected',coalesce((select sum(collected) from ledger),0),
      'pending',coalesce((select sum(outstanding) from ledger where status='pending'),0),
      'overdue',coalesce((select sum(outstanding) from ledger where status='overdue'),0),
      'overdueCount',(select count(*) from ledger where status='overdue'),
      'age7',coalesce((select sum(outstanding) from ledger where days_late between 1 and 7),0),
      'age30',coalesce((select sum(outstanding) from ledger where days_late between 8 and 30),0),
      'ageOlder',coalesce((select sum(outstanding) from ledger where days_late>30),0)),
    'unclassified',coalesce((select sum(amount) from public.payment where apartment_id in(select id from scoped)
      and status='paid' and (period_start is null or tenancy_id is null) and date between v_month and v_end),0)
  ) into v_result;
  return v_result;
end $$;
revoke all on function public.get_landlord_finances(date,uuid) from public,anon;
grant execute on function public.get_landlord_finances(date,uuid) to authenticated;
