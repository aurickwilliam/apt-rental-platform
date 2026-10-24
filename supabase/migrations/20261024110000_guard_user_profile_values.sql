-- Sign-up validated birth date, gender, mobile number and postal code only in
-- the apps, but `authenticated` can write its own profile row directly (the
-- "create own profile" and self-service UPDATE policies), so those checks
-- could be bypassed by any signed-in client. This guard re-checks them in the
-- database.
--
-- Only client writes are checked (service-role, operator and trigger code is
-- untouched, like guard_user_email_fields), and only values being inserted or
-- changed, so older rows that predate the rules stay editable. NULL passes:
-- Google placeholder profiles are created empty and filled in later.

create or replace function public.guard_user_profile_values() returns trigger
language plpgsql set search_path = '' as $$
declare
  today date := (now() at time zone 'Asia/Manila')::date;
begin
  if current_user <> 'authenticated' then
    return NEW;
  end if;

  if NEW.birth_date is not null
     and (TG_OP = 'INSERT' or NEW.birth_date is distinct from OLD.birth_date) then
    if NEW.birth_date > today then
      raise exception 'Date of birth cannot be in the future.';
    elsif NEW.birth_date > (today - interval '18 years')::date then
      raise exception 'You must be at least 18 years old.';
    elsif NEW.birth_date < (today - interval '120 years')::date then
      raise exception 'Please enter a valid date of birth.';
    end if;
  end if;

  if NEW.gender is not null
     and (TG_OP = 'INSERT' or NEW.gender is distinct from OLD.gender)
     and NEW.gender not in ('Male', 'Female', 'Other') then
    raise exception 'Please choose a valid gender.';
  end if;

  if NEW.mobile_number is not null
     and (TG_OP = 'INSERT' or NEW.mobile_number is distinct from OLD.mobile_number)
     and NEW.mobile_number !~ '^09[0-9]{9}$' then
    raise exception 'Mobile number must be 11 digits starting with 09.';
  end if;

  if NEW.postal_code is not null
     and (TG_OP = 'INSERT' or NEW.postal_code is distinct from OLD.postal_code)
     and (NEW.postal_code < 1000 or NEW.postal_code > 9999) then
    raise exception 'Please enter a valid 4-digit postal code.';
  end if;

  return NEW;
end;
$$;

drop trigger if exists guard_user_profile_values on public.users;
create trigger guard_user_profile_values
  before insert or update on public.users
  for each row execute function public.guard_user_profile_values();
