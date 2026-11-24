-- Lock renewal duration to the previous lease term. Additive follow-up to
-- 20261106090000_lease_renewals.sql for databases where that migration was
-- already applied. Renewal length can no longer be chosen by either party.
begin;

create or replace function public.act_on_lease_renewal(p_tenancy_id uuid,p_portal text,p_action text,p_expected_version integer,p_payload jsonb default '{}')
returns void language plpgsql security definer set search_path='' as $$
declare t public.tenancies%rowtype; source public.tenancy_lease_terms%rowtype;
  r public.lease_renewals%rowtype; p public.lease_renewal_proposals%rowtype;
  actor public.users%rowtype; proposal uuid; months integer; expected_months integer;
  rent numeric; retained numeric;
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
  select m into expected_months from generate_series(1,120) m
    where (source.lease_start+make_interval(months=>m))::date in (source.lease_end,source.lease_end+1)
    order by m limit 1;
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
      if expected_months is null then raise exception 'Previous lease length is unclear. The renewal needs review.'; end if;
      months:=(p_payload->>'durationMonths')::integer;
      if months is not null and months<>expected_months then
        raise exception 'Renewal duration must remain the same as the previous lease.';
      end if;
      months:=expected_months;
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
      if expected_months is null then raise exception 'Previous lease length is unclear. The renewal needs review.'; end if;
      if months is null or months<>expected_months then
        raise exception 'Renewal duration must remain the same as the previous lease.';
      end if;
      if proposal is null or start_on is distinct from source.lease_end+1
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

commit;
