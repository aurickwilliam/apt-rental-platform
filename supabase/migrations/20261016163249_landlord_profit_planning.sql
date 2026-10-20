-- Private, caller-owned finance records. Existing payment/status workflows are unchanged.
create table public.landlord_expenses (
  id uuid primary key default gen_random_uuid(),
  landlord_id uuid not null references public.users(id),
  apartment_id uuid not null references public.apartments(id),
  category text not null check (category in ('maintenance','furniture','turnover','insurance','taxes','utilities','fees','other')),
  treatment text not null default 'operating' check (treatment in ('operating','capital')),
  amount numeric(11,2) not null check (amount > 0 and amount <= 999999999.99),
  spent_on date not null check (spent_on >= date '2000-01-01'),
  description text not null check (length(btrim(description)) between 1 and 200),
  created_at timestamptz not null default now()
);
create index landlord_expenses_owner_date on public.landlord_expenses(landlord_id, spent_on desc, id desc);
create index landlord_expenses_apartment on public.landlord_expenses(apartment_id, spent_on);

create table public.landlord_budgets (
  id uuid primary key default gen_random_uuid(),
  landlord_id uuid not null references public.users(id),
  apartment_id uuid not null references public.apartments(id),
  month date not null check (extract(day from month) = 1),
  category text not null check (category in ('maintenance','furniture','turnover','insurance','taxes','utilities','fees','emergency','vacancy','other')),
  kind text not null check (kind in ('expense','reserve')),
  amount numeric(11,2) not null check (amount >= 0 and amount <= 999999999.99),
  target_amount numeric(11,2) check (target_amount > 0 and target_amount <= 999999999.99),
  months_remaining integer check (months_remaining between 1 and 600),
  check ((target_amount is null) = (months_remaining is null)),
  check (kind = 'reserve' or category not in ('emergency','vacancy')),
  unique (landlord_id, apartment_id, month, category, kind)
);
create index landlord_budgets_apartment on public.landlord_budgets(apartment_id);

-- Explicit confirmation permits a real zero-expense month without assuming missing = zero.
create table public.landlord_finance_reviews (
  landlord_id uuid not null references public.users(id),
  apartment_id uuid not null references public.apartments(id),
  month date not null check (extract(day from month) = 1 and month <= date_trunc('month',current_timestamp at time zone 'Asia/Manila')::date),
  primary key (landlord_id, apartment_id, month)
);
create index landlord_finance_reviews_apartment on public.landlord_finance_reviews(apartment_id);

alter table public.landlord_expenses enable row level security;
alter table public.landlord_budgets enable row level security;
alter table public.landlord_finance_reviews enable row level security;
revoke all on public.landlord_expenses, public.landlord_budgets, public.landlord_finance_reviews from anon, authenticated;
grant select, delete on public.landlord_expenses, public.landlord_budgets, public.landlord_finance_reviews to authenticated;
grant insert(id,landlord_id,apartment_id,category,treatment,amount,spent_on,description),
  update(category,treatment,amount,spent_on,description) on public.landlord_expenses to authenticated;
grant insert(landlord_id,apartment_id,month,category,kind,amount,target_amount,months_remaining),
  update(amount,target_amount,months_remaining) on public.landlord_budgets to authenticated;
grant insert(landlord_id,apartment_id,month) on public.landlord_finance_reviews to authenticated;

