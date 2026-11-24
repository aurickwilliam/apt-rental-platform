-- The own-meter confirmation now covers both the electricity and the water meter.
-- The column and its values are unchanged (no row is rewritten, so timestamps,
-- demo-population patches and older clients are untouched); only the
-- user-facing refusal message and the column documentation are replaced.
-- Existing listings stay classified true by the earlier rollout policy.
begin;

create or replace function public.guard_apartment_own_electricity_meter()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.has_own_electricity_meter is distinct from true then
    raise exception 'Confirm this unit has its own dedicated electricity and water meters. Shared meters and submeters are not accepted.'
      using errcode = '23514';
  end if;
  return new;
end;
$$;

comment on column public.apartments.has_own_electricity_meter is
  'Dedicated electricity and water meters, excluding shared meters and submeters. Column name kept for compatibility. Existing listings were classified true by rollout policy, not individually verified.';

commit;
