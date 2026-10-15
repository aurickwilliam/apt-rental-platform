-- Conversation list scoped to one portal, so dual-role users see tenant-side
-- chats in the tenant portal and landlord-side chats in the landlord portal.
--
-- A conversation about an apartment belongs to the landlord portal when the
-- caller owns that apartment, otherwise to the tenant portal. Conversations
-- with no apartment (or whose apartment row no longer exists) have no owner
-- to decide by, so they appear in both portals.
--
-- Same columns, ordering and caller identity (auth.uid(), not suspended) as
-- get_conversations_v2, which stays unchanged for app builds that call it.
create or replace function public.get_portal_conversations(p_portal text)
returns table(
  conversation_key text,
  other_user_id uuid,
  other_user_name text,
  other_user_avatar text,
  other_user_phone text,
  apartment_id uuid,
  apartment_name text,
  last_message text,
  last_message_time timestamp with time zone,
  unread_count integer,
  last_sender_id uuid,
  last_message_type text,
  conversation_type text
)
language plpgsql
stable
security definer
set search_path to ''
as $function$
declare
  v_user_id uuid;
begin
  if p_portal is null or p_portal not in ('tenant', 'landlord') then
    raise exception 'Portal must be tenant or landlord.'
      using errcode = '22023';
  end if;

  select u.id into v_user_id
  from public.users u
  where u.user_id = auth.uid() and not u.is_suspended;

  if v_user_id is null then
    raise exception 'not authenticated';
  end if;

  return query
  with conversations as (
    select
      case when c.sender_id = v_user_id then c.receiver_id else c.sender_id end as other_user_id,
      c.apartment_id,
      c.created_at,
      c.id,
      c.message,
      c.message_type,
      c.sender_id
    from public.chat c
    where c.sender_id = v_user_id or c.receiver_id = v_user_id
  ),
  latest as (
    select distinct on (co.other_user_id, co.apartment_id)
      co.other_user_id,
      co.apartment_id,
      co.created_at,
      co.id,
      co.message,
      co.message_type,
      co.sender_id
    from conversations co
    order by co.other_user_id, co.apartment_id, co.created_at desc, co.id desc
  ),
  unread as (
    select
      case when c.sender_id = v_user_id then c.receiver_id else c.sender_id end as other_user_id,
      c.apartment_id,
      count(*) filter (where c.receiver_id = v_user_id and c.is_read = false)::integer as unread_count
    from public.chat c
    where c.sender_id = v_user_id or c.receiver_id = v_user_id
    group by 1, 2
  )
  select
    'chat:'
      || coalesce(l.apartment_id::text, 'none')
      || ':' || least(l.other_user_id::text, v_user_id::text)
      || ':' || greatest(l.other_user_id::text, v_user_id::text) as conversation_key,
    l.other_user_id,
    trim(both from coalesce(u.first_name, '') || ' ' || coalesce(u.last_name, '')) as other_user_name,
    u.avatar_url as other_user_avatar,
    u.mobile_number as other_user_phone,
    l.apartment_id,
    a.name as apartment_name,
    l.message as last_message,
    l.created_at as last_message_time,
    un.unread_count,
    l.sender_id as last_sender_id,
    l.message_type as last_message_type,
    case
      when exists (
        select 1
        from public.tenancies t
        where t.landlord_id = v_user_id
          and t.tenant_id = l.other_user_id
          and t.apartment_id = l.apartment_id
          and t.status = 'active'
      ) then 'tenant'
      else 'inquiry'
    end as conversation_type
  from latest l
  left join public.users u on u.id = l.other_user_id
  left join public.apartments a on a.id = l.apartment_id
  left join unread un
    on un.other_user_id = l.other_user_id
   and un.apartment_id is not distinct from l.apartment_id
  where a.id is null
     or coalesce(a.landlord_id = v_user_id, false) = (p_portal = 'landlord')
  order by l.created_at desc, l.id desc;
end;
$function$;

revoke all on function public.get_portal_conversations(text) from public, anon;
grant execute on function public.get_portal_conversations(text) to authenticated, service_role;