-- Restrictive active-account checks complement ownership, never replace it.
do $$
declare tbl text;
begin
  foreach tbl in array array['landlord_expenses','landlord_budgets','landlord_finance_reviews'] loop
    execute format('create policy "Active accounts only" on public.%I as restrictive for all to authenticated using ((select app_private.is_active_user())) with check ((select app_private.is_active_user()))', tbl);
    execute format('create policy "Owner reads finances" on public.%I for select to authenticated using (landlord_id = (select id from public.users where user_id = auth.uid()) and exists (select 1 from public.users where user_id = auth.uid() and ''landlord'' = any(roles) and not (''admin'' = any(roles))))', tbl);
    execute format('create policy "Owner inserts finances" on public.%I for insert to authenticated with check (landlord_id = (select id from public.users where user_id = auth.uid()) and exists (select 1 from public.users where user_id = auth.uid() and ''landlord'' = any(roles) and not (''admin'' = any(roles))) and exists (select 1 from public.apartments a where a.id = apartment_id and a.landlord_id = (select id from public.users where user_id = auth.uid()) and a.deleted_at is null))', tbl);
    execute format('create policy "Owner updates finances" on public.%I for update to authenticated using (landlord_id = (select id from public.users where user_id = auth.uid()) and exists (select 1 from public.apartments a where a.id = apartment_id and a.landlord_id = (select id from public.users where user_id = auth.uid()) and a.deleted_at is null)) with check (landlord_id = (select id from public.users where user_id = auth.uid()) and exists (select 1 from public.users where user_id = auth.uid() and ''landlord'' = any(roles) and not (''admin'' = any(roles))) and exists (select 1 from public.apartments a where a.id = apartment_id and a.landlord_id = (select id from public.users where user_id = auth.uid()) and a.deleted_at is null))', tbl);
    execute format('create policy "Owner deletes finances" on public.%I for delete to authenticated using (landlord_id = (select id from public.users where user_id = auth.uid()) and exists (select 1 from public.users where user_id = auth.uid() and ''landlord'' = any(roles) and not (''admin'' = any(roles))))', tbl);
  end loop;
end $$;

create function public.guard_landlord_finance_expense()
returns trigger language plpgsql security invoker set search_path = '' as $$
begin
  if tg_op <> 'DELETE' then
    if new.spent_on > (current_timestamp at time zone 'Asia/Manila')::date then
      raise exception 'Record expenses already paid, not future spending.';
    end if;
    delete from public.landlord_finance_reviews
      where landlord_id = new.landlord_id and apartment_id = new.apartment_id
        and month = date_trunc('month', new.spent_on)::date;
  end if;
  if tg_op <> 'INSERT' then
    delete from public.landlord_finance_reviews
      where landlord_id = old.landlord_id and apartment_id = old.apartment_id
        and month = date_trunc('month', old.spent_on)::date;
  end if;
  if tg_op = 'DELETE' then return old; end if;
  return new;
end $$;
revoke all on function public.guard_landlord_finance_expense() from public, anon, authenticated;
create trigger guard_landlord_finance_expense before insert or update or delete on public.landlord_expenses
  for each row execute function public.guard_landlord_finance_expense();

-- Calendar rent periods follow notify_rent_due_status: clamp the due day and skip
-- any month whose due date predates move-in. No dependency on a pending payment row.
create function public.landlord_rent_ledger(p_month date, p_apartment_id uuid default null)
returns table (id uuid, apartment_id uuid, apartment_name text, tenant_name text,
  due_date date, expected numeric, collected numeric, outstanding numeric, days_late integer, status text)
