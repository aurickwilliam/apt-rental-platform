-- APT lists properties only in the CAMANAVA corridor. This trigger protects
-- the rule for every client, including direct PostgREST requests, while not
-- rewriting or preventing unrelated updates to historical out-of-area rows.

create or replace function public.guard_camanava_apartment_location()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if new.city not in ('Caloocan', 'Malabon', 'Navotas', 'Valenzuela')
    or new.province <> 'Metro Manila' then
    raise exception 'Properties can only be listed in Caloocan, Malabon, Navotas, or Valenzuela, Metro Manila.';
  end if;

  return new;
end;
$$;

drop trigger if exists guard_camanava_apartment_location on public.apartments;
create trigger guard_camanava_apartment_location
  before insert or update of city, province on public.apartments
  for each row
  execute function public.guard_camanava_apartment_location();
