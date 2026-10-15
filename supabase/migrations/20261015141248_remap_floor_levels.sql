-- Floor levels are now: Ground Floor, 2nd-5th Floor, 6th-10th Floor and
-- 11th Floor and above (packages/constants floor-level.ts). Rewrites listings
-- saved with the previous options so search filters and edit forms match them.
--
--   Low Floor (1–5F)   -> 2nd-5th Floor
--   Mid Floor (6–15F)  -> 6th-10th Floor   (units on 11–15F need a landlord edit)
--   High Floor (16F+)  -> 11th Floor and above
--   Penthouse, N/A     -> left unchanged (no live listing uses them)
update public.apartments
set floor_level = case floor_level
    when 'Low Floor (1–5F)' then '2nd-5th Floor'
    when 'Mid Floor (6–15F)' then '6th-10th Floor'
    when 'High Floor (16F+)' then '11th Floor and above'
  end,
  updated_at = now()
where floor_level in ('Low Floor (1–5F)', 'Mid Floor (6–15F)', 'High Floor (16F+)');
