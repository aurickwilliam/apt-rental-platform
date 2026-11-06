-- Existing listings are classified as own-meter by product decision, not by an
-- inspection. Adding with a constant default backfills without firing UPDATE
-- triggers or changing timestamps/demo-population apartment patches.
begin;

alter table public.apartments
  add column has_own_electricity_meter boolean not null default true;

-- Future inserts must explicitly confirm; omission must never mean consent.
alter table public.apartments
  alter column has_own_electricity_meter set default false;

comment on column public.apartments.has_own_electricity_meter is
  'Dedicated electricity-provider meter, excluding shared meters and submeters. Existing listings were classified true by rollout policy, not individually verified.';

grant select (has_own_electricity_meter) on public.apartments to anon, authenticated;
grant insert (has_own_electricity_meter), update (has_own_electricity_meter)
  on public.apartments to authenticated;

create function public.guard_apartment_own_electricity_meter()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.has_own_electricity_meter is distinct from true then
    raise exception 'Confirm this unit has its own dedicated electricity meter. Shared meters and submeters are not accepted.'
      using errcode = '23514';
  end if;
  return new;
end;
$$;

revoke all on function public.guard_apartment_own_electricity_meter() from public, anon, authenticated;

create trigger guard_apartment_own_electricity_meter
before insert or update of has_own_electricity_meter on public.apartments
for each row execute function public.guard_apartment_own_electricity_meter();

commit;
