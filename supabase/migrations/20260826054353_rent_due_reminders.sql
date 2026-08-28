-- Rent-due reminders: canonical due day + daily D-3 / due-day / D+1 notices.
--
-- rent_due_day is the single source of truth for when rent falls due:
--   - apartments.rent_due_day: set by the landlord at posting time
--   - tenancies.rent_due_day:  copied on approval, seeded from payment history
--
-- notify_rent_due_status() runs daily at 01:00 UTC (09:00 PHT) via pg_cron.
-- For every active tenancy whose current billing cycle is unpaid it notifies
-- the tenant (and the landlord) three days before the due date, on the due
-- date, and once past due. rent_reminders is the idempotency ledger: its
-- UNIQUE key makes cron retries and re-runs no-ops. Notices flow through
-- create_notification(), so push delivery fires via pg_net exactly like the
-- trigger-based payment notifications (and respects the Payments preference).

alter table public.apartments
  add column rent_due_day smallint not null default 5 check (rent_due_day between 1 and 31);

alter table public.tenancies
  add column rent_due_day smallint not null default 5 check (rent_due_day between 1 and 31);

-- Seed existing tenancies from their most recent payment that carries a due
-- date; tenancies without payment history keep the default (5th).
update public.tenancies t
set rent_due_day = seeded.day
from (
  select distinct on (tenancy_id)
    tenancy_id,
    extract(day from due_date)::smallint as day
  from public.payment
  where tenancy_id is not null and due_date is not null
  order by tenancy_id, due_date desc
) as seeded
where t.id = seeded.tenancy_id;

create table public.rent_reminders (
  id uuid primary key default gen_random_uuid(),
  tenancy_id uuid not null references public.tenancies(id) on delete cascade,
  due_date date not null,
  kind text not null check (kind in ('upcoming', 'due', 'overdue')),
  created_at timestamptz not null default now(),
  unique (tenancy_id, due_date, kind)
);

-- Internal ledger for the cron notifier; clients never touch it.
alter table public.rent_reminders enable row level security;

-- Copy the apartment's due day into the tenancy on approval (same place the
-- rent/deposit amounts are carried over).
create or replace function public.handle_application_approved()
returns trigger
language plpgsql
security definer
as $function$
DECLARE
  v_apartment apartments%ROWTYPE;
  v_lease_end DATE;
BEGIN
  IF NEW.status = 'approved' AND (OLD.status IS DISTINCT FROM 'approved') THEN
    -- Lock the apartment row for the rest of this transaction. If two
    -- approvals for the same apartment land at the same time, the second
    -- one blocks here until the first commits, so it always sees the
    -- up-to-date status instead of racing past this check.
    SELECT * INTO v_apartment
    FROM apartments
    WHERE id = NEW.apartment_id
    FOR UPDATE;

    IF v_apartment.status = 'occupied' THEN
      RAISE EXCEPTION 'Apartment is already occupied; cannot approve another application for it';
    END IF;

    -- Compute lease_end from move_in_date + lease_duration
    v_lease_end := CASE v_apartment.lease_duration
      WHEN 'Monthly'  THEN NEW.move_in_date + INTERVAL '1 month'
      WHEN '3 Months' THEN NEW.move_in_date + INTERVAL '3 months'
      WHEN '6 Months' THEN NEW.move_in_date + INTERVAL '6 months'
      WHEN '1 Year'   THEN NEW.move_in_date + INTERVAL '1 year'
      WHEN '2 Years'  THEN NEW.move_in_date + INTERVAL '2 years'
      ELSE NULL
    END;

    INSERT INTO tenancies (
      apartment_id,
      tenant_id,
      landlord_id,
      lease_start,
      lease_end,
      monthly_rent,
      security_deposit,
      advance_rent,
      rent_due_day,
      status
    ) VALUES (
      NEW.apartment_id,
      NEW.tenant_id,
      v_apartment.landlord_id,
      NEW.move_in_date,
      v_lease_end,
      v_apartment.monthly_rent,
      v_apartment.security_deposit,
      v_apartment.advance_rent,
      v_apartment.rent_due_day,
      'active'
    );

    UPDATE apartments
    SET status = 'occupied'
    WHERE id = NEW.apartment_id;
  END IF;

  RETURN NEW;
END;
$function$;

-- Daily rent reminders. Candidate due dates come from prev/current/next
-- month (day clamped to month end) so exactly one kind matches today:
--   upcoming -> due_date - 3, due -> due_date, overdue -> due_date + 1.
create or replace function public.notify_rent_due_status()
returns void
language plpgsql
security definer
set search_path = public
as $function$
declare
  v_today date;
  v_offset int;
  t record;
  v_month_anchor date;
  v_last_day int;
  v_due date;
  v_kind text;
  v_paid numeric(18, 2);
  v_amount_text text;
  v_due_label text;
  v_period_label text;
  v_tenant_name text;
  v_tenant_title text;
  v_tenant_message text;
  v_landlord_title text;
  v_landlord_message text;
  v_landlord_id uuid;
  v_reminder_id uuid;
  v_payload jsonb;
