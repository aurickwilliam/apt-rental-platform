-- External media (Giphy GIFs and similar) keep their CDN URL in
-- attachment_url instead of a chat-images object. The document-attachment
-- rewrite of this constraint required attachment_path for every media row, so
-- URL-only image/video/gif sends were rejected.
--
-- Each media row now carries exactly one source: a storage object in the
-- sender's own folder, or an https URL. Document rules are unchanged.
alter table public.chat drop constraint chat_message_content_check;

alter table public.chat add constraint chat_message_content_check check (
  (
    message_type = 'text'
    and message is not null
    and attachment_path is null
    and attachment_url is null
  )
  or (
    message_type in ('image', 'video', 'gif')
    and message is null
    and (
      (
        attachment_path is not null
        and attachment_url is null
        and split_part(attachment_path, '/', 1) = sender_id::text
      )
      or (
        attachment_path is null
        and attachment_url is not null
        and length(attachment_url) between 8 and 2048
        and attachment_url ~ '^https://[^[:space:]]+$'
      )
    )
  )
  or (
    message_type = 'file'
    and message is null
    and attachment_path is not null
    and attachment_url is null
    and split_part(attachment_path, '/', 1) = sender_id::text
    and attachment_mime_type is not null
    and attachment_mime_type in (
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    )
    and attachment_name is not null
    and length(trim(attachment_name)) between 1 and 255
    and attachment_size is not null
    and attachment_size between 1 and 26214400
  )
);
