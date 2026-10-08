-- Passport document integrity hardening.
--  1. INSERT guard: owners can no longer insert pre-verified / primary rows.
--  2. Content lock: file + metadata columns are frozen while a document is
--     pending review or verified (owner side), so a verified badge can't be
--     moved onto a different file.
--  3. DELETE guard: primary/linked rows and rows under review cannot be
--     deleted by their owner, regardless of client checks.
-- Service-role connections (auth.uid() is null) and admins are not restricted.
-- The approved-ID link path (linkApprovedVerification) stays allowed.

-- 1. INSERT guard ---------------------------------------------------------------

create or replace function public.guard_passport_document_insert()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor_id uuid;
begin
  if auth.uid() is null then
    return NEW;
  end if;

  if exists (
    select 1 from public.users
    where user_id = auth.uid() and 'admin' = any (roles)
  ) then
    return NEW;
  end if;

  select id into v_actor_id from public.users where user_id = auth.uid();

  if NEW.verification_id is not null then
    -- Linking the user's own approved ID verification as the primary row.
    if not exists (
      select 1 from public.user_verifications uv
      where uv.id = NEW.verification_id
        and uv.user_id = v_actor_id
        and uv.status = 'approved'
    ) then
      raise exception 'Document verification is managed by admins. Request a review instead.';
    end if;
    return NEW;
  end if;

  if NEW.is_verified
    or NEW.is_primary
    or NEW.review_status is distinct from 'unverified'
    or NEW.storage_path_back is not null then
    raise exception 'Document verification is managed by admins. Request a review instead.';
  end if;

  NEW.requested_at := null;
  NEW.reviewed_at := null;
  NEW.reviewed_by := null;
  NEW.rejection_reason := null;
  return NEW;
end;
$$;

revoke all on function public.guard_passport_document_insert() from public, anon, authenticated;

drop trigger if exists guard_passport_document_insert on public.passport_documents;
create trigger guard_passport_document_insert
  before insert on public.passport_documents
  for each row
  execute function public.guard_passport_document_insert();

-- 2. Content lock (extends the existing review trigger) -----------------------------

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
  if not v_is_admin and auth.uid() is not null then
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

    -- Content lock: the file and its metadata are frozen while the document is
    -- pending or verified. The only owner exception is re-syncing a linked
    -- verification row to its approved front/back captures.
    if (OLD.review_status in ('pending', 'verified') or OLD.is_verified)
      and (NEW.user_id is distinct from OLD.user_id
        or NEW.doc_type is distinct from OLD.doc_type
        or NEW.id_type is distinct from OLD.id_type
        or NEW.mime_type is distinct from OLD.mime_type
        or NEW.expires_at is distinct from OLD.expires_at
        or NEW.storage_path is distinct from OLD.storage_path
        or NEW.storage_path_back is distinct from OLD.storage_path_back) then
      if OLD.verification_id is null
        or NEW.verification_id is distinct from OLD.verification_id
        or NEW.user_id is distinct from OLD.user_id
        or not exists (
          select 1 from public.user_verifications uv
          where uv.id = NEW.verification_id
            and uv.user_id = NEW.user_id
            and uv.status = 'approved'
            and uv.id_front_path = NEW.storage_path
            and uv.id_back_path is not distinct from NEW.storage_path_back
        ) then
        raise exception 'This document is under review or verified and can no longer be changed.';
      end if;
    end if;
  end if;

  NEW.updated_at := now();
  return NEW;
end;
$$;

revoke all on function public.sync_passport_document_review() from public, anon, authenticated;

-- 3. DELETE guard ------------------------------------------------------------------

create or replace function public.guard_passport_document_delete()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Service role, migrations and FK cascades (account removal) are not blocked.
  if auth.uid() is null or pg_trigger_depth() > 1 then
    return OLD;
  end if;

  if exists (
    select 1 from public.users
    where user_id = auth.uid() and 'admin' = any (roles)
  ) then
    return OLD;
  end if;

  if OLD.is_primary or OLD.verification_id is not null then
    raise exception 'Your primary verification ID is managed automatically and cannot be deleted.';
  end if;
  if OLD.review_status = 'pending' then
    raise exception 'This document is under admin review and cannot be deleted yet.';
  end if;

  return OLD;
end;
$$;

revoke all on function public.guard_passport_document_delete() from public, anon, authenticated;

drop trigger if exists guard_passport_document_delete on public.passport_documents;
create trigger guard_passport_document_delete
  before delete on public.passport_documents
  for each row
  execute function public.guard_passport_document_delete();
