-- No blocking between a tenant and landlord who share an active tenancy.
-- During a lease they need to reach each other (rent, repairs, move-out);
-- mute and report stay available, and blocking works again once the tenancy
-- is no longer active. Unblocking is always allowed.

create or replace function app_private.share_active_tenancy(p_user_id uuid, p_other_user_id uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.tenancies t
    where t.status = 'active'
      and ((t.tenant_id = p_user_id and t.landlord_id = p_other_user_id)
        or (t.tenant_id = p_other_user_id and t.landlord_id = p_user_id))
  );
$$;
revoke all on function app_private.share_active_tenancy(uuid, uuid) from public, anon, authenticated;

create or replace function public.block_user(p_user_id uuid)
returns void language plpgsql security definer set search_path = '' as $$
declare
  v_user_id uuid := app_private.current_active_user_id();
begin
  if v_user_id is null then
    raise exception 'not authenticated';
  end if;
  if p_user_id is null or p_user_id = v_user_id
      or not exists (select 1 from public.users where id = p_user_id) then
    raise exception 'This person can''t be blocked.' using errcode = '22023';
  end if;
  if app_private.share_active_tenancy(v_user_id, p_user_id) then
    raise exception 'You can''t block someone you have an active tenancy with. Mute or report them instead.'
      using errcode = 'P0001';
  end if;

  insert into public.user_blocks (blocker_id, blocked_id)
  values (v_user_id, p_user_id)
  on conflict do nothing;
end;
$$;
revoke all on function public.block_user(uuid) from public, anon;
grant execute on function public.block_user(uuid) to authenticated;

-- The conversation list reports whether the caller shares an active tenancy
-- with the other person (any apartment), so the app can explain why Block is
-- unavailable. The return type changes, so the function is dropped and
-- recreated; the body is otherwise unchanged.

drop function if exists public.get_portal_conversations(text);

create function public.get_portal_conversations(p_portal text)
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
  conversation_type text,
  is_pinned boolean,
  pinned_at timestamp with time zone,
  is_archived boolean,
  is_muted boolean,
  marked_unread boolean,
  blocked_by_me boolean,
  in_active_tenancy boolean
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
    end as conversation_type,
    coalesce(cp.is_pinned, false) as is_pinned,
    cp.pinned_at,
    coalesce(cp.is_archived, false) as is_archived,
    coalesce(cp.is_muted, false) as is_muted,
    coalesce(cp.marked_unread, false) as marked_unread,
    exists (
      select 1 from public.user_blocks b
      where b.blocker_id = v_user_id and b.blocked_id = l.other_user_id
    ) as blocked_by_me,
    app_private.share_active_tenancy(v_user_id, l.other_user_id) as in_active_tenancy
  from latest l
  left join public.users u on u.id = l.other_user_id
  left join public.apartments a on a.id = l.apartment_id
  left join unread un
    on un.other_user_id = l.other_user_id
   and un.apartment_id is not distinct from l.apartment_id
  left join public.conversation_preferences cp
    on cp.user_id = v_user_id
   and cp.other_user_id = l.other_user_id
   and cp.apartment_id is not distinct from l.apartment_id
  where a.id is null
     or coalesce(a.landlord_id = v_user_id, false) = (p_portal = 'landlord')
  order by l.created_at desc, l.id desc;
end;
$function$;

revoke all on function public.get_portal_conversations(text) from public, anon;
grant execute on function public.get_portal_conversations(text) to authenticated, service_role;