begin
  v_today := (now() at time zone 'Asia/Manila')::date;

  for t in
    select tn.id,
           tn.tenant_id,
           tn.apartment_id,
           tn.lease_start,
           tn.rent_due_day,
           coalesce(tn.monthly_rent, a.monthly_rent) as monthly_rent,
           a.name as apartment_name,
           a.landlord_id as apt_landlord_id,
           trim(coalesce(u.first_name, '') || ' ' || coalesce(u.last_name, '')) as tenant_name
    from public.tenancies tn
    join public.apartments a on a.id = tn.apartment_id
    left join public.users u on u.id = tn.tenant_id
    where tn.status = 'active'
      and coalesce(tn.monthly_rent, a.monthly_rent) > 0
      and (tn.lease_end is null or tn.lease_end >= v_today)
  loop
    v_tenant_name := nullif(trim(t.tenant_name), '');
    v_landlord_id := coalesce(t.apt_landlord_id, (select landlord_id from public.tenancies where id = t.id));

    <<candidate_months>>
    for v_offset in -1 .. 1 loop
      v_month_anchor := (date_trunc('month', v_today::timestamp) + make_interval(months => v_offset))::date;
      v_last_day := extract(day from (v_month_anchor + interval '1 month - 1 day'))::int;
      v_due := v_month_anchor + least(t.rent_due_day, v_last_day)::int - 1;

      if v_today = v_due - 3 then
        v_kind := 'upcoming';
      elsif v_today = v_due then
        v_kind := 'due';
      elsif v_today = v_due + 1 then
        v_kind := 'overdue';
      else
        continue candidate_months;
      end if;

      -- Never remind about a cycle that starts before the lease begins.
      continue candidate_months when v_due < t.lease_start;

      -- Unpaid = paid payments overlapping this calendar-month cycle do not
      -- cover the full monthly rent (mirrors the client's checkout guard).
      select coalesce(sum(p.amount), 0) into v_paid
      from public.payment p
      where p.tenancy_id = t.id
        and p.status = 'paid'
        and p.period_start <= (v_month_anchor + interval '1 month - 1 day')::date
        and coalesce(p.period_end, p.period_start) >= v_month_anchor;

      continue candidate_months when v_paid >= t.monthly_rent;

      -- Idempotency: only notify when this ledger row is brand new.
      insert into public.rent_reminders (tenancy_id, due_date, kind)
      values (t.id, v_due, v_kind)
      on conflict (tenancy_id, due_date, kind) do nothing
      returning id into v_reminder_id;

      continue candidate_months when v_reminder_id is null;

      v_amount_text := '₱' || to_char(t.monthly_rent, 'FM999,999,999.00');
      v_due_label := to_char(v_due, 'FMMonth FMDD');
      v_period_label := to_char(v_month_anchor, 'FMMonth');
      v_payload := jsonb_build_object(
        'screen', 'payments',
        'apartmentId', t.apartment_id,
        'dueDate', to_char(v_due, 'YYYY-MM-DD')
      );

      if v_kind = 'upcoming' then
        v_tenant_title := 'Rent Due Soon';
        v_tenant_message := 'Your ' || v_amount_text || ' rent for ' || v_period_label || ' is due on ' || v_due_label || '.';
        v_landlord_title := 'Tenant Rent Due Soon';
        v_landlord_message := coalesce(v_tenant_name, 'Your tenant')
          || '''s rent for ' || t.apartment_name || ' is due on ' || v_due_label || '.';
      elsif v_kind = 'due' then
        v_tenant_title := 'Rent Due Today';
        v_tenant_message := 'Your ' || v_amount_text || ' rent for ' || v_period_label || ' is due today.';
        v_landlord_title := 'Tenant Rent Due Today';
        v_landlord_message := coalesce(v_tenant_name, 'Your tenant')
          || '''s rent for ' || t.apartment_name || ' is due today.';
      else
        v_tenant_title := 'Rent Past Due';
        v_tenant_message := 'Your ' || v_amount_text || ' rent was due on ' || v_due_label || '. Please settle your balance.';
        v_landlord_title := 'Tenant Rent Overdue';
        v_landlord_message := coalesce(v_tenant_name, 'Your tenant')
          || '''s rent for ' || t.apartment_name || ' was due on ' || v_due_label || '.';
      end if;

      perform public.create_notification(
        t.tenant_id,
        'payment',
        v_tenant_title,
        v_tenant_message,
        v_payload
      );

      if v_landlord_id is not null and v_landlord_id <> t.tenant_id then
        perform public.create_notification(
          v_landlord_id,
          'payment',
          v_landlord_title,
          v_landlord_message,
          v_payload
        );
      end if;
    end loop candidate_months;
  end loop;
end;
$function$;

-- Same lockdown as create_notification(): server-only entry point.
revoke execute on function public.notify_rent_due_status() from anon, authenticated;

select cron.schedule(
  'rent-due-reminders',
  '0 1 * * *',
  $$select public.notify_rent_due_status()$$
);
