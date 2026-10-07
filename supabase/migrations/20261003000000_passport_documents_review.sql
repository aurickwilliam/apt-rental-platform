-- Tenant-requested Passport document review (v1).
-- Supporting docs (proof of income, NBI) can be submitted for admin review.
-- Identity docs stay linked from approved user_verifications via
-- linkApprovedVerification(); this queue is only for tenant-attested uploads.
-- Applied to the live project via the Supabase MCP; this file is the repo record.

-- Columns ------------------------------------------------------------------
alter table public.passport_documents
  add column if not exists review_status text not null default 'unverified'
    check (review_status in ('unverified', 'pending', 'verified', 'rejected')),
  add column if not exists requested_at timestamptz null,
  add column if not exists reviewed_at timestamptz null,
  add column if not exists reviewed_by uuid null references public.users (id),
  add column if not exists rejection_reason text null;

-- Backfill: docs already linked from approved verifications count as verified.
update public.passport_documents
set review_status = 'verified'
where is_verified = true and review_status = 'unverified';

create index if not exists passport_documents_review_pending_idx
  on public.passport_documents (requested_at)
  where review_status = 'pending';

-- Audit log vocabulary -------------------------------------------------------
-- Keep earlier values; append passport-document actions/targets.
alter table public.admin_audit_logs drop constraint if exists admin_audit_logs_action_check;
alter table public.admin_audit_logs add constraint admin_audit_logs_action_check check (action in (
  'USER_VERIFICATION_APPROVED', 'USER_VERIFICATION_REJECTED',
  'PROPERTY_VERIFICATION_APPROVED', 'PROPERTY_VERIFICATION_REJECTED',
  'USER_SUSPENDED', 'USER_REACTIVATED', 'APARTMENT_HIDDEN', 'APARTMENT_RESTORED',
  'PASSPORT_DOCUMENT_APPROVED', 'PASSPORT_DOCUMENT_REJECTED'
));
alter table public.admin_audit_logs drop constraint if exists admin_audit_logs_target_type_check;
alter table public.admin_audit_logs add constraint admin_audit_logs_target_type_check check (
  target_type in ('user_verification', 'apartment_verification', 'user', 'apartment', 'passport_document')
);

-- Review sync ----------------------------------------------------------------
-- Single trigger guards both transitions:
--  * owner: unverified|rejected -> pending (requests review, stamps requested_at)
--  * admin: pending -> verified|rejected (stamps reviewer, syncs is_verified)
-- Owner self-verification stays blocked: is_verified/is_primary/verification_id
-- may only change owner-side when linking an approved user_verifications row
-- (the existing linkApprovedVerification path); all other owner writes to
-- those columns raise. Admin review writes is_verified itself.

create or replace function public.sync_passport_document_review()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor_id uuid;
  v_is_admin boolean;
  v_approved_verification uuid;
begin
  select id into v_actor_id
  from public.users
  where user_id = auth.uid();

  select exists (
    select 1 from public.users
    where user_id = auth.uid() and 'admin' = any (roles)
  ) into v_is_admin;

  -- Review-status transitions -------------------------------------------------
  if NEW.review_status is distinct from OLD.review_status then
    if NEW.review_status = 'pending' then
      if OLD.review_status not in ('unverified', 'rejected') then
        raise exception 'Only unverified or rejected documents can be submitted for review.';
      end if;
      if v_is_admin then
        raise exception 'Admins cannot request document review.';
      end if;
      if NEW.user_id != v_actor_id then
        raise exception 'You can only request review of your own documents.';
      end if;
      NEW.requested_at := now();
      NEW.reviewed_at := null;
      NEW.reviewed_by := null;
      NEW.rejection_reason := null;
    elsif NEW.review_status in ('verified', 'rejected') then
      if OLD.review_status != 'pending' then
        raise exception 'Only pending documents can be reviewed.';
      end if;
      if not v_is_admin then
        raise exception 'Only admins can approve or reject documents.';
      end if;
      if NEW.review_status = 'rejected'
        and (NEW.rejection_reason is null or btrim(NEW.rejection_reason) = '') then
        raise exception 'A rejection reason is required to reject a document.';
      end if;
      if NEW.review_status = 'verified' then
        NEW.rejection_reason := null;
      end if;
      NEW.reviewed_by := v_actor_id;
      NEW.reviewed_at := now();
      NEW.is_verified := (NEW.review_status = 'verified');
    else
      raise exception 'Invalid document review status.';
    end if;
  end if;

  -- Guard server-managed columns against owner writes --------------------------
  if not v_is_admin then
    if NEW.reviewed_by is distinct from OLD.reviewed_by
      or NEW.reviewed_at is distinct from OLD.reviewed_at then
      raise exception 'Review metadata is managed by admins.';
    end if;
    if NEW.rejection_reason is distinct from OLD.rejection_reason
      and not (OLD.review_status is distinct from NEW.review_status and NEW.review_status = 'pending') then
      raise exception 'Rejection reasons are managed by admins.';
    end if;
    if (NEW.is_verified is distinct from OLD.is_verified
      or NEW.is_primary is distinct from OLD.is_primary
      or NEW.verification_id is distinct from OLD.verification_id) then
      -- Allowed owner path: linking the user's own approved ID verification
      -- (front/back captures) as the primary passport row.
      select uv.id into v_approved_verification
      from public.user_verifications uv
      where uv.id = NEW.verification_id
        and uv.user_id = NEW.user_id
        and uv.status = 'approved'
      limit 1;
      if NEW.verification_id is null or v_approved_verification is null then
        raise exception 'Document verification is managed by admins. Request a review instead.';
      end if;
    end if;
  end if;

  NEW.updated_at := now();
  return NEW;
