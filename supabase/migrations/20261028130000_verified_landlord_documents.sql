-- Which kinds of ownership document a landlord has had approved, for the
-- "Verified on APT Passport" card on their public profile. Returns only the
-- document type names (never files, paths or dates). Same rules as
-- get_verified_landlord_ids(): admin-approved, unexpired, landlord not suspended.

create or replace function public.get_verified_landlord_documents(p_landlord_id uuid)
returns setof text
language sql
stable
security definer
set search_path = public
as $$
  select distinct d.doc_type
  from public.passport_documents d
  join public.users u on u.id = d.user_id
  where d.user_id = p_landlord_id
    and 'landlord' = any (u.roles)
    and coalesce(u.is_suspended, false) = false
    and d.review_status = 'verified'
    and d.is_verified
    and (d.expires_at is null or d.expires_at >= current_date)
    and d.doc_type in (
      'Tax Declaration',
      'Transfer Certificate of Title',
      'Real Property Tax Receipt',
      'Business Permit',
      'DTI / SEC Registration',
      'Authorization Letter (SPA)'
    );
$$;

revoke all on function public.get_verified_landlord_documents(uuid) from public;
grant execute on function public.get_verified_landlord_documents(uuid) to anon, authenticated;
