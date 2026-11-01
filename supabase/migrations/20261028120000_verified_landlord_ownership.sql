-- Verified landlord badge: a landlord whose ownership / authority document in
-- APT Passport has been approved by an admin. Passport rows stay private to
-- their owner (and to landlords reviewing an applicant), so public pages read
-- only this yes/no flag, never the documents. NBI Clearance is shared with
-- tenants and proves identity, not ownership, so it does not count.

create or replace function public.get_verified_landlord_ids(p_landlord_ids uuid[])
returns setof uuid
language sql
stable
security definer
set search_path = public
as $$
  select distinct d.user_id
  from public.passport_documents d
  join public.users u on u.id = d.user_id
  where d.user_id = any (p_landlord_ids)
    and cardinality(p_landlord_ids) <= 200
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

revoke all on function public.get_verified_landlord_ids(uuid[]) from public;
grant execute on function public.get_verified_landlord_ids(uuid[]) to anon, authenticated;
