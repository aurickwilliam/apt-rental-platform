-- Phase 2 of multi-role support: RLS enforcement flip from scalar users.role
-- to membership in users.roles. Behavior parity for single-role accounts:
-- roles[1] mirrors role, so every rewritten check matches exactly the same
-- rows as before. Policy names, commands, and target roles are unchanged.

-- users: public landlord / tenant profile views.
drop policy if exists "Anyone can view landlord profiles" on public.users;
create policy "Anyone can view landlord profiles" on public.users
  for select to public using (('landlord'::text = any (roles)));

drop policy if exists "Anyone can view tenant info for reviews" on public.users;
create policy "Anyone can view tenant info for reviews" on public.users
  for select to public using (('tenant'::text = any (roles)));

-- apartments: landlord-only creation.
drop policy if exists "Only landlords can create apartments" on public.apartments;
create policy "Only landlords can create apartments" on public.apartments
  for insert to authenticated with check ((
    landlord_id = (select users.id from users where (users.user_id = auth.uid()))
    and (exists (select 1 from users
      where ((users.user_id = auth.uid()) and ('landlord'::text = any (users.roles)))))
  ));

-- apartment_images: landlord update / delete via owned apartments.
drop policy if exists "Landlords can delete apartment images" on public.apartment_images;
create policy "Landlords can delete apartment images" on public.apartment_images
  for delete to authenticated using ((exists (select 1
    from (apartments a join users u on ((u.id = a.landlord_id)))
    where ((a.id = apartment_images.apartment_id) and (u.user_id = auth.uid())
      and ('landlord'::text = any (u.roles))))));

drop policy if exists "Landlords can update apartment images" on public.apartment_images;
create policy "Landlords can update apartment images" on public.apartment_images
  for update to authenticated
  using ((exists (select 1
    from (apartments a join users u on ((u.id = a.landlord_id)))
    where ((a.id = apartment_images.apartment_id) and (u.user_id = auth.uid())
      and ('landlord'::text = any (u.roles))))))
  with check ((exists (select 1
    from (apartments a join users u on ((u.id = a.landlord_id)))
    where ((a.id = apartment_images.apartment_id) and (u.user_id = auth.uid())
      and ('landlord'::text = any (u.roles))))));

-- tenancies: landlords viewing ended tenancies.
drop policy if exists "Landlords can view any tenant's ended tenancies" on public.tenancies;
create policy "Landlords can view any tenant's ended tenancies" on public.tenancies
  for select to authenticated using (((status = 'ended'::text) and (exists (select 1
    from users u
    where ((u.user_id = auth.uid()) and ('landlord'::text = any (u.roles)))))));

-- admin_audit_logs: admin read.
drop policy if exists "Admins read audit logs" on public.admin_audit_logs;
create policy "Admins read audit logs" on public.admin_audit_logs
  for select to authenticated using ((exists (select 1 from users
    where ((users.user_id = auth.uid()) and ('admin'::text = any (users.roles))))));

-- apartment_verifications: admin read / review.
drop policy if exists "Admins read apartment verifications" on public.apartment_verifications;
create policy "Admins read apartment verifications" on public.apartment_verifications
  for select to authenticated using ((exists (select 1 from users
    where ((users.user_id = auth.uid()) and ('admin'::text = any (users.roles))))));

drop policy if exists "Admins review apartment verifications" on public.apartment_verifications;
create policy "Admins review apartment verifications" on public.apartment_verifications
  for update to authenticated
  using ((exists (select 1 from users
    where ((users.user_id = auth.uid()) and ('admin'::text = any (users.roles))))))
  with check ((exists (select 1 from users
    where ((users.user_id = auth.uid()) and ('admin'::text = any (users.roles))))));

-- user_verifications: admin read / review (target roles preserved as-is).
drop policy if exists "Admins read verifications" on public.user_verifications;
create policy "Admins read verifications" on public.user_verifications
  for select to public using ((exists (select 1 from users
    where ((users.user_id = auth.uid()) and ('admin'::text = any (users.roles))))));

drop policy if exists "Admins review verifications" on public.user_verifications;
create policy "Admins review verifications" on public.user_verifications
  for update to public
  using ((exists (select 1 from users
    where ((users.user_id = auth.uid()) and ('admin'::text = any (users.roles))))))
  with check ((exists (select 1 from users
    where ((users.user_id = auth.uid()) and ('admin'::text = any (users.roles))))));
