-- Qualify the verification row's landlord ID inside the apartment subquery.
-- Without this qualification, both sides resolve to apartments.landlord_id.
drop policy "Landlords submit own apartment verifications" on public.apartment_verifications;

create policy "Landlords submit own apartment verifications"
  on public.apartment_verifications for insert to authenticated
  with check (
    landlord_id = (select id from public.users where user_id = (select auth.uid()))
    and status = 'pending' and reviewed_by is null and reviewed_at is null
    and exists (
      select 1
      from public.apartments a
      where a.id = apartment_id
        and a.landlord_id = public.apartment_verifications.landlord_id
    )
  );
