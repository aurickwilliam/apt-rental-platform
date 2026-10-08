-- Rental applications attach the tenant's APT Passport documents by reference.
-- The verified primary ID lives in the private `user-verification` bucket, which
-- only its owner and admins could read, so landlords could not open it.
--
-- Allow a landlord to read exactly ONE object: the approved ID *front* capture
-- that an active application for one of their own apartments lists as its
-- government ID. The helper is SECURITY DEFINER because landlords cannot read
-- `user_verifications` through RLS; it checks, for the requested object name:
--   * an application (pending/approved) on an apartment owned by the caller
--     references the object as `gov_id_url`;
--   * the object sits in that applicant's own folder (`{tenant users.id}/...`);
--   * it equals `id_front_path` of an APPROVED verification of that applicant.
-- ID back and selfie captures never match `id_front_path`, so they stay private.

create or replace function private.landlord_can_read_applicant_id_front(object_name text)
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
     and uv.id_front_path = object_name
    where ra.gov_id_url = object_name
      and ra.status in ('pending', 'approved')
      and (storage.foldername(object_name))[1] = ra.tenant_id::text
      and a.landlord_id = (select id from public.users where user_id = auth.uid())
  );
$$;

revoke all on function private.landlord_can_read_applicant_id_front(text) from public, anon;
grant execute on function private.landlord_can_read_applicant_id_front(text) to authenticated;

drop policy if exists "Landlords can view applicant verified ID front" on storage.objects;
create policy "Landlords can view applicant verified ID front"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'user-verification'
    and (select private.landlord_can_read_applicant_id_front(name))
  );
