-- Account verification submissions (mobile Verify Account flow).
--
-- A user submits: government-ID front (+ back for card IDs), and a selfie
-- holding the same ID. Files live in the private `user-verification` bucket
-- at `{users.id}/{verification_id}/{id-front|id-back|selfie}.jpg`; this table
-- stores storage paths only (never public URLs), resolved to signed URLs on
-- read via the app's privateMediaResolver.
--
-- Status model: `user_verifications.status` is pending|approved|rejected.
-- The user-facing `users.account_status` (unverified|pending|verified|rejected)
-- is synced by the triggers below and remains the mobile app's display source.
-- Rejected rows stay as history; a new submission is allowed after rejection.
-- A partial unique index allows only one active `pending` row per user.
--
-- id_back_path is nullable: single-page IDs (Passport identity page) have no
-- back capture; the app stores the identity page in id_front_path.
--
-- Admin review is backend-only for now (no admin UI in the repo): admins use
-- the documented queue query (see "Admin handoff" below) and review by
-- updating ONLY status (+ rejection_reason when rejecting). reviewed_at /
-- reviewed_by are stamped by the trigger from auth.uid(), never trusted from
-- the client. The column-level UPDATE grant below enforces the review-only
-- shape at the privilege level; normal users have no UPDATE/DELETE policy
-- at all.
--
-- Verified users cannot resubmit: reject_verified_resubmission() blocks
-- inserts while users.account_status = 'verified' (the app also guards this
-- client-side, but RLS is the real boundary).
--
-- Notifications reuse create_notification() (server-side only): submission
-- notifies every admin; review notifies the submitting user. Payloads carry
-- `screen: 'verification'` (no apartmentId exists for this domain; the client
-- deep-links to the role-aware profile screen instead).

-- Table --------------------------------------------------------------------

create table if not exists public.user_verifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  id_type text not null,
  id_front_path text not null,
  id_back_path text null,
  selfie_path text not null,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  rejection_reason text null,
  submitted_at timestamptz not null default now(),
  reviewed_at timestamptz null,
  reviewed_by uuid null references public.users (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz null
);

create index if not exists user_verifications_user_idx
  on public.user_verifications (user_id);

create unique index if not exists user_verifications_one_pending_per_user
  on public.user_verifications (user_id)
  where status = 'pending';

-- Grants (table privileges are checked before RLS) --------------------------
-- UPDATE is granted on the review columns only, so even an admin JWT cannot
-- rewrite ownership, paths, or timestamps; reviewed_at/reviewed_by are set
-- by the review trigger itself (SECURITY DEFINER, unaffected by grants).

grant select, insert on public.user_verifications to authenticated;
grant update (status, rejection_reason) on public.user_verifications to authenticated;

-- RLS -----------------------------------------------------------------------

alter table public.user_verifications enable row level security;

-- Owners read only their own submissions.
create policy "Users read own verifications"
  on public.user_verifications for select
  using (user_id = (select id from public.users where user_id = auth.uid()));

-- Owners insert only their own row, always as pending, and cannot preset
-- review columns (reviewed_by/reviewed_at are trigger-stamped on review).
create policy "Users insert own pending verification"
  on public.user_verifications for insert
  with check (
    user_id = (select id from public.users where user_id = auth.uid())
    and status = 'pending'
    and reviewed_by is null
    and reviewed_at is null
  );

-- No owner UPDATE/DELETE policy: users cannot change status, rejection
-- reasons, or review metadata, and cannot delete history.

-- Admins read the full review queue.
create policy "Admins read verifications"
  on public.user_verifications for select
  using ((select role from public.users where user_id = auth.uid()) = 'admin');

-- Admins review: update any row. The trigger restricts transitions to
-- pending -> approved|rejected and stamps reviewed_at/reviewed_by itself.
create policy "Admins review verifications"
  on public.user_verifications for update
  using ((select role from public.users where user_id = auth.uid()) = 'admin')
  with check ((select role from public.users where user_id = auth.uid()) = 'admin');

-- Admin handoff: review-queue query (RLS-scoped to admins) -------------------
--
-- select v.id, v.id_type, v.status, v.submitted_at, v.rejection_reason,
--        v.id_front_path, v.id_back_path, v.selfie_path,
--        u.id as user_id, u.first_name, u.last_name, u.email, u.role
--   from public.user_verifications v
--   join public.users u on u.id = v.user_id
--  where v.status = 'pending'
--  order by v.submitted_at asc;
--
-- Approve: update public.user_verifications set status = 'approved' where id = ...;
-- Reject:  update public.user_verifications
--             set status = 'rejected', rejection_reason = '...'
--           where id = ...;
-- Read the three paths with signed URLs (privateMediaResolver,
-- bucket 'user-verification'). Never expose public URLs.

