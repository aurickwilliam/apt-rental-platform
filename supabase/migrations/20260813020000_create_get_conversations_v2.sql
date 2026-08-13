-- Hardened conversation-list RPC for the mobile app.
--
-- Replaces the conversation-list metadata scan the client used to perform:
-- v2 returns authoritative last_sender_id / last_message_type / unread_count
-- and preserves the "tenant vs inquiry" classification the client previously
-- derived from active tenancies.
--
-- Security design:
--   * Zero parameters — nothing caller-supplied can influence authorization.
--   * Identity is derived exclusively from auth.uid() -> public.users.id; a
--     missing user raises.
--   * SECURITY DEFINER with an empty search_path; every referenced table,
--     view, and function is schema-qualified (pg_catalog builtins resolve
--     implicitly). Caller-controlled objects/functions are unresolvable.
--   * No dynamic SQL.
--   * EXECUTE revoked from PUBLIC and anon, granted to authenticated +
--     service_role only (direct anon grants from dashboards/early migrations
--     survive `revoke ... from public` — revoke anon explicitly too).
--
-- Compatibility:
--   * conversation_key is opaque to the client (used only for optimistic
--     cache operations and transient navigation params); format below matches
--     the client's buildConversationKey convention and is self-consistent.
--   * Callers re-sort by last_message_time client-side; ordering here is
--     descending (created_at, id) with the same tie-break as chat pagination.
--   * conversation_type is 'tenant' only when the CALLER is the active
--     landlord of that (tenant, apartment) pair — replicating the previous
--     client-side tenancies query exactly; tenant-role callers see 'inquiry'.

create or replace function public.get_conversations_v2()
returns table (
  conversation_key text,
  other_user_id uuid,
  other_user_name text,
  other_user_avatar text,
  other_user_phone text,
  apartment_id uuid,
  apartment_name text,
  last_message text,
  last_message_time timestamptz,
  unread_count integer,
  last_sender_id uuid,
  last_message_type text,
  conversation_type text
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid;
begin
  select u.id into v_user_id
  from public.users u
  where u.user_id = auth.uid();

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
  -------------------------------------------------------------------------
-- EDITED IN PRODUCTION (2026-08-13): CTE aliased to match the deployed body.
-------------------------------------------------------------------------
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
  order by l.created_at desc, l.id desc;
end;
$$;

revoke execute on function public.get_conversations_v2() from public;
revoke execute on function public.get_conversations_v2() from anon;
grant execute on function public.get_conversations_v2() to authenticated, service_role;

comment on function public.get_conversations_v2() is
  'Conversation list with authoritative last-message metadata; caller identity is derived from auth.uid() via public.users.id. Authenticated and service_role only.';