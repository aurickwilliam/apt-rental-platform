-- Review stay eligibility: a tenant may review an apartment only after
-- 3 months of stay or once the tenancy has ended.
--
-- Additive and idempotent: INSERT-only trigger, no existing rows touched.
-- The stay is resolved through NEW.tenancy_id alone. The client inserts only
-- tenancy_id; tenant_id / apartment_id are backfilled by the
-- sync_review_tenancy_fields trigger, which may not have run yet when this
-- trigger fires (same-event triggers fire alphabetically). Matching on all
-- three columns here would see NULLs and reject every insert.
-- Mobile gets enforcement for free since this fires for every insert
-- regardless of client.

create or replace function public.enforce_review_stay_eligibility()
 returns trigger
 language plpgsql
 security definer
 set search_path to ''
as $function$
declare
  v_lease_start date;
  v_lease_end date;
begin
  select t.lease_start, t.lease_end into v_lease_start, v_lease_end
  from public.tenancies t
  where t.id = new.tenancy_id;

  if not found then
    raise exception 'Review does not match a tenancy for this apartment.' using errcode = '23514';
  end if;

  if v_lease_start > (current_date - interval '3 months')::date
    and (v_lease_end is null or v_lease_end > current_date) then
    raise exception 'Reviews unlock after 3 months of stay or once the tenancy ends.' using errcode = '23514';
  end if;

  return new;
end; $function$;

drop trigger if exists enforce_review_stay_eligibility on public.reviews;
create trigger enforce_review_stay_eligibility
  before insert on public.reviews
  for each row execute function public.enforce_review_stay_eligibility();
