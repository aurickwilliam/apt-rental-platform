-- APT Passport: one supporting document per type, replaced in place.
--
--  1. A user can add a given supporting type only once. New duplicates are
--     refused by a trigger (not a unique index, so duplicates that already
--     exist stay readable and nothing is deleted).
--  2. replace_passport_document() swaps the file of the caller's own document.
--     The document goes back to "unverified": verified/pending/rejected state,
--     reviewer fields and the rejection reason are cleared, so a verified badge
--     can never move onto a different file. The owner-side content lock in
--     sync_passport_document_review() is lifted only inside this function.
--     Identity documents (primary ID / verification-linked) cannot be replaced.

-- 1. One supporting document per type -------------------------------------------

create or replace function public.guard_passport_document_unique_type()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Identity rows are managed by account verification, not by this rule.
  if NEW.is_primary or NEW.verification_id is not null then
    return NEW;
  end if;

  -- Serialise concurrent inserts of the same type for the same user.
  perform pg_advisory_xact_lock(hashtext(NEW.user_id::text || ':' || NEW.doc_type));

  if exists (
    select 1 from public.passport_documents d
    where d.user_id = NEW.user_id
      and d.doc_type = NEW.doc_type
      and not d.is_primary
      and d.verification_id is null
  ) then
    raise exception 'You already added a % document. Open it to replace the file.', NEW.doc_type;
  end if;

  return NEW;
end;
$$;

revoke all on function public.guard_passport_document_unique_type() from public, anon, authenticated;

drop trigger if exists guard_passport_document_unique_type on public.passport_documents;
create trigger guard_passport_document_unique_type
  before insert on public.passport_documents
  for each row
  execute function public.guard_passport_document_unique_type();

-- 2. Replace flag in the review trigger -----------------------------------------
-- Same body as the live function, plus an early return while
-- replace_passport_document() sets its transaction-local flag.

create or replace function public.sync_passport_document_review()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_actor_id uuid;
  v_is_admin boolean;
  v_approved_verification uuid;
begin
  -- replace_passport_document() has already validated the caller and reset the
  -- review fields; its transaction-local flag lifts the owner content lock.
  if coalesce(current_setting('app.passport_replace', true), '') = 'on' then
    NEW.updated_at := now();
    return NEW;
  end if;

  select id into v_actor_id
  from public.users
  where user_id = auth.uid();

  select exists (
    select 1 from public.users
    where user_id = auth.uid() and ('admin' = any(roles) and private.has_admin_second_step())
  ) into v_is_admin;

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
$function$;

revoke all on function public.sync_passport_document_review() from public, anon, authenticated;

-- 3. Replace RPC ------------------------------------------------------------------

create or replace function public.replace_passport_document(
  p_document_id uuid,
  p_storage_path text,
  p_mime_type text,
  p_expires_at date
)
returns public.passport_documents
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor_id uuid;
  v_document public.passport_documents;
begin
  select id into v_actor_id from public.users where user_id = auth.uid();
  if v_actor_id is null then
    raise exception 'Sign in to replace a document.';
  end if;

  select * into v_document
  from public.passport_documents
  where id = p_document_id and user_id = v_actor_id
  for update;
  if not found then
    raise exception 'Document not found.';
  end if;

  if v_document.is_primary or v_document.verification_id is not null then
    raise exception 'Identity documents are managed through account verification.';
  end if;

  -- The new file must already be uploaded, inside the caller's own folder.
  if p_storage_path is null or split_part(p_storage_path, '/', 1) <> v_actor_id::text then
    raise exception 'Upload the new file to your own Passport folder first.';
  end if;
  if not exists (
    select 1 from storage.objects o
    where o.bucket_id = 'application-documents' and o.name = p_storage_path
  ) then
    raise exception 'The new file was not found. Upload it again.';
  end if;

  if p_expires_at is not null and p_expires_at < current_date then
    raise exception 'Expiry date cannot be in the past.';
  end if;

  perform set_config('app.passport_replace', 'on', true);

  update public.passport_documents
  set storage_path = p_storage_path,
      storage_path_back = null,
      mime_type = p_mime_type,
      expires_at = p_expires_at,
      review_status = 'unverified',
      is_verified = false,
      requested_at = null,
      reviewed_at = null,
      reviewed_by = null,
      rejection_reason = null,
      updated_at = now()
  where id = p_document_id
  returning * into v_document;

  perform set_config('app.passport_replace', '', true);

  return v_document;
end;
$$;

revoke all on function public.replace_passport_document(uuid, text, text, date) from public, anon;
grant execute on function public.replace_passport_document(uuid, text, text, date) to authenticated;
