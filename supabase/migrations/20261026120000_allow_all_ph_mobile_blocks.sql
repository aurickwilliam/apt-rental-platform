-- The profile guard only accepted `09` + 9 digits, which rejected real
-- Philippine mobile numbers in the 08 series (Smart 0813, Globe 0817, DITO
-- 0895-0899). The apps now accept every 09XX block (the NTC mobile range, so
-- new carrier blocks work without a release) plus those 08 blocks, and always
-- store the 11-digit 0XXXXXXXXXX form. Only the mobile pattern and its message
-- change; the rest is as in 20261024110000_guard_user_profile_values.sql, and
-- the existing trigger keeps pointing at this function.

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
     and NEW.mobile_number !~ '^0(9[0-9]{2}|813|817|89[5-9])[0-9]{7}$' then
    raise exception 'Enter a valid Philippine mobile number (11 digits, like 09171234567).';
  end if;

  if NEW.postal_code is not null
     and (TG_OP = 'INSERT' or NEW.postal_code is distinct from OLD.postal_code)
     and (NEW.postal_code < 1000 or NEW.postal_code > 9999) then
    raise exception 'Please enter a valid 4-digit postal code.';
  end if;

  return NEW;
end;
$$;
