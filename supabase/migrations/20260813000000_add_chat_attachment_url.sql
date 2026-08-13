-- Chat attachments can now be external URLs (e.g. Giphy CDN) stored verbatim,
-- instead of a storage path in the private chat-images bucket. Backfill is
-- unnecessary: this column is only written by new sends.
alter table public.chat
  add column attachment_url text;

comment on column public.chat.attachment_url is
  'External media URL (e.g. Giphy CDN) for attachments stored off-platform; null for storage-backed attachments.';