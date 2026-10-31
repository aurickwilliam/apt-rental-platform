-- The public landlord profile lists every ownership document the landlord has
-- added, each marked verified or not. Replaces get_verified_landlord_documents()
-- (verified-only) from the previous migration. Returns the document type name
-- and a flag only: never files, paths, dates or review notes, and a rejected,
-- pending, unreviewed or expired document all read as simply "not verified".

drop function if exists public.get_verified_landlord_documents(uuid);

create or replace function public.get_landlord_ownership_documents(p_landlord_id uuid)
returns table (doc_type text, is_verified boolean)
language sql
stable
security definer
set search_path = public
as $$
  select
    d.doc_type,
    bool_or(
      d.review_status = 'verified'
      and d.is_verified
      and (d.expires_at is null or d.expires_at >= current_date)
    ) as is_verified
  from public.passport_documents d
  join public.users u on u.id = d.user_id
  where d.user_id = p_landlord_id
    and 'landlord' = any (u.roles)
    and coalesce(u.is_suspended, false) = false
    and d.doc_type in (
      'Tax Declaration',
      'Transfer Certificate of Title',
      'Real Property Tax Receipt',
      'Business Permit',
      'DTI / SEC Registration',
      'Authorization Letter (SPA)'
    )
  group by d.doc_type;
$$;

revoke all on function public.get_landlord_ownership_documents(uuid) from public;
grant execute on function public.get_landlord_ownership_documents(uuid) to anon, authenticated;
