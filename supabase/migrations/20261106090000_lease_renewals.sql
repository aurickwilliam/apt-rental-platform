-- Additive, opt-in lease renewal. Apply only through an approved deployment.
-- Existing tenancy terms/payment rows are not rewritten. Scheduler remains off
-- until the matching functions and both clients have been released.
begin;

alter table public.tenancies add column renewal_ended_at timestamptz;

create table public.tenancy_lease_terms (
  id uuid primary key default gen_random_uuid(),
  tenancy_id uuid not null references public.tenancies(id),
  lease_start date not null,
  lease_end date not null check (lease_end >= lease_start),
  monthly_rent numeric(14,2) not null check (monthly_rent > 0),
  deposit_target numeric(14,2),
  original boolean not null default false,
  created_at timestamptz not null default now(),
  unique (tenancy_id, lease_start)
);
create unique index tenancy_lease_terms_original_idx on public.tenancy_lease_terms(tenancy_id) where original;
create index tenancy_lease_terms_period_idx on public.tenancy_lease_terms(tenancy_id, lease_start desc);

create table public.lease_renewals (
  id uuid primary key default gen_random_uuid(),
  tenancy_id uuid not null references public.tenancies(id),
  source_term_id uuid not null references public.tenancy_lease_terms(id),
  status text not null check (status in ('pending_landlord_review','awaiting_payment_configuration',
    'awaiting_tenant_confirmation','awaiting_agreement_confirmation','awaiting_payment',
    'payment_verification_pending','renewed','declined','not_renewing','requires_review')),
  requested_start date not null,
  duration_months integer check (duration_months between 1 and 120),
  version integer not null default 1,
  current_proposal_id uuid,
  completed_term_id uuid references public.tenancy_lease_terms(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(source_term_id)
);
create index lease_renewals_tenancy_idx on public.lease_renewals(tenancy_id,created_at desc);

create table public.lease_renewal_proposals (
  id uuid primary key default gen_random_uuid(),
  renewal_id uuid not null references public.lease_renewals(id),
  version integer not null,
  lease_start date not null,
  lease_end date not null check (lease_end >= lease_start),
  duration_months integer not null check (duration_months between 1 and 120),
  monthly_rent numeric(14,2) not null check (monthly_rent >= 1000),
  deposit_target numeric(14,2) not null check (deposit_target >= 0 and deposit_target <= monthly_rent * 2),
  retained_deposit numeric(14,2) not null check (retained_deposit between 0 and deposit_target),
  replenishment_kind text not null check (replenishment_kind in ('none','partial','full')),
  replenishment_reason text not null default '' check (length(replenishment_reason) <= 1000),
  deposit_due numeric(14,2) generated always as (deposit_target-retained_deposit) stored,
  advance_months integer not null check (advance_months in (0,1)),
  advance_period date not null,
  advance_credit numeric(14,2) not null check (advance_credit >= 0),
  advance_due numeric(14,2) not null check (advance_due >= 0),
  evidence_path text,
  created_at timestamptz not null default now(),
  unique(renewal_id,version),
  check (advance_credit + advance_due = monthly_rent * advance_months),
  check ((replenishment_kind='none' and retained_deposit=deposit_target)
    or (replenishment_kind='partial' and retained_deposit>0 and retained_deposit<deposit_target)
    or (replenishment_kind='full' and retained_deposit=0 and deposit_target>0)),
  check (retained_deposit=deposit_target or length(btrim(replenishment_reason))>0)
);
alter table public.lease_renewals add constraint lease_renewals_proposal_fkey
  foreign key(current_proposal_id) references public.lease_renewal_proposals(id);

create table public.lease_renewal_agreements (
  proposal_id uuid primary key references public.lease_renewal_proposals(id),
  path text not null unique,
  landlord_confirmed_at timestamptz,
  tenant_confirmed_at timestamptz,
  created_at timestamptz not null default now()
);
create table public.lease_renewal_events (
  id uuid primary key default gen_random_uuid(),
  renewal_id uuid not null references public.lease_renewals(id),
  proposal_id uuid references public.lease_renewal_proposals(id),
  actor_id uuid references public.users(id),
  event text not null,
  reason text not null default '' check(length(reason)<=1000),
  created_at timestamptz not null default now()
);
create index lease_renewal_events_renewal_idx on public.lease_renewal_events(renewal_id,created_at,id);
create table app_private.lease_renewal_reminders (
  tenancy_id uuid not null references public.tenancies(id),
  lease_end date not null,
  milestone integer not null check(milestone in (60,30,14,7)),
  created_at timestamptz not null default now(),
  primary key(tenancy_id,lease_end,milestone)
);

-- Access always resolves the internal profile id and both consumer memberships.
create function app_private.renewal_member(p_tenancy uuid, p_portal text default null)
returns boolean language sql stable security definer set search_path='' as $$
  select exists(select 1 from public.tenancies t join public.users u on u.user_id=(select auth.uid())
    where t.id=p_tenancy and app_private.is_active_user()
      and ((p_portal is distinct from 'landlord' and t.tenant_id=u.id and 'tenant'=any(u.roles))
        or (p_portal is distinct from 'tenant' and t.landlord_id=u.id and 'landlord'=any(u.roles))));
$$;
revoke all on function app_private.renewal_member(uuid,text) from public,anon;
grant execute on function app_private.renewal_member(uuid,text) to authenticated;

alter table public.tenancy_lease_terms enable row level security;
alter table public.lease_renewals enable row level security;
alter table public.lease_renewal_proposals enable row level security;
alter table public.lease_renewal_agreements enable row level security;
alter table public.lease_renewal_events enable row level security;
alter table app_private.lease_renewal_reminders enable row level security;
revoke all on public.tenancy_lease_terms,public.lease_renewals,public.lease_renewal_proposals,
  public.lease_renewal_agreements,public.lease_renewal_events from public,anon,authenticated;
grant select on public.tenancy_lease_terms,public.lease_renewals,public.lease_renewal_proposals,
  public.lease_renewal_agreements,public.lease_renewal_events to authenticated;
create policy renewal_term_read on public.tenancy_lease_terms for select to authenticated
  using ((select app_private.renewal_member(tenancy_id)));
create policy renewal_read on public.lease_renewals for select to authenticated
  using ((select app_private.renewal_member(tenancy_id)));
create policy renewal_proposal_read on public.lease_renewal_proposals for select to authenticated
  using (exists(select 1 from public.lease_renewals r where r.id=renewal_id));
create policy renewal_agreement_read on public.lease_renewal_agreements for select to authenticated
  using (exists(select 1 from public.lease_renewal_proposals p where p.id=proposal_id));
create policy renewal_event_read on public.lease_renewal_events for select to authenticated
  using (exists(select 1 from public.lease_renewals r where r.id=renewal_id));

-- Protected private files: clients cannot remove referenced evidence/contracts.
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values('lease-renewals','lease-renewals',false,10485760,array['application/pdf','image/jpeg','image/png','image/webp']);
create function app_private.renewal_file_access(p_path text,p_write boolean)
returns boolean language sql stable security definer set search_path='' as $$
  select exists(select 1 from public.lease_renewals r join public.tenancies t on t.id=r.tenancy_id
    join public.users u on u.user_id=(select auth.uid())
    where r.id::text=split_part(p_path,'/',1) and app_private.is_active_user()
      and ((p_write and t.landlord_id=u.id and 'landlord'=any(u.roles) and u.account_status='verified'
        and t.status='active' and r.status in ('awaiting_payment_configuration','awaiting_tenant_confirmation',
          'awaiting_agreement_confirmation','awaiting_payment'))
      or (not p_write and app_private.renewal_member(t.id) and (
        (t.landlord_id=u.id and 'landlord'=any(u.roles))
        or exists(select 1 from public.lease_renewal_proposals p where p.renewal_id=r.id and p.evidence_path=p_path)
        or exists(select 1 from public.lease_renewal_agreements a join public.lease_renewal_proposals p
          on p.id=a.proposal_id where p.renewal_id=r.id and a.path=p_path)))));
$$;
revoke all on function app_private.renewal_file_access(text,boolean) from public,anon;
grant execute on function app_private.renewal_file_access(text,boolean) to authenticated;
create policy renewal_file_read on storage.objects for select to authenticated
  using(bucket_id='lease-renewals' and (select app_private.renewal_file_access(name,false)));
create policy renewal_file_upload on storage.objects for insert to authenticated
  with check(bucket_id='lease-renewals' and (select app_private.renewal_file_access(name,true)));
-- No client UPDATE/DELETE policy: agreement history and uncertain uploads survive.

create function app_private.renewal_file_exists(p_path text,p_renewal uuid,p_proposal uuid)
returns boolean language sql stable security definer set search_path='' as $$
  select p_path is null or (split_part(p_path,'/',1)=p_renewal::text
    and split_part(p_path,'/',2)=p_proposal::text and exists(select 1 from storage.objects
      where bucket_id='lease-renewals' and name=p_path));
$$;
revoke all on function app_private.renewal_file_exists(text,uuid,uuid) from public,anon,authenticated;

-- Notifications remain server-only and portal-specific. Fixed email template.
alter table public.email_outbox drop constraint email_outbox_template_check;
alter table public.email_outbox add constraint email_outbox_template_check check(template in
  ('listing_hidden','listing_restored','listing_review_declined','account_suspended',
   'account_reactivated','warning','report_reviewed','lease_renewal_update'));
create function app_private.renewal_notice(p_tenancy uuid,p_renewal uuid,p_title text,p_body text)
returns void language plpgsql security definer set search_path='' as $$
declare t public.tenancies%rowtype; person record;
begin
  select * into strict t from public.tenancies where id=p_tenancy;
  for person in select t.tenant_id as id,'tenant'::text as portal union all select t.landlord_id,'landlord' loop
    if person.id is not null and exists(select 1 from public.users u where u.id=person.id and not u.is_suspended) then
      perform public.create_notification(person.id,'system',p_title,p_body,jsonb_build_object(
        'screen','leaseRenewal','audience',person.portal,'renewalId',p_renewal,'tenancyId',t.id,'apartmentId',t.apartment_id));
      perform app_private.queue_email(person.id,'lease_renewal_update',jsonb_build_object(
        'title',p_title,'body',p_body,'tenancyId',t.id,'portal',person.portal));
    end if;
  end loop;
end;
$$;
revoke all on function app_private.renewal_notice(uuid,uuid,text,text) from public,anon,authenticated;

-- Immutable original row remains authoritative outside explicitly renewed periods.
-- Rent reductions on a mid-month boundary start with the next full billing month.
create function app_private.renewal_rent(p_tenancy uuid,p_period date)
returns numeric language sql stable security definer set search_path='' as $$
  select case when (select auth.uid()) is null or app_private.renewal_member(p_tenancy) then coalesce((select lt.monthly_rent from public.tenancy_lease_terms lt where lt.tenancy_id=p_tenancy
    and not lt.original and lt.lease_start<=p_period order by lt.lease_start desc limit 1),
    (select monthly_rent from public.tenancies where id=p_tenancy)) end;
$$;
create function app_private.renewal_lease_end(p_tenancy uuid,p_today date)
returns date language sql stable security definer set search_path='' as $$
  select case when (select auth.uid()) is null or app_private.renewal_member(p_tenancy) then least(coalesce((select lt.lease_end from public.tenancy_lease_terms lt where lt.tenancy_id=p_tenancy
    and lt.lease_start<=p_today order by lt.lease_start desc limit 1),
    (select lease_end from public.tenancies where id=p_tenancy)),
    (select (renewal_ended_at at time zone 'Asia/Manila')::date from public.tenancies where id=p_tenancy)) end;
$$;
revoke all on function app_private.renewal_rent(uuid,date),app_private.renewal_lease_end(uuid,date) from public,anon,authenticated;
grant execute on function app_private.renewal_rent(uuid,date),app_private.renewal_lease_end(uuid,date) to authenticated;

create function app_private.renewal_paid_for_period(p_tenancy uuid,p_period date)
returns numeric language sql stable security definer set search_path='' as $$
  select case when (select auth.uid()) is null or app_private.renewal_member(p_tenancy)
    then app_private.rent_paid_for_period(p_tenancy,p_period) end;
$$;
revoke all on function app_private.renewal_paid_for_period(uuid,date) from public,anon;
grant execute on function app_private.renewal_paid_for_period(uuid,date) to authenticated;

create function app_private.finish_lease_renewal(p_renewal uuid)
returns void language plpgsql security definer set search_path='' as $$
declare r public.lease_renewals%rowtype; p public.lease_renewal_proposals%rowtype;
  a public.lease_renewal_agreements%rowtype; t public.tenancies%rowtype; term uuid; paid boolean;
begin
  -- All write paths lock tenancy first, then renewal, then proposal/payment.
  select t0.* into strict t from public.tenancies t0 join public.lease_renewals r0 on r0.tenancy_id=t0.id
    where r0.id=p_renewal for update of t0;
  select * into strict r from public.lease_renewals where id=p_renewal for update;
  if r.status='renewed' then return; end if;
  select * into strict p from public.lease_renewal_proposals where id=r.current_proposal_id;
  select * into a from public.lease_renewal_agreements where proposal_id=p.id;
  if a.tenant_confirmed_at is null or a.landlord_confirmed_at is null then raise exception 'Both parties must confirm the agreement.'; end if;
  select exists(select 1 from public.payment where renewal_proposal_id=p.id and status='paid') into paid;
  if p.advance_due+p.deposit_due>0 and not paid then raise exception 'Renewal payment has not been verified.'; end if;
  if t.status<>'active' or r.status not in ('awaiting_payment','payment_verification_pending')
    or exists(select 1 from public.users u where u.id in(t.tenant_id,t.landlord_id) and (u.is_suspended or u.account_status<>'verified'))
    or p.lease_start<(now() at time zone 'Asia/Manila')::date then
    update public.lease_renewals set status='requires_review',version=version+1,updated_at=now() where id=r.id;
    perform app_private.renewal_notice(t.id,r.id,'Renewal requires review','The renewal needs review before its terms can take effect. Your existing tenancy has not been ended.');
    return;
  end if;
  if exists(select 1 from public.tenancy_lease_terms lt where lt.tenancy_id=t.id
    and daterange(lt.lease_start,lt.lease_end,'[]') && daterange(p.lease_start,p.lease_end,'[]')) then
    raise exception 'The renewal period overlaps an existing agreed lease.';
  end if;
  insert into public.tenancy_lease_terms(tenancy_id,lease_start,lease_end,monthly_rent,deposit_target)
    values(t.id,p.lease_start,p.lease_end,p.monthly_rent,p.deposit_target) returning id into term;
  update public.lease_renewals set status='renewed',completed_term_id=term,version=version+1,updated_at=now() where id=r.id;
  insert into public.lease_renewal_events(renewal_id,proposal_id,event) values(r.id,p.id,'renewed');
  perform app_private.renewal_notice(t.id,r.id,'Lease renewal completed','Your agreed renewal is confirmed. It takes effect on '||p.lease_start::text||'.');
end;
$$;

alter table public.payment add column renewal_proposal_id uuid references public.lease_renewal_proposals(id);
alter table public.payment drop constraint payment_billing_kind_check;
alter table public.payment add constraint payment_billing_kind_check check(billing_kind in ('move_in','monthly','fees','lease_renewal'));
create unique index payment_one_paid_renewal_idx on public.payment(renewal_proposal_id) where status='paid';
create unique index payment_one_pending_renewal_idx on public.payment(renewal_proposal_id) where status='pending';
alter table public.payment add constraint payment_renewal_link_check check(
  (billing_kind='lease_renewal' and renewal_proposal_id is not null)
  or (renewal_proposal_id is null and billing_kind is distinct from 'lease_renewal'));

create function app_private.guard_renewal_payment(p_new public.payment,p_old public.payment,p_operation text)
returns public.payment language plpgsql security definer set search_path='' as $$
declare r public.lease_renewals%rowtype; p public.lease_renewal_proposals%rowtype;
  t public.tenancies%rowtype; a public.lease_renewal_agreements%rowtype; credit numeric;
begin
  if p_operation='UPDATE' then
    if p_new.renewal_proposal_id is distinct from p_old.renewal_proposal_id then raise exception 'Payment renewal linkage cannot be changed.'; end if;
    return p_new; -- Existing payment UPDATE guard still checks ownership/allocations/status.
  end if;
  select * into strict t from public.tenancies where id=p_new.tenancy_id for update;
  select * into strict p from public.lease_renewal_proposals where id=p_new.renewal_proposal_id;
  select * into strict r from public.lease_renewals where id=p.renewal_id for update;
  select * into a from public.lease_renewal_agreements where proposal_id=p.id;
  if r.tenancy_id<>t.id or r.current_proposal_id<>p.id or r.status<>'awaiting_payment'
    or t.status<>'active' or p_new.tenant_id is distinct from t.tenant_id or p_new.apartment_id is distinct from t.apartment_id
    or p_new.status is distinct from 'pending' or a.tenant_confirmed_at is null or a.landlord_confirmed_at is null then
    raise exception 'This renewal is not ready for payment.';
  end if;
  if exists(select 1 from public.users u where u.id in(t.tenant_id,t.landlord_id) and (u.is_suspended or u.account_status<>'verified')) then
    raise exception 'Both participants must have active verified accounts to complete renewal.';
  end if;
  if (select auth.uid()) is not null and not app_private.renewal_member(t.id,'tenant') then raise exception 'Only this tenant can pay for renewal.'; end if;
  if p_new.method<>'cash' and coalesce((select auth.jwt()->>'role'),'')<>'service_role' then raise exception 'Start online payments through checkout.'; end if;
  if not app_private.landlord_accepts_payment_method(t.landlord_id,p_new.method) then raise exception 'Your landlord does not accept this payment method.'; end if;
  credit:=least(p.monthly_rent*p.advance_months,app_private.rent_paid_for_period(t.id,p.advance_period));
  if credit<>p.advance_credit then raise exception 'Applicable payments have changed. Ask your landlord to revise the proposal before paying.'; end if;
  if p_new.amount is distinct from p.advance_due+p.deposit_due or p_new.amount<=0
    or p_new.period_start is distinct from p.advance_period then raise exception 'Refresh the renewal bill before paying.'; end if;
  if p.lease_end<(now() at time zone 'Asia/Manila')::date then raise exception 'This renewal requires review before payment.'; end if;
  if exists(select 1 from public.payment where tenancy_id=t.id and status='pending') then raise exception 'A payment is already awaiting confirmation. Check it before paying again.'; end if;
  p_new.billing_kind:='lease_renewal'; p_new.landlord_id:=t.landlord_id;
  p_new.rent_amount:=0; p_new.deposit_amount:=p.deposit_due; p_new.advance_amount:=p.advance_due;
  p_new.maintenance_amount:=0; p_new.maintenance_fee_ids:='{}';
  p_new.advance_period_start:=p.advance_period;
  p_new.advance_period_end:=(p.advance_period+interval '1 month - 1 day')::date;
  p_new.period_end:=p_new.advance_period_end; p_new.due_date:=p.lease_start;
  update public.lease_renewals set status='payment_verification_pending',version=version+1,updated_at=now() where id=r.id;
  return p_new;
end;
$$;
revoke all on function app_private.guard_renewal_payment(public.payment,public.payment,text),app_private.finish_lease_renewal(uuid) from public,anon,authenticated;

-- Preserve the existing guards verbatim except for the narrow renewal branch.
do $$
declare body text; needle text;
begin
  body:=pg_get_functiondef('app_private.guard_payment_billing()'::regprocedure);
  needle:='  select * into t from public.tenancies where id = new.tenancy_id for update;';
  if strpos(body,needle)=0 then raise exception 'Payment guard drift: review before installing renewal.'; end if;
  body:=replace(body,needle,needle||E'\n  if tg_op = ''UPDATE'' then\n    new := app_private.guard_renewal_payment(new,old,tg_op);\n  elsif new.renewal_proposal_id is not null then\n    return app_private.guard_renewal_payment(new,null::public.payment,tg_op);\n  end if;');
  execute body;
end;
$$;

create function app_private.renewal_payment_settled()
returns trigger language plpgsql security definer set search_path='' as $$
declare r uuid;
begin
  if new.renewal_proposal_id is null or (tg_op='UPDATE' and old.status is not distinct from new.status) then return new; end if;
  select renewal_id into r from public.lease_renewal_proposals where id=new.renewal_proposal_id;
  if new.status='paid' then perform app_private.finish_lease_renewal(r);
  elsif new.status in ('failed','rejected') then
    update public.lease_renewals set status='awaiting_payment',version=version+1,updated_at=now()
      where id=r and status='payment_verification_pending';
  end if;
  return new;
end;
$$;
revoke all on function app_private.renewal_payment_settled() from public,anon,authenticated;
create trigger renewal_payment_settled after insert or update of status on public.payment
  for each row execute function app_private.renewal_payment_settled();

-- One caller-bound command boundary; clients cannot write workflow tables.
create function public.act_on_lease_renewal(p_tenancy_id uuid,p_portal text,p_action text,p_expected_version integer,p_payload jsonb default '{}')
returns void language plpgsql security definer set search_path='' as $$
declare t public.tenancies%rowtype; source public.tenancy_lease_terms%rowtype;
  r public.lease_renewals%rowtype; p public.lease_renewal_proposals%rowtype;
  actor public.users%rowtype; proposal uuid; months integer; rent numeric; retained numeric;
  kind text; reason text; start_on date; period date; credit numeric; evidence text; path text;
  today date:=(now() at time zone 'Asia/Manila')::date;
begin
  if p_portal not in ('tenant','landlord') or p_portal is null or not app_private.renewal_member(p_tenancy_id,p_portal) then raise exception 'You cannot manage this renewal.'; end if;
  select * into strict actor from public.users where user_id=(select auth.uid());
  select * into strict t from public.tenancies where id=p_tenancy_id for update;
  if t.status<>'active' then raise exception 'Only an active tenancy can be renewed.'; end if;
  if t.tenant_id=t.landlord_id then raise exception 'You cannot renew a lease for your own listing.'; end if;
  if actor.account_status<>'verified' then raise exception 'Verify your account to renew a lease.'; end if;
  if exists(select 1 from public.users u where u.id in (t.tenant_id,t.landlord_id) and u.is_suspended) then raise exception 'This renewal cannot proceed while a participant is suspended.'; end if;
  select * into source from public.tenancy_lease_terms where tenancy_id=t.id order by lease_start desc limit 1;
  if source.id is null then
    if t.lease_end is null or t.monthly_rent is null then raise exception 'Confirm the original lease dates and rent before renewal.'; end if;
    insert into public.tenancy_lease_terms(tenancy_id,lease_start,lease_end,monthly_rent,deposit_target,original)
      values(t.id,t.lease_start,t.lease_end,t.monthly_rent,t.security_deposit,true) returning * into source;
  end if;
  if source.lease_start>today then raise exception 'A future renewal is already scheduled.'; end if;
  select * into r from public.lease_renewals where source_term_id=source.id for update;
  if p_action in ('request','not_renewing') then
    if p_portal<>'tenant' then raise exception 'Only the tenant can make this choice.'; end if;
    if source.lease_end-today not between 0 and 30 then raise exception 'Renewal requests open during the final 30 days of the agreed lease.'; end if;
    if r.id is not null then raise exception 'A renewal decision already exists for this lease. Open its details.'; end if;
    if p_action='request' and t.billing_version=1 and not exists(select 1 from public.payment where tenancy_id=t.id and billing_kind='move_in' and status='paid') then
      raise exception 'Settle the original move-in bill before requesting renewal.';
    end if;
    months:=null;
    if p_action='request' then
      months:=(p_payload->>'durationMonths')::integer;
      if months is null then
        select m into months from generate_series(1,120) m where (source.lease_start+make_interval(months=>m))::date in (source.lease_end,source.lease_end+1) order by m limit 1;
      end if;
      if months is null or months not between 1 and 120 then raise exception 'Confirm the previous lease duration in months.'; end if;
    end if;
    insert into public.lease_renewals(tenancy_id,source_term_id,status,requested_start,duration_months)
      values(t.id,source.id,case when p_action='request' then 'pending_landlord_review' else 'not_renewing' end,source.lease_end+1,months) returning * into r;
  else
    if r.id is null or r.version is distinct from p_expected_version then raise exception 'The renewal has changed. Refresh before continuing.'; end if;
    if source.lease_end<today then raise exception 'The lease renewal deadline has passed. This request requires review.'; end if;
    if exists(select 1 from public.payment pay join public.lease_renewal_proposals pp on pp.id=pay.renewal_proposal_id where pp.renewal_id=r.id and pay.status in ('pending','paid')) then
      raise exception 'The renewal payment must be reconciled before changing its terms.';
    end if;
    reason:=btrim(coalesce(p_payload->>'reason',''));
    if length(reason)>1000 then raise exception 'Keep the reason within 1,000 characters.'; end if;
    if p_action='approve' then
      if p_portal<>'landlord' or r.status<>'pending_landlord_review' then raise exception 'This request cannot be approved now.'; end if;
      update public.lease_renewals set status='awaiting_payment_configuration' where id=r.id;
    elsif p_action='decline' then
      if r.status not in ('pending_landlord_review','awaiting_payment_configuration','awaiting_tenant_confirmation','awaiting_agreement_confirmation','awaiting_payment') or reason='' then raise exception 'Provide a reason for declining an unresolved renewal.'; end if;
      update public.lease_renewals set status='declined' where id=r.id;
    elsif p_action='propose' then
      if p_portal<>'landlord' or r.status not in ('awaiting_payment_configuration','awaiting_tenant_confirmation','awaiting_agreement_confirmation','awaiting_payment') then raise exception 'This renewal cannot be revised now.'; end if;
      proposal:=(p_payload->>'proposalId')::uuid; months:=(p_payload->>'durationMonths')::integer;
      rent:=(p_payload->>'monthlyRent')::numeric; retained:=(p_payload->>'retainedDeposit')::numeric;
      start_on:=(p_payload->>'leaseStart')::date; kind:=p_payload->>'replenishmentKind';
      evidence:=nullif(p_payload->>'evidencePath','');
      if proposal is null or months is null or months not between 1 and 120 or start_on is distinct from source.lease_end+1
        or rent is null or rent<1000 or rent>source.monthly_rent or rent<>round(rent,2)
        or source.deposit_target is null or source.deposit_target>rent*2
        or retained is null or retained<>round(retained,2) or retained not between 0 and source.deposit_target then
        raise exception 'Check renewal dates, rent and the existing deposit. Rent increases and a second original deposit are not allowed.';
      end if;
      if not app_private.renewal_file_exists(evidence,r.id,proposal) then raise exception 'Upload evidence to this renewal proposal before submitting.'; end if;
      -- First full calendar month avoids duplicate/prorated charges at a mid-month boundary.
      period:=case when extract(day from start_on)=1 then start_on else (date_trunc('month',start_on)+interval '1 month')::date end;
      if (start_on+make_interval(months=>months)-interval '1 day')::date<(period+interval '1 month - 1 day')::date and (p_payload->>'advanceMonths')::integer=1 then raise exception 'A full advance month must be inside the renewed lease. Choose no advance for this shorter period.'; end if;
      credit:=least(rent*coalesce((p_payload->>'advanceMonths')::integer,0),app_private.rent_paid_for_period(t.id,period));
      insert into public.lease_renewal_proposals(id,renewal_id,version,lease_start,lease_end,duration_months,monthly_rent,
        deposit_target,retained_deposit,replenishment_kind,replenishment_reason,advance_months,advance_period,advance_credit,advance_due,evidence_path)
      values(proposal,r.id,r.version+1,start_on,(start_on+make_interval(months=>months)-interval '1 day')::date,months,rent,
        source.deposit_target,retained,kind,reason,(p_payload->>'advanceMonths')::integer,period,credit,
        rent*(p_payload->>'advanceMonths')::integer-credit,evidence);
      update public.lease_renewals set status='awaiting_tenant_confirmation',current_proposal_id=proposal where id=r.id;
    elsif p_action='accept' then
      if p_portal<>'tenant' or r.status<>'awaiting_tenant_confirmation' or r.current_proposal_id::text is distinct from p_payload->>'proposalId' then raise exception 'Review the latest proposal before accepting.'; end if;
      update public.lease_renewals set status='awaiting_agreement_confirmation' where id=r.id;
    elsif p_action='agreement' then
      if p_portal<>'landlord' or r.status<>'awaiting_agreement_confirmation' then raise exception 'The accepted terms need a landlord agreement upload.'; end if;
      path:=nullif(p_payload->>'path','');
      if path is null or not app_private.renewal_file_exists(path,r.id,r.current_proposal_id) then raise exception 'Upload the executed agreement for this proposal.'; end if;
      insert into public.lease_renewal_agreements(proposal_id,path) values(r.current_proposal_id,path);
    elsif p_action='confirm_agreement' then
      if r.status<>'awaiting_agreement_confirmation' or r.current_proposal_id::text is distinct from p_payload->>'proposalId' then raise exception 'Confirm the latest agreement only.'; end if;
      if not exists(select 1 from public.lease_renewal_agreements agreement where agreement.proposal_id=r.current_proposal_id and agreement.path=p_payload->>'path') then raise exception 'Open the current agreement before confirming.'; end if;
      update public.lease_renewal_agreements set
        landlord_confirmed_at=case when p_portal='landlord' then coalesce(landlord_confirmed_at,now()) else landlord_confirmed_at end,
        tenant_confirmed_at=case when p_portal='tenant' then coalesce(tenant_confirmed_at,now()) else tenant_confirmed_at end
        where proposal_id=r.current_proposal_id;
      if exists(select 1 from public.lease_renewal_agreements where proposal_id=r.current_proposal_id and landlord_confirmed_at is not null and tenant_confirmed_at is not null) then
        update public.lease_renewals set status='awaiting_payment' where id=r.id;
        select * into strict p from public.lease_renewal_proposals where id=r.current_proposal_id;
        if p.advance_due+p.deposit_due=0 then perform app_private.finish_lease_renewal(r.id); end if;
      end if;
    else raise exception 'Unknown renewal action.';
    end if;
    update public.lease_renewals set version=version+1,updated_at=now() where id=r.id;
  end if;
  insert into public.lease_renewal_events(renewal_id,proposal_id,actor_id,event,reason)
    select id,current_proposal_id,actor.id,p_action,coalesce(reason,'') from public.lease_renewals where id=r.id;
  perform app_private.renewal_notice(t.id,r.id,'Lease renewal update',case p_action
    when 'not_renewing' then 'The tenant has confirmed an intention not to renew. The current lease has not been ended.'
    when 'request' then 'A lease renewal was requested. The landlord can now review it.'
    when 'propose' then 'Renewal terms are ready for tenant review. Opening chat does not accept these terms.'
    when 'decline' then 'The renewal was declined. The current lease has not been ended.'
    else 'Your renewal has been updated. Open its details to review the next step.' end);
end;
$$;
revoke all on function public.act_on_lease_renewal(uuid,text,text,integer,jsonb) from public,anon;
grant execute on function public.act_on_lease_renewal(uuid,text,text,integer,jsonb) to authenticated;

create function public.get_lease_renewal(p_tenancy_id uuid,p_portal text)
returns jsonb language plpgsql stable security definer set search_path='' as $$
declare t public.tenancies%rowtype; r public.lease_renewals%rowtype; term public.tenancy_lease_terms%rowtype;
begin
  if p_portal not in ('tenant','landlord') or p_portal is null or not app_private.renewal_member(p_tenancy_id,p_portal) then raise exception 'You cannot view this renewal.'; end if;
  select * into strict t from public.tenancies where id=p_tenancy_id;
  select * into term from public.tenancy_lease_terms where tenancy_id=t.id and lease_start<=(now() at time zone 'Asia/Manila')::date order by lease_start desc limit 1;
  select * into r from public.lease_renewals where tenancy_id=t.id order by created_at desc,id desc limit 1;
  if r.status='renewed' and r.completed_term_id=term.id and term.lease_end-(now() at time zone 'Asia/Manila')::date between 0 and 30 then r:=null; end if;
  return jsonb_build_object('tenancyId',t.id,'apartmentId',t.apartment_id,'tenantId',t.tenant_id,'landlordId',t.landlord_id,
    'apartmentName',(select name from public.apartments where id=t.apartment_id),
    'tenantName',(select btrim(coalesce(first_name,'')||' '||coalesce(last_name,'')) from public.users where id=t.tenant_id),
    'active',t.status='active','today',(now() at time zone 'Asia/Manila')::date,
    'leaseStart',coalesce(term.lease_start,t.lease_start),'leaseEnd',coalesce(term.lease_end,t.lease_end),
    'monthlyRent',coalesce(term.monthly_rent,t.monthly_rent),'depositTarget',case when term.id is null then t.security_deposit else term.deposit_target end,
    'originalAgreementPath',t.signed_lease_path,'renewal',case when r.id is null then null else to_jsonb(r) end,
    'proposals',coalesce((select jsonb_agg(to_jsonb(p)||jsonb_build_object('agreement_path',(select path from public.lease_renewal_agreements where proposal_id=p.id)) order by p.created_at desc,p.id desc)
      from public.lease_renewal_proposals p where p.renewal_id in(select id from public.lease_renewals where tenancy_id=t.id)),'[]'),
    'agreement',(select to_jsonb(a) from public.lease_renewal_agreements a where a.proposal_id=r.current_proposal_id),
    'events',coalesce((select jsonb_agg(to_jsonb(e) order by created_at desc,id desc) from
      (select * from public.lease_renewal_events where renewal_id in(select id from public.lease_renewals where tenancy_id=t.id) order by created_at desc,id desc limit 100) e),'[]'),
    'payment',(select jsonb_build_object('id',pay.id,'status',pay.status,'referenceId',pay.reference_id,'sessionId',pay.paymongo_session_id)
      from public.payment pay where pay.renewal_proposal_id=r.current_proposal_id order by pay.created_at desc,pay.id desc limit 1));
end;
$$;
revoke all on function public.get_lease_renewal(uuid,text) from public,anon;
grant execute on function public.get_lease_renewal(uuid,text) to authenticated;

create function public.list_lease_renewals(p_before timestamptz default null,p_before_id uuid default null)
returns jsonb language plpgsql stable security definer set search_path='' as $$
declare owner_id uuid;
begin
  select id into owner_id from public.users where user_id=(select auth.uid()) and 'landlord'=any(roles)
    and account_status='verified' and app_private.is_active_user();
  if owner_id is null then raise exception 'Verified landlord access required.'; end if;
  return coalesce((select jsonb_agg(to_jsonb(item) order by item.updated_at desc,item.id desc) from (
    select r.id,r.tenancy_id,r.status,r.updated_at,a.name as apartment_name,
      btrim(coalesce(u.first_name,'')||' '||coalesce(u.last_name,'')) as tenant_name
    from public.lease_renewals r join public.tenancies t on t.id=r.tenancy_id
      join public.apartments a on a.id=t.apartment_id join public.users u on u.id=t.tenant_id
    where t.landlord_id=owner_id and (p_before is null or (r.updated_at,r.id)<(p_before,p_before_id))
    order by r.updated_at desc,r.id desc limit 26
  ) item),'[]');
end;
$$;
revoke all on function public.list_lease_renewals(timestamptz,uuid) from public,anon;
grant execute on function public.list_lease_renewals(timestamptz,uuid) to authenticated;

-- Read-only compatibility projection; keep occupancy start and original terms intact.
create function public.get_effective_lease_terms(p_tenancy_id uuid)
returns jsonb language plpgsql stable security definer set search_path='' as $$
declare t public.tenancies%rowtype; lt public.tenancy_lease_terms%rowtype; agreement text;
begin
  if not app_private.renewal_member(p_tenancy_id) then raise exception 'You cannot view these lease terms.'; end if;
  select * into strict t from public.tenancies where id=p_tenancy_id;
  select * into lt from public.tenancy_lease_terms where tenancy_id=t.id and lease_start<=(now() at time zone 'Asia/Manila')::date order by lease_start desc limit 1;
  if lt.id is not null and not lt.original then
    select a.path into agreement from public.lease_renewals r join public.lease_renewal_agreements a
      on a.proposal_id=r.current_proposal_id where r.completed_term_id=lt.id;
  end if;
  return jsonb_build_object('leaseEnd',coalesce(lt.lease_end,t.lease_end),
    'monthlyRent',app_private.renewal_rent(t.id,date_trunc('month',now() at time zone 'Asia/Manila')::date),
    'renewalAgreementPath',agreement);
end;
$$;
revoke all on function public.get_effective_lease_terms(uuid) from public,anon;
grant execute on function public.get_effective_lease_terms(uuid) to authenticated;

-- Preserve the exact historical calculator for non-renewed tenancies and move-in.
alter function app_private.tenancy_bill(uuid,date) rename to tenancy_bill_before_renewals;
create function app_private.tenancy_bill(p_tenancy_id uuid,p_today date)
returns jsonb language plpgsql volatile security definer set search_path='' as $$
declare b jsonb; lt public.tenancy_lease_terms%rowtype; t public.tenancies%rowtype;
  period date:=date_trunc('month',p_today)::date; rent numeric; paid numeric; fees numeric;
  fee_rows jsonb; due_on date; pending jsonb;
begin
  b:=app_private.tenancy_bill_before_renewals(p_tenancy_id,p_today);
  select * into lt from public.tenancy_lease_terms where tenancy_id=p_tenancy_id and not original
    and lease_start<=period order by lease_start desc limit 1;
  if lt.id is null or b->>'kind'='move_in' then return b; end if;
  select * into strict t from public.tenancies where id=p_tenancy_id;
  rent:=lt.monthly_rent; paid:=app_private.rent_paid_for_period(t.id,period);
  due_on:=period+least(t.rent_due_day,extract(day from (period+interval '1 month - 1 day'))::integer)-1;
  select coalesce(sum(fee_amount),0),coalesce(jsonb_agg(jsonb_build_object('id',id,'title',title,'amount',fee_amount)),'[]')
    into fees,fee_rows from public.maintenance_request where tenancy_id=t.id and fee_status='pending' and fee_amount>0;
  select jsonb_build_object('id',id,'referenceId',reference_id,'method',method) into pending
    from public.payment where tenancy_id=t.id and status='pending' limit 1;
  return jsonb_build_object('kind',case when paid>=rent then 'fees' else 'monthly' end,
    'periodStart',period,'periodEnd',(period+interval '1 month - 1 day')::date,'dueDate',due_on,
    'monthlyRent',rent,'rentDue',greatest(0,rent-paid),'securityDeposit',0,'advanceRent',0,
    'advancePeriodStart',null,'advancePeriodEnd',null,'fees',fee_rows,
    'totalDue',greatest(0,rent-paid)+fees,'rentPaid',paid>=rent,
    'coveredByAdvance',paid>=rent and exists(select 1 from public.payment where tenancy_id=t.id and status='paid' and advance_period_start=period and advance_amount>0),
    'pendingPayment',pending);
end;
$$;
revoke all on function app_private.tenancy_bill(uuid,date),app_private.tenancy_bill_before_renewals(uuid,date) from public,anon,authenticated;

-- Legacy tenancies stay legacy until a renewed full billing month is effective.
do $$
declare body text; needle text:='  if t.billing_version is null then';
begin
  body:=pg_get_functiondef('app_private.guard_payment_billing()'::regprocedure);
  if strpos(body,needle)=0 then raise exception 'Legacy payment guard drift: review renewal compatibility.'; end if;
  execute replace(body,needle,'  if t.billing_version is null and not exists(select 1 from public.tenancy_lease_terms lt where lt.tenancy_id=t.id and not lt.original and lt.lease_start<=date_trunc(''month'',now() at time zone ''Asia/Manila'')::date) then');
end;
$$;

-- Expiry never ends occupancy. Pending provider outcomes remain reconcilable.
create function app_private.check_lease_renewals(p_today date default (now() at time zone 'Asia/Manila')::date)
returns integer language plpgsql security definer set search_path='' as $$
declare candidate record; renewal public.lease_renewals%rowtype; days integer; milestone integer;
  count_sent integer:=0; inserted integer; today date:=p_today;
begin
  for candidate in select t.id,app_private.renewal_lease_end(t.id,today) as ending
    from public.tenancies t where t.status='active' and t.lease_end is not null
    and exists(select 1 from public.users u where u.id=t.tenant_id and not u.is_suspended)
    and exists(select 1 from public.users u where u.id=t.landlord_id and not u.is_suspended)
  loop
    -- Serialize reminder decisions with request/proposal/payment actions.
    perform 1 from public.tenancies where id=candidate.id for update;
    select * into renewal from public.lease_renewals where tenancy_id=candidate.id order by created_at desc,id desc limit 1;
    if renewal.id is not null and renewal.status in ('renewed','declined','not_renewing','requires_review') then
      -- A completed prior renewal must not suppress reminders for its successor term.
      if renewal.status<>'renewed' or exists(select 1 from public.tenancy_lease_terms where id=renewal.completed_term_id and lease_end<>candidate.ending) then continue; end if;
      renewal:=null;
    end if;
    days:=candidate.ending-today;
    if days<0 then
      if renewal.id is not null and renewal.status<>'payment_verification_pending' then
        update public.lease_renewals set status='requires_review',version=version+1,updated_at=now() where id=renewal.id;
        insert into public.lease_renewal_events(renewal_id,event) values(renewal.id,'deadline_passed');
        perform app_private.renewal_notice(candidate.id,renewal.id,'Renewal requires review','The lease date has passed without a completed renewal. Occupancy has not been automatically ended.');
      end if;
      continue;
    end if;
    milestone:=case when days<=7 then 7 when days<=14 then 14 when days<=30 then 30 when days<=60 then 60 end;
    if milestone is null then continue; end if;
    insert into app_private.lease_renewal_reminders(tenancy_id,lease_end,milestone)
      values(candidate.id,candidate.ending,milestone) on conflict do nothing;
    get diagnostics inserted=row_count;
    if inserted=1 then
      perform app_private.renewal_notice(candidate.id,renewal.id,'Lease ending soon',
        'The current agreed lease ends on '||candidate.ending::text||'. '||case when days>30 then 'Renewal requests open 30 days before expiry.'
        when renewal.id is null then 'Open the rental to request renewal or confirm that you will not renew.'
        else 'Open your renewal to review the outstanding step. No agreement or payment is accepted automatically.' end);
      count_sent:=count_sent+1;
    end if;
  end loop;
  return count_sent;
end;
$$;
revoke all on function app_private.check_lease_renewals(date) from public,anon,authenticated;

-- Installation prepares, but does not enable, delivery in production.
do $$
begin
  if to_regclass('cron.job') is not null then
    perform cron.schedule('lease-renewal-reminders','0 1 * * *','select app_private.check_lease_renewals()');
    perform cron.alter_job((select jobid from cron.job where jobname='lease-renewal-reminders'),active=>false);
  end if;
end;
$$;

-- Existing scheduled rent notices and maintenance attribution must follow renewed
-- dates. Refuse drift instead of replacing unrelated authorization logic.
do $$
declare body text;
begin
  body:=pg_get_functiondef('public.notify_rent_due_status()'::regprocedure);
  if strpos(body,'tn.lease_end >= v_today')=0 or strpos(body,'v_paid >= t.monthly_rent')=0 then
    raise exception 'Rent reminder drift: review effective renewal periods.';
  end if;
  body:=replace(body,'tn.lease_end >= v_today','app_private.renewal_lease_end(tn.id,v_today) >= v_today');
  body:=replace(body,'v_paid >= t.monthly_rent','v_paid >= app_private.renewal_rent(t.id,v_month_anchor)');
  body:=replace(body,$needle$to_char(t.monthly_rent, 'FM999,999,999.00')$needle$,$replacement$to_char(app_private.renewal_rent(t.id,v_month_anchor), 'FM999,999,999.00')$replacement$);
  execute body;
  body:=pg_get_functiondef('public.notify_payment_created()'::regprocedure);
  body:=replace(body,E'\r\n',E'\n');
  if strpos(body,E'\nbegin\n')=0 then raise exception 'Payment notification drift: review renewal wording.'; end if;
  execute replace(body,E'\nbegin\n',$replacement$
begin
  if NEW.renewal_proposal_id is not null then
    if TG_OP='UPDATE' and OLD.status is not distinct from NEW.status then return NEW; end if;
    perform app_private.renewal_notice(NEW.tenancy_id,
      (select renewal_id from public.lease_renewal_proposals where id=NEW.renewal_proposal_id),
      case when NEW.status='paid' then 'Renewal payment verified' else 'Renewal payment awaiting verification' end,
      case when NEW.status='paid' then 'The lease renewal payment was verified. Its advance and deposit replenishment remain separate components.'
        when NEW.method='cash' then 'A cash lease renewal payment is waiting for landlord confirmation. It is not marked paid yet.'
        else 'An online lease renewal payment is waiting for provider verification. Do not pay again while its outcome is uncertain.' end);
    return NEW;
  end if;
$replacement$);
  if to_regprocedure('app_private.guard_maintenance_fee()') is not null then
    body:=pg_get_functiondef('app_private.guard_maintenance_fee()'::regprocedure);
    if strpos(body,$needle$t.lease_end >= (new.created_at at time zone 'Asia/Manila')::date$needle$)=0 then
      raise exception 'Maintenance attribution drift: review renewed tenancy dates.';
    end if;
    execute replace(body,$needle$t.lease_end >= (new.created_at at time zone 'Asia/Manila')::date$needle$,
      $replacement$app_private.renewal_lease_end(t.id,(new.created_at at time zone 'Asia/Manila')::date) >= (new.created_at at time zone 'Asia/Manila')::date$replacement$);
  end if;
end;
$$;

-- Preserve finance authorization while resolving expected/paid rent per period.
create or replace function public.landlord_rent_ledger(p_month date,p_apartment_id uuid default null)
returns table(id uuid,apartment_id uuid,apartment_name text,tenant_name text,due_date date,
  expected numeric,collected numeric,outstanding numeric,days_late integer,status text)
language sql stable security invoker set search_path='' as $$
  with periods as (
    select t.id,t.apartment_id,a.name,btrim(coalesce(u.first_name,'')||' '||coalesce(u.last_name,'')) as tenant_name,
      coalesce(app_private.renewal_rent(t.id,date_trunc('month',p_month)::date),a.monthly_rent,0) as rent,
      date_trunc('month',p_month)::date+least(t.rent_due_day,extract(day from(date_trunc('month',p_month)+interval '1 month - 1 day'))::integer)-1 as due,
      t.lease_start,app_private.renewal_lease_end(t.id,(date_trunc('month',p_month)+interval '1 month - 1 day')::date) as lease_end
    from public.tenancies t join public.apartments a on a.id=t.apartment_id join public.users u on u.id=t.tenant_id
    where a.landlord_id=(select id from public.users where user_id=(select auth.uid()) and 'landlord'=any(roles))
      and a.deleted_at is null and (p_apartment_id is null or a.id=p_apartment_id)
      and (t.status='active' or (t.status='ended' and t.lease_end is not null))
  ), amounts as (
    select b.*,app_private.renewal_paid_for_period(b.id,date_trunc('month',p_month)::date) as paid from periods b
  )
  select b.id,b.apartment_id,b.name,b.tenant_name,b.due,b.rent,least(b.rent,b.paid),greatest(b.rent-b.paid,0),
    greatest((now() at time zone 'Asia/Manila')::date-b.due,0),
    case when b.paid>=b.rent then 'collected' when b.due<(now() at time zone 'Asia/Manila')::date then 'overdue' else 'pending' end
  from amounts b where b.due>=b.lease_start and (b.lease_end is null or b.due<=b.lease_end)
    and b.rent>0 and date_trunc('month',p_month)<=date_trunc('month',now() at time zone 'Asia/Manila');
$$;

-- Direct edits must not invalidate frozen renewal snapshots. Ordinary explicit
-- move-out/status changes still go through their existing guards.
create function app_private.guard_renewal_source_terms()
returns trigger language plpgsql security definer set search_path='' as $$
declare affected record;
begin
  if new.renewal_ended_at is distinct from old.renewal_ended_at then raise exception 'The renewal occupancy end timestamp is server-managed.'; end if;
  if old.status='active' and new.status='ended' and exists(select 1 from public.lease_renewals where tenancy_id=old.id) then
    if exists(select 1 from public.tenancy_lease_terms where tenancy_id=old.id and not original and lease_start>(now() at time zone 'Asia/Manila')::date)
      or exists(select 1 from public.payment where tenancy_id=old.id and renewal_proposal_id is not null and status='pending') then
      raise exception 'Reconcile the scheduled renewal or its pending payment before ending this tenancy.';
    end if;
    new.renewal_ended_at:=now();
    for affected in update public.lease_renewals set status='requires_review',version=version+1,updated_at=now()
      where tenancy_id=old.id and status not in('renewed','declined','not_renewing','requires_review') returning id,current_proposal_id
    loop
      insert into public.lease_renewal_events(renewal_id,proposal_id,event) values(affected.id,affected.current_proposal_id,'tenancy_ended_requires_review');
      perform app_private.renewal_notice(old.id,affected.id,'Renewal requires review','The tenancy was explicitly ended. Its unresolved renewal now requires review; no agreement or payment history was removed.');
    end loop;
  end if;
  if exists(select 1 from public.lease_renewals where tenancy_id=old.id)
    and row(new.lease_start,new.monthly_rent,new.security_deposit,new.tenant_id,new.landlord_id,new.apartment_id)
      is distinct from row(old.lease_start,old.monthly_rent,old.security_deposit,old.tenant_id,old.landlord_id,old.apartment_id) then
    raise exception 'Original lease terms are preserved by the renewal history.';
  end if;
  if new.lease_end is distinct from old.lease_end
    and exists(select 1 from public.lease_renewals where tenancy_id=old.id) then
    raise exception 'Use the agreed renewal process to extend this lease.';
  end if;
  return new;
end;
$$;
revoke all on function app_private.guard_renewal_source_terms() from public,anon,authenticated;
create trigger guard_renewal_source_terms before update on public.tenancies for each row execute function app_private.guard_renewal_source_terms();

-- Audited operator functions changed above must retain demo-population drift checks.
update demo_population.audited_functions a set hash=md5(pg_get_functiondef(p.oid))
from pg_proc p join pg_namespace n on n.oid=p.pronamespace
where a.name=n.nspname||'.'||p.proname and
  ((n.nspname='app_private' and p.proname in ('guard_payment_billing','guard_maintenance_fee'))
   or (n.nspname='public' and p.proname in('notify_rent_due_status','notify_payment_created')));
commit;
