-- Publish Privacy Policy 1.2, which discloses account activity emails, alongside
-- the matching web and mobile clients. Terms remain 1.1. Historical acceptance
-- records are untouched and completed accounts are not asked to accept again.
update public.web_registration_policies
set version = '1.2'
where policy_id = 'privacy';
