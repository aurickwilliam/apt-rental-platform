-- Public transparency: resolved-only maintenance history for a visible apartment.
-- Exposes only safe columns (no tenant_id, landlord_id, message, photos, or fees).
-- RLS on maintenance_request is unchanged; this SECURITY DEFINER function is the
-- single public read path and enforces apartment visibility itself.

create or replace function public.get_apartment_maintenance_history(
  p_apartment_id uuid,
  p_limit integer default 10,
  p_offset integer default 0
)
returns table (
  id uuid,
  title text,
  category text,
  urgency text,
  created_at timestamptz,
  resolved_at timestamptz,
  resolution_notes text,
  total_count bigint
)
language sql
security definer
stable
set search_path = public
as $$
  select
    m.id,
    m.title,
    m.category,
    m.urgency,
    m.created_at,
    m.resolved_at,
    m.resolution_notes,
    count(*) over () as total_count
  from public.maintenance_request m
  join public.apartments a on a.id = m.apartment_id
  where m.apartment_id = p_apartment_id
    and m.status = 'resolved'
    and a.deleted_at is null
    and a.is_hidden_by_admin = false
  order by m.created_at desc
  limit least(greatest(coalesce(p_limit, 10), 1), 50)
  offset greatest(coalesce(p_offset, 0), 0);
$$;

revoke all on function public.get_apartment_maintenance_history(uuid, integer, integer) from public;
grant execute on function public.get_apartment_maintenance_history(uuid, integer, integer) to anon, authenticated;
