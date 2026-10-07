-- User passport: reusable tenant/landlord document wallet.
-- Docs live in the existing private 'application-documents' bucket under
-- {user_id}/passport/... so current owner + landlord storage policies apply
-- unchanged (first path folder is the internal users.id in both cases).
-- Applied to the live project via the Supabase MCP; this file is the repo record.

create table if not exists public.passport_documents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  doc_type text not null,
  storage_path text not null,
  mime_type text null,
  id_type text null,
  verification_id uuid null references public.user_verifications (id) on delete set null,
  is_verified boolean not null default false,
  expires_at date null,
  created_at timestamptz not null default now(),
  updated_at timestamptz null
);

create index if not exists passport_documents_user_id_idx on public.passport_documents (user_id);
create index if not exists passport_documents_storage_path_idx on public.passport_documents (storage_path);
create index if not exists passport_documents_verification_id_idx on public.passport_documents (verification_id);

alter table public.passport_documents enable row level security;

-- Owners manage their own passport rows (internal id indirection).
drop policy if exists passport_select_own on public.passport_documents;
create policy passport_select_own on public.passport_documents
  for select using (
    user_id = (select id from public.users where user_id = auth.uid())
  );

drop policy if exists passport_insert_own on public.passport_documents;
create policy passport_insert_own on public.passport_documents
  for insert with check (
    user_id = (select id from public.users where user_id = auth.uid())
  );

drop policy if exists passport_update_own on public.passport_documents;
create policy passport_update_own on public.passport_documents
  for update using (
    user_id = (select id from public.users where user_id = auth.uid())
  )
  with check (
    user_id = (select id from public.users where user_id = auth.uid())
  );

drop policy if exists passport_delete_own on public.passport_documents;
create policy passport_delete_own on public.passport_documents
  for delete using (
    user_id = (select id from public.users where user_id = auth.uid())
  );

-- Landlords reviewing an active application see the applicant's passport rows
-- so passport-linked docs stay verifiable after auto-attach by reference.
drop policy if exists passport_landlord_select_applicants on public.passport_documents;
create policy passport_landlord_select_applicants on public.passport_documents
  for select using (
    exists (
      select 1 from public.rental_application ra
      join public.apartments a on a.id = ra.apartment_id
      where ra.tenant_id = passport_documents.user_id
        and a.landlord_id = (select id from public.users where user_id = auth.uid())
        and ra.status in ('pending', 'approved')
    )
  );

-- Admins read passport rows for moderation.
drop policy if exists passport_admin_select on public.passport_documents;
create policy passport_admin_select on public.passport_documents
  for select using (
    exists (
      select 1 from public.users
      where users.user_id = auth.uid() and 'admin' = any (users.roles)
    )
  );