-- Submission guards: verified accounts cannot open a new submission --------

create or replace function public.reject_verified_resubmission()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_status text;
begin
  select account_status into v_status
  from public.users
  where id = NEW.user_id;

  if v_status = 'verified' then
    raise exception 'Verified accounts cannot submit a new verification.';
  end if;

  return NEW;
end;
$$;

drop trigger if exists reject_verified_resubmission on public.user_verifications;
create trigger reject_verified_resubmission
  before insert on public.user_verifications
  for each row
  execute function public.reject_verified_resubmission();

-- Review sync: validate transition, stamp review, sync users.account_status --

create or replace function public.sync_verification_review()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_reviewer_id uuid;
begin
  if OLD.status <> 'pending' then
    raise exception 'Only pending verification submissions can be reviewed.';
  end if;

  if NEW.status not in ('approved', 'rejected') then
    raise exception 'Verification status must move to approved or rejected.';
  end if;

  if NEW.status = 'rejected'
    and (NEW.rejection_reason is null or btrim(NEW.rejection_reason) = '') then
    raise exception 'A rejection reason is required to reject a verification.';
  end if;

  if NEW.status = 'approved' then
    NEW.rejection_reason := null;
  end if;

  select id into v_reviewer_id
  from public.users
  where user_id = auth.uid();

  NEW.reviewed_by := v_reviewer_id;
  NEW.reviewed_at := now();
  NEW.updated_at := now();

  update public.users
  set account_status = case NEW.status when 'approved' then 'verified' else 'rejected' end,
      updated_at = now()
  where id = NEW.user_id;

  return NEW;
end;
$$;

drop trigger if exists sync_verification_review on public.user_verifications;
create trigger sync_verification_review
  before update of status on public.user_verifications
  for each row
  execute function public.sync_verification_review();

-- Submission sync: a new submission moves the user to pending --------------

create or replace function public.set_verification_submitted()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.users
  set account_status = 'pending',
      updated_at = now()
  where id = NEW.user_id;

  return NEW;
end;
$$;

drop trigger if exists set_verification_submitted on public.user_verifications;
create trigger set_verification_submitted
  after insert on public.user_verifications
  for each row
  execute function public.set_verification_submitted();

-- Notifications (server-side only, via create_notification) -----------------

create or replace function public.notify_verification_submitted()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  r_admin record;
begin
  for r_admin in
    select id from public.users where role = 'admin'
  loop
    perform public.create_notification(
      r_admin.id,
      'system',
      'New account verification submitted',
      'A user submitted ID documents for verification.',
      jsonb_build_object('screen', 'verification', 'verificationId', NEW.id)
    );
  end loop;

  return NEW;
end;
$$;

drop trigger if exists notify_verification_submitted on public.user_verifications;
create trigger notify_verification_submitted
  after insert on public.user_verifications
  for each row
  execute function public.notify_verification_submitted();

create or replace function public.notify_verification_reviewed()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if NEW.status is distinct from OLD.status and NEW.status in ('approved', 'rejected') then
    if NEW.status = 'approved' then
      perform public.create_notification(
        NEW.user_id,
        'system',
        'Account verification approved',
        'Your account is now verified.',
        jsonb_build_object('screen', 'verification', 'verificationId', NEW.id)
      );
    else
      perform public.create_notification(
        NEW.user_id,
        'system',
        'Account verification rejected',
        coalesce(NEW.rejection_reason, 'Your documents could not be verified.'),
        jsonb_build_object('screen', 'verification', 'verificationId', NEW.id)
      );
    end if;
  end if;

  return NEW;
end;
$$;

drop trigger if exists notify_verification_reviewed on public.user_verifications;
create trigger notify_verification_reviewed
  after update of status on public.user_verifications
  for each row
  execute function public.notify_verification_reviewed();

-- Private bucket ------------------------------------------------------------
-- (Follows 20260817030000_create_email_assets_bucket.sql; app buckets are
-- otherwise dashboard-created. Paths: {users.id}/{verification_id}/...)

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('user-verification', 'user-verification', false, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

-- Owners upload only into their own verification folder.
create policy "user-verification owner insert"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'user-verification'
    and (storage.foldername(name))[1] = (select id::text from public.users where user_id = auth.uid())
  );

-- Owners read only their own verification files.
create policy "user-verification owner read"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'user-verification'
    and (storage.foldername(name))[1] = (select id::text from public.users where user_id = auth.uid())
  );

-- Owners may delete their own files (upload-rollback cleanup uses the anon key).
create policy "user-verification owner delete"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'user-verification'
    and (storage.foldername(name))[1] = (select id::text from public.users where user_id = auth.uid())
  );

-- Admins read all verification files for manual review.
create policy "user-verification admin read"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'user-verification'
    and (select role from public.users where user_id = auth.uid()) = 'admin'
  );
