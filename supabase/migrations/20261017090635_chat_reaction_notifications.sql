-- Reaction notifications: notify the author of the reacted-to message.
--
-- Producer only - no schema change. Reuses the existing notification path
-- (create_notification() -> notifications row + pg_net -> push-notify), the
-- `message` notification type (so notification_preferences.message, the
-- per-type icon/colour maps, the portal audience rule for screen='chat', and
-- the mobile in-conversation toast suppression all apply unchanged), the
-- existing conversation mute preference, and the existing deep links
-- (screen='chat' + conversationKey).
--
-- Rules:
--   * after INSERT only: removing a reaction (DELETE) and replacing its emoji
--     (an upsert that updates the existing (message_id, user_id) row) never
--     create a notification.
--   * the recipient is the message author; a self-reaction, a reaction from a
--     non-participant, a muted conversation, or a block in either direction
--     produces no row and no push.
--   * at most one reaction notification per (recipient, message, reacting user)
--     per 15-minute window, so remove/re-add toggling cannot spam the author.
--     A retried upsert of an existing reaction is an UPDATE and never reaches
--     this trigger at all.
--   * the OS push body is the reaction sentence only; the short message preview
--     stays in data.messagePreview and is rendered in-app.
--
-- Applied to the linked project (ezxirkpgfpripjydcqnt) out-of-band like the
-- rest of the notification schema: chat_reactions is cloud-only DDL
-- (remote migration 20260916151511_create_chat_reactions, file absent from the
-- repository - see ARCHITECTURE.md debt D17).

create or replace function public.notify_chat_reaction()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
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

  perform public.create_notification(
    v_author_id,
    'message',
    coalesce(nullif(v_actor_name, ''), 'New Message'),
    'Reacted ' || NEW.emoji || ' to your message',
    v_data
  );

  return NEW;
end;
$$;

comment on function public.notify_chat_reaction() is
  'Insert a reaction notification for the reacted-to message author. Trigger-only: clients cannot execute it.';

revoke all on function public.notify_chat_reaction() from public, anon, authenticated;

drop trigger if exists notify_chat_reaction on public.chat_reactions;
create trigger notify_chat_reaction
  after insert on public.chat_reactions
  for each row execute function public.notify_chat_reaction();