end;
$$;

revoke all on function public.sync_passport_document_review() from public, anon, authenticated;

drop trigger if exists sync_passport_document_review on public.passport_documents;
create trigger sync_passport_document_review
  before update on public.passport_documents
  for each row
  execute function public.sync_passport_document_review();

-- Audit -----------------------------------------------------------------------

create or replace function public.write_passport_document_audit()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if NEW.review_status is distinct from OLD.review_status
    and NEW.review_status in ('verified', 'rejected') then
    insert into public.admin_audit_logs (admin_id, action, target_type, target_id, reason)
    values (
      NEW.reviewed_by,
      case when NEW.review_status = 'verified'
        then 'PASSPORT_DOCUMENT_APPROVED' else 'PASSPORT_DOCUMENT_REJECTED' end,
      'passport_document',
      NEW.id,
      NEW.rejection_reason
    );
  end if;
  return NEW;
end;
$$;

revoke all on function public.write_passport_document_audit() from public, anon, authenticated;

drop trigger if exists audit_passport_document_review on public.passport_documents;
create trigger audit_passport_document_review
  after update of review_status on public.passport_documents
  for each row
  execute function public.write_passport_document_audit();

-- Notifications (server-side only, via create_notification) ---------------------

create or replace function public.notify_passport_document_submitted()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  r_admin record;
begin
  if NEW.review_status = 'pending'
    and (OLD.review_status is distinct from NEW.review_status) then
    for r_admin in
      select id from public.users where 'admin' = any (roles)
    loop
      perform public.create_notification(
        r_admin.id,
        'system',
        'New passport document submitted',
        'A tenant submitted a document for verification.',
        jsonb_build_object('screen', 'passport', 'documentId', NEW.id)
      );
    end loop;
  end if;
  return NEW;
end;
$$;

revoke all on function public.notify_passport_document_submitted() from public, anon, authenticated;

drop trigger if exists notify_passport_document_submitted on public.passport_documents;
create trigger notify_passport_document_submitted
  after update of review_status on public.passport_documents
  for each row
  execute function public.notify_passport_document_submitted();

create or replace function public.notify_passport_document_reviewed()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if NEW.review_status is distinct from OLD.review_status
    and NEW.review_status in ('verified', 'rejected') then
    if NEW.review_status = 'verified' then
      perform public.create_notification(
        NEW.user_id,
        'system',
        'Passport document verified',
        'Your document was verified.',
        jsonb_build_object('screen', 'passport', 'documentId', NEW.id)
      );
    else
      perform public.create_notification(
        NEW.user_id,
        'system',
        'Passport document rejected',
        coalesce(NEW.rejection_reason, 'Your document could not be verified.'),
        jsonb_build_object('screen', 'passport', 'documentId', NEW.id)
      );
    end if;
  end if;
  return NEW;
end;
$$;

revoke all on function public.notify_passport_document_reviewed() from public, anon, authenticated;

drop trigger if exists notify_passport_document_reviewed on public.passport_documents;
create trigger notify_passport_document_reviewed
  after update of review_status on public.passport_documents
  for each row
  execute function public.notify_passport_document_reviewed();

-- RLS: admins review others' rows ----------------------------------------------
-- Owners keep existing CRUD via passport_*_own policies; admins need UPDATE on
-- rows they do not own. SELECT already covered by passport_admin_select.

drop policy if exists passport_admin_update on public.passport_documents;
create policy passport_admin_update on public.passport_documents
  for update to authenticated
  using ((select private.is_admin()))
  with check ((select private.is_admin()));