language sql stable security invoker set search_path = '' as $$
  with periods as (
    select t.id, t.apartment_id, a.name, u.first_name, u.last_name,
      coalesce(t.monthly_rent,a.monthly_rent,0) as rent,
      (date_trunc('month',p_month)::date + least(t.rent_due_day,
        extract(day from (date_trunc('month',p_month) + interval '1 month - 1 day'))::int) - 1) as due,
      t.lease_start, t.lease_end
    from public.tenancies t join public.apartments a on a.id = t.apartment_id
    join public.users u on u.id = t.tenant_id
    where a.landlord_id = (select id from public.users where user_id = auth.uid()
      and 'landlord' = any(roles) and not ('admin' = any(roles)))
      and a.deleted_at is null and (p_apartment_id is null or a.id = p_apartment_id)
      and (t.status = 'active' or (t.status = 'ended' and t.lease_end is not null))
  ), paid as (
    select p.tenancy_id, sum(greatest(p.amount,0)) as amount from public.payment p
    where p.status = 'paid' and p.period_start = date_trunc('month',p_month)::date
      and p.date <= (current_timestamp at time zone 'Asia/Manila')::date
    group by p.tenancy_id
  )
  select b.id, b.apartment_id, b.name,
    btrim(coalesce(b.first_name,'') || ' ' || coalesce(b.last_name,'')), b.due, b.rent,
    least(b.rent,coalesce(p.amount,0)), greatest(b.rent-coalesce(p.amount,0),0),
    greatest((current_timestamp at time zone 'Asia/Manila')::date-b.due,0),
    case when coalesce(p.amount,0) >= b.rent then 'collected'
      when b.due < (current_timestamp at time zone 'Asia/Manila')::date then 'overdue' else 'pending' end
  from periods b left join paid p on p.tenancy_id = b.id
  where b.due >= b.lease_start and (b.lease_end is null or b.due <= b.lease_end)
    and b.rent > 0 and date_trunc('month',p_month) <= date_trunc('month',(current_timestamp at time zone 'Asia/Manila'));
$$;
revoke all on function public.landlord_rent_ledger(date,uuid) from public, anon;
grant execute on function public.landlord_rent_ledger(date,uuid) to authenticated;

create function public.get_landlord_finances(p_month date, p_apartment_id uuid default null)
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
    and 'landlord' = any(roles) and not ('admin' = any(roles)) and not is_suspended;
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
  ), cash as (
    -- Untagged legacy payments cannot be distinguished from deposits; exclude
    -- them rather than claiming that all payments are rental income.
    select p.apartment_id,p.date,p.amount from public.payment p
    where p.apartment_id in (select id from scoped) and p.status='paid'
      and p.tenancy_id is not null and p.period_start is not null
      and p.date >= (v_month-interval '11 months')::date and p.date <= v_end
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

create function public.save_landlord_finance_budget(p_apartment_id uuid,p_month date,p_category text,p_kind text,p_amount numeric,
  p_target_amount numeric default null,p_months_remaining integer default null)
returns void language sql security invoker set search_path = '' as $$
  insert into public.landlord_budgets(landlord_id,apartment_id,month,category,kind,amount,target_amount,months_remaining)
  values ((select id from public.users where user_id=auth.uid()),p_apartment_id,date_trunc('month',p_month)::date,
    p_category,p_kind,p_amount,p_target_amount,p_months_remaining)
  on conflict (landlord_id,apartment_id,month,category,kind) do update
    set amount=excluded.amount,target_amount=excluded.target_amount,months_remaining=excluded.months_remaining;
$$;
revoke all on function public.save_landlord_finance_budget(uuid,date,text,text,numeric,numeric,integer) from public,anon;
grant execute on function public.save_landlord_finance_budget(uuid,date,text,text,numeric,numeric,integer) to authenticated;

create function public.confirm_landlord_finance_month(p_month date,p_apartment_id uuid default null)
returns void language plpgsql security invoker set search_path = '' as $$
begin
  if p_month is null or date_trunc('month',p_month) > date_trunc('month',current_timestamp at time zone 'Asia/Manila') then
    raise exception 'Only current or past expenses can be reviewed.';
  end if;
  insert into public.landlord_finance_reviews(landlord_id,apartment_id,month)
    select a.landlord_id,a.id,date_trunc('month',p_month)::date from public.apartments a
    where a.landlord_id=(select id from public.users where user_id=auth.uid())
      and a.deleted_at is null and (p_apartment_id is null or a.id=p_apartment_id)
  on conflict do nothing;
end $$;
revoke all on function public.confirm_landlord_finance_month(date,uuid) from public,anon;
grant execute on function public.confirm_landlord_finance_month(date,uuid) to authenticated;
