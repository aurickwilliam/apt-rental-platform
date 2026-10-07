-- User passport: the approved verification ID becomes the primary (main) row.
-- Adds an optional back-image path and a primary flag. One primary row per
-- user holds the front + back of the verification ID used at approval time.
-- RLS policies are unchanged.
-- Applied to the live project via the Supabase MCP; this file is the repo record.

alter table public.passport_documents
  add column if not exists storage_path_back text null,
  add column if not exists is_primary boolean not null default false;

create index if not exists passport_documents_is_primary_idx
  on public.passport_documents (user_id, is_primary)
  where is_primary;
