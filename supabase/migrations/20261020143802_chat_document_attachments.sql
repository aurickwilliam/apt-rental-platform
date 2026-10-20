-- Document messages use the existing private attachment bucket and participant RLS.
alter table public.chat
  add column attachment_name text,
  add column attachment_size bigint;

alter table public.chat drop constraint chat_message_type_check;
alter table public.chat add constraint chat_message_type_check
  check (message_type in ('text', 'image', 'video', 'gif', 'file'));

-- Preserve existing media/GIF semantics; add a distinct, metadata-bearing file case.
alter table public.chat drop constraint chat_message_content_check;
alter table public.chat add constraint chat_message_content_check check (
  (message_type = 'text' and message is not null and attachment_path is null)
  or (message_type in ('image', 'video', 'gif') and attachment_path is not null and message is null)
  or (
    message_type = 'file' and message is null
    and attachment_path is not null and attachment_url is null
    and split_part(attachment_path, '/', 1) = sender_id::text
    and attachment_mime_type is not null
    and attachment_mime_type in (
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    )
    and attachment_name is not null and length(trim(attachment_name)) between 1 and 255
    and attachment_size is not null and attachment_size between 1 and 26214400
  )
);

alter table public.chat add constraint chat_attachment_metadata_check check (
  (attachment_name is null or length(trim(attachment_name)) between 1 and 255)
  and (attachment_size is null or attachment_size between 1 and 26214400)
);

update storage.buckets
set file_size_limit = 26214400,
    allowed_mime_types = array[
      'image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif', 'image/gif',
      'video/mp4', 'video/quicktime',
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ]
where id = 'chat-images';

-- A previous policy authorized every file in a sender's folder after any chat
-- with them. Documents must be shared by an exact message reference instead.
alter policy "Chat participants can view chat images" on storage.objects
using (
  bucket_id = 'chat-images' and (
    (storage.foldername(name))[1] = (
      select u.id::text from public.users u where u.user_id = (select auth.uid())
    )
    or exists (
      select 1 from public.chat c
      where (c.attachment_path = objects.name or c.attachment_thumbnail_path = objects.name)
        and (
          c.sender_id = (select u.id from public.users u where u.user_id = (select auth.uid()))
          or c.receiver_id = (select u.id from public.users u where u.user_id = (select auth.uid()))
        )
    )
  )
);
