-- Supabase may have an explicit legacy anon EXECUTE grant in addition to
-- PUBLIC. This validation endpoint is for authenticated landlord flows only.

revoke all on function public.validate_camanava_location(text, double precision, double precision) from anon;
