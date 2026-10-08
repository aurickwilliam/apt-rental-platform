-- Applications now attach BOTH sides of the tenant's verified ID.
--
-- * rental_application.gov_id_back_url: path of the ID back capture (null when
--   the attached ID has no back, e.g. a passport-style single-sided upload).
-- * The landlord read helper is generalised from "ID front" to "ID front or
--   back". A landlord can read an object only when an active (pending/approved)
--   application for one of their own apartments references it as its front
--   (`gov_id_url`) or back (`gov_id_back_url`), it sits in that applicant's own
--   folder, and it equals the matching `id_front_path` / `id_back_path` of the
--   applicant's APPROVED verification. The selfie matches neither, so it stays
--   private.

alter table public.rental_application
  add column if not exists gov_id_back_url text null;

create or replace function private.landlord_can_read_applicant_id(object_name text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.rental_application ra
    join public.apartments a on a.id = ra.apartment_id
    join public.user_verifications uv
      on uv.user_id = ra.tenant_id
     and uv.status = 'approved'
    where ra.status in ('pending', 'approved')
      and (storage.foldername(object_name))[1] = ra.tenant_id::text
      and a.landlord_id = (select id from public.users where user_id = auth.uid())
      and (
        (ra.gov_id_url = object_name and uv.id_front_path = object_name)
        or (ra.gov_id_back_url = object_name and uv.id_back_path = object_name)
      )
  );
$$;

revoke all on function private.landlord_can_read_applicant_id(text) from public, anon;
grant execute on function private.landlord_can_read_applicant_id(text) to authenticated;

drop policy if exists "Landlords can view applicant verified ID front" on storage.objects;
drop policy if exists "Landlords can view applicant verified ID" on storage.objects;
create policy "Landlords can view applicant verified ID"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'user-verification'
    and (select private.landlord_can_read_applicant_id(name))
  );

drop function if exists private.landlord_can_read_applicant_id_front(text);

-- Existing active applications that already reference an approved verification
-- front gain the matching back, so landlords see both sides.
update public.rental_application ra
set gov_id_back_url = uv.id_back_path
from public.user_verifications uv
where uv.user_id = ra.tenant_id
  and uv.status = 'approved'
  and uv.id_front_path = ra.gov_id_url
  and uv.id_back_path is not null
  and ra.gov_id_back_url is null
  and ra.status in ('pending', 'approved');
