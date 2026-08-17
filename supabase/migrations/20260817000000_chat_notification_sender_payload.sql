-- Enrich chat notification payload with sender identity so in-app toasts can
-- render the sender's profile picture (avatar) without a client-side fetch.
-- senderAvatarUrl is stored verbatim from users.avatar_url (public URL).

create or replace function public.notify_chat_message()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_sender_name text;
  v_sender_avatar text;
  v_preview text;
begin
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

  perform public.create_notification(
    NEW.receiver_id,
    'message',
    coalesce(nullif(v_sender_name, ''), 'New Message'),
    v_preview,
    jsonb_build_object(
      'screen', 'chat',
      'apartmentId', NEW.apartment_id,
      'conversationKey',
        'chat:' || coalesce(NEW.apartment_id::text, 'none') || ':' ||
        least(NEW.sender_id::text, NEW.receiver_id::text) || ':' ||
        greatest(NEW.sender_id::text, NEW.receiver_id::text),
      'senderId', NEW.sender_id,
      'senderAvatarUrl', v_sender_avatar
    )
  );

  return NEW;
end;
$$;