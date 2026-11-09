-- One portal per person for chats with no apartment.
--
-- get_portal_conversations placed a chat with no apartment (a general inquiry
-- from a landlord's profile) in BOTH portals, so a user holding tenant and
-- landlord roles saw the same thread, and its unread count, on both sides; the
-- notification for it carried no apartment, so no portal claimed it at all.
--
-- Rule: with no apartment to decide by, the person who sent the first message
-- is the inquirer, so the chat belongs to their TENANT portal, and the other
-- person sees it in their LANDLORD portal. Chats about an apartment keep the
-- existing rule (the apartment's owner is the landlord side).

create or replace function app_private.chat_inquirer_portal(
  p_user_id uuid,
  p_other_user_id uuid,
  p_apartment_id uuid
)
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select case when first_message.sender_id = p_user_id then 'tenant' else 'landlord' end
  from (
    select c.sender_id
    from public.chat c
    where c.apartment_id is not distinct from p_apartment_id
      and ((c.sender_id = p_user_id and c.receiver_id = p_other_user_id)
        or (c.sender_id = p_other_user_id and c.receiver_id = p_user_id))
    order by c.created_at, c.id
    limit 1
  ) first_message;
$$;
revoke all on function app_private.chat_inquirer_portal(uuid, uuid, uuid) from public, anon, authenticated;

-- Same columns and ordering as before (older app builds keep working); only the
-- portal filter changes for a conversation whose apartment has no owner row.
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
  where case
          when a.id is not null then coalesce(a.landlord_id = v_user_id, false) = (p_portal = 'landlord')
          else app_private.chat_inquirer_portal(v_user_id, l.other_user_id, l.apartment_id) = p_portal
        end
  order by l.created_at desc, l.id desc;
end;
$function$;

revoke all on function public.get_portal_conversations(text) from public, anon;
grant execute on function public.get_portal_conversations(text) to authenticated, service_role;

-- A message with no apartment names the receiver's portal in the notification,
-- so the clients (which can only resolve a portal from an apartment) can show it.
-- The new row is already visible here (AFTER INSERT), so a first message makes
-- its receiver the landlord side. Chats about an apartment are unchanged.
create or replace function public.notify_chat_message()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_sender_name text;
  v_sender_avatar text;
  v_preview text;
  v_data jsonb;
begin
  if exists (
    select 1 from public.conversation_preferences cp
    where cp.user_id = NEW.receiver_id
      and cp.other_user_id = NEW.sender_id
      and cp.apartment_id is not distinct from NEW.apartment_id
      and cp.is_muted
  ) then
    return NEW;
  end if;

  select
    trim(both from coalesce(u.first_name, '') || ' ' || coalesce(u.last_name, '')),
    u.avatar_url
  into v_sender_name, v_sender_avatar
  from public.users u
  where u.id = NEW.sender_id;

  v_preview := case
    when NEW.message is not null then NEW.message
    when NEW.message_type = 'image' then 'Sent an image'
    when NEW.message_type = 'video' then 'Sent a video'
    when NEW.message_type = 'gif' then 'Sent a GIF'
    else 'Sent an attachment'
  end;

  v_data := jsonb_build_object(
    'screen', 'chat',
    'apartmentId', NEW.apartment_id,
    'conversationKey',
      'chat:' || coalesce(NEW.apartment_id::text, 'none') || ':' ||
      least(NEW.sender_id::text, NEW.receiver_id::text) || ':' ||
      greatest(NEW.sender_id::text, NEW.receiver_id::text),
    'senderId', NEW.sender_id,
    'senderAvatarUrl', v_sender_avatar
  );

  if NEW.apartment_id is null then
    v_data := v_data || jsonb_build_object(
      'recipientPortal',
      coalesce(app_private.chat_inquirer_portal(NEW.receiver_id, NEW.sender_id, null), 'landlord')
    );
  end if;

  perform public.create_notification(
    NEW.receiver_id,
    'message',
    coalesce(nullif(v_sender_name, ''), 'New Message'),
    v_preview,
    v_data
  );

  return NEW;
end;
$function$;

-- Same for a reaction: the recipient is the message author, and the thread
-- already exists, so its portal follows the same first-sender rule.
create or replace function public.notify_chat_reaction()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  c_reaction_cooldown constant interval := interval '15 minutes';
  v_author_id         uuid;
  v_apartment_id      uuid;
  v_message           text;
  v_message_type      text;
  v_actor_name        text;
  v_actor_avatar      text;
  v_preview           text;
  v_data              jsonb;
begin
  -- Resolve the reacted-to message. The reacting user must be one of its two
  -- parties, and the recipient is always the message author.
  select c.sender_id, c.apartment_id, c.message, c.message_type
  into v_author_id, v_apartment_id, v_message, v_message_type
  from public.chat c
  where c.id = NEW.message_id
    and NEW.user_id in (c.sender_id, c.receiver_id);

  if v_author_id is null or v_author_id = NEW.user_id then
    return NEW;
  end if;

  -- Muted conversation for the recipient: no feed row, no push.
  if exists (
    select 1
    from public.conversation_preferences cp
    where cp.user_id = v_author_id
      and cp.other_user_id = NEW.user_id
      and cp.apartment_id is not distinct from v_apartment_id
      and cp.is_muted
  ) then
    return NEW;
  end if;

  -- Blocks are messaging-only and guard_chat_blocks covers chat inserts only,
  -- so an existing reaction from a blocked user is suppressed here.
  if exists (
    select 1
    from public.user_blocks b
    where (b.blocker_id = v_author_id and b.blocked_id = NEW.user_id)
       or (b.blocker_id = NEW.user_id and b.blocked_id = v_author_id)
  ) then
    return NEW;
  end if;

  -- Anti-spam: one reaction notification per recipient + message + reactor per
  -- cooldown window. Uses notifications_user_created_idx (user_id, created_at).
  if exists (
    select 1
    from public.notifications n
    where n.user_id = v_author_id
      and n.type = 'message'
      and n.data->>'event' = 'reaction'
      and n.data->>'messageId' = NEW.message_id::text
      and n.data->>'senderId' = NEW.user_id::text
      and n.created_at > now() - c_reaction_cooldown
  ) then
    return NEW;
  end if;

  select
    trim(both from coalesce(u.first_name, '') || ' ' || coalesce(u.last_name, '')),
    u.avatar_url
  into v_actor_name, v_actor_avatar
  from public.users u
  where u.id = NEW.user_id;

  -- Short, safe preview: same placeholders as notify_chat_message, collapsed to
  -- one line and bounded so no message can bloat the feed row or a push.
  v_preview := left(
    regexp_replace(
      case
        when v_message is not null then v_message
        when v_message_type = 'image' then 'Sent an image'
        when v_message_type = 'video' then 'Sent a video'
        when v_message_type = 'gif' then 'Sent a GIF'
        else 'Sent an attachment'
      end,
      '\s+', ' ', 'g'
    ),
    120
  );
  v_preview := nullif(btrim(v_preview), '');

  v_data := jsonb_build_object(
    'screen', 'chat',
    'event', 'reaction',
    'apartmentId', v_apartment_id,
    'conversationKey',
      'chat:' || coalesce(v_apartment_id::text, 'none') || ':' ||
      least(NEW.user_id::text, v_author_id::text) || ':' ||
      greatest(NEW.user_id::text, v_author_id::text),
    'senderId', NEW.user_id,
    'senderAvatarUrl', v_actor_avatar,
    'messageId', NEW.message_id,
    'emoji', NEW.emoji
  );

  if v_preview is not null then
    v_data := v_data || jsonb_build_object('messagePreview', v_preview);
  end if;

  if v_apartment_id is null then
    v_data := v_data || jsonb_build_object(
      'recipientPortal',
      coalesce(app_private.chat_inquirer_portal(v_author_id, NEW.user_id, null), 'landlord')
    );
  end if;

  perform public.create_notification(
    v_author_id,
    'message',
    coalesce(nullif(v_actor_name, ''), 'New Message'),
    'Reacted ' || NEW.emoji || ' to your message',
    v_data
  );

  return NEW;
end;
$function$;

-- notify_chat_message is a trigger on public.chat, so the demo-population safety
-- audit hashes it; record the reviewed new body (saved previews become stale and
-- must be regenerated, as with any trigger change).
do $$
declare reviewed record;
begin
  if to_regclass('demo_population.audited_functions') is not null then
    for reviewed in
      select p.oid, n.nspname || '.' || p.proname as name
      from pg_proc p join pg_namespace n on n.oid = p.pronamespace
      where n.nspname = 'public' and p.proname = 'notify_chat_message'
    loop
      insert into demo_population.audited_functions(name, hash)
        values (reviewed.name, md5(pg_get_functiondef(reviewed.oid)))
        on conflict (name) do update set hash = excluded.hash;
    end loop;
  end if;
end;
$$;
