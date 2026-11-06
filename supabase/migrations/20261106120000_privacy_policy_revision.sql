-- Publish the system-specific Privacy Policy alongside the matching web/mobile
-- clients. Terms remain 1.1. Preserve every historical acceptance record and do
-- not introduce a completed-account gate or infer fresh consent from old rows.
update public.web_registration_policies
set version = '1.1'
where policy_id = 'privacy';
