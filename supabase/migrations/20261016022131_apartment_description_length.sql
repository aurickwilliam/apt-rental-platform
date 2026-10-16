-- Listing descriptions are capped at 2,000 characters, matching
-- MAX_DESCRIPTION_LENGTH in @repo/constants. The longest live description was
-- 1,126 characters when this was added, so no existing row is affected.
alter table public.apartments
  add constraint apartments_description_length
  check (char_length(description) <= 2000);
