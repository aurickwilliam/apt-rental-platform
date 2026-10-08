-- Server-side enforcement for rental applications.
-- Until now the app (mobile) checked these rules and the database only enforced
-- one pending application per apartment, so a modified client could skip them.
--
-- On INSERT (authenticated, non-admin; service role and admins are unrestricted):
--   * the applicant's account must be verified;
--   * proof of income is required unless employment is Student/Unemployed;
--   * every document path must be the applicant's own and valid:
--       - in the applicant's own folder (`{users.id}/...`);
--       - a Passport document that is not rejected and not expired, or
--       - (ID only) an approved verification capture, or
--       - an uploaded file that exists in `application-documents` (web flow);
--   * the ID back must belong to the attached ID (same approved verification,
--     or the same Passport row).
-- On UPDATE: tenant, apartment and all document columns are frozen so the
-- insert-time checks cannot be bypassed by editing the row afterwards.
-- Status changes (cancel / approve / reject) are unaffected.

create or replace function private.application_document_problem(
  p_tenant uuid,
  p_path text,
  p_label text,
  p_allow_id_capture boolean
)
returns text
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_pd record;
begin
  if p_path is null then
    return null;
  end if;

  if (storage.foldername(p_path))[1] is distinct from p_tenant::text then
    return p_label || ' must be one of your own documents.';
  end if;

  select pd.review_status, pd.expires_at, (pd.id_type is not null or pd.verification_id is not null) as is_identity
  into v_pd
  from public.passport_documents pd
  where pd.user_id = p_tenant
    and (pd.storage_path = p_path or pd.storage_path_back = p_path)
  order by pd.is_verified desc
  limit 1;

  if found then
    if v_pd.is_identity and not p_allow_id_capture then
      return p_label || ' cannot be an ID document.';
    end if;
    if v_pd.review_status = 'rejected' then
      return p_label || ' was rejected. Upload a new copy to your APT Passport.';
    end if;
    if v_pd.expires_at is not null and v_pd.expires_at < current_date then
      return p_label || ' has expired. Upload a current copy to your APT Passport.';
    end if;
    return null;
  end if;

  if p_allow_id_capture and exists (
    select 1 from public.user_verifications uv
    where uv.user_id = p_tenant
      and uv.status = 'approved'
      and p_path in (uv.id_front_path, uv.id_back_path)
  ) then
    return null;
  end if;

  if exists (
    select 1 from storage.objects o
    where o.bucket_id = 'application-documents' and o.name = p_path
  ) then
    return null;
  end if;

  return p_label || ' could not be found.';
end;
$$;

revoke all on function private.application_document_problem(uuid, text, text, boolean) from public, anon, authenticated;

create or replace function public.guard_rental_application_insert()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_problem text;
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

  if not exists (
    select 1 from public.users
    where id = NEW.tenant_id and account_status = 'verified'
  ) then
    raise exception 'Verify your account before applying.' using errcode = '23514';
  end if;

  if lower(btrim(NEW.employment_type)) not in ('student', 'unemployed')
    and NEW.proof_of_income_url is null then
    raise exception 'Proof of income is required for your employment type.' using errcode = '23514';
  end if;

  v_problem := coalesce(
    private.application_document_problem(NEW.tenant_id, NEW.gov_id_url, 'Government ID', true),
    private.application_document_problem(NEW.tenant_id, NEW.proof_of_income_url, 'Proof of income', false),
    private.application_document_problem(NEW.tenant_id, NEW.proof_of_billing_url, 'Proof of billing', false),
    private.application_document_problem(NEW.tenant_id, NEW.nbi_clearance_url, 'NBI clearance', false)
  );
  if v_problem is not null then
    raise exception '%', v_problem using errcode = '23514';
  end if;

  if NEW.gov_id_back_url is not null and not (
    exists (
      select 1 from public.user_verifications uv
      where uv.user_id = NEW.tenant_id
        and uv.status = 'approved'
        and uv.id_front_path = NEW.gov_id_url
        and uv.id_back_path = NEW.gov_id_back_url
    )
    or exists (
      select 1 from public.passport_documents pd
      where pd.user_id = NEW.tenant_id
        and pd.storage_path = NEW.gov_id_url
        and pd.storage_path_back = NEW.gov_id_back_url
        and pd.review_status <> 'rejected'
        and (pd.expires_at is null or pd.expires_at >= current_date)
    )
  ) then
    raise exception 'The ID back must belong to the ID you attached.' using errcode = '23514';
  end if;

  return NEW;
end;
$$;

revoke all on function public.guard_rental_application_insert() from public, anon, authenticated;

drop trigger if exists guard_rental_application_insert on public.rental_application;
create trigger guard_rental_application_insert
  before insert on public.rental_application
  for each row
  execute function public.guard_rental_application_insert();

create or replace function public.guard_rental_application_update()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
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

  if NEW.tenant_id is distinct from OLD.tenant_id
    or NEW.apartment_id is distinct from OLD.apartment_id
    or NEW.gov_id_url is distinct from OLD.gov_id_url
    or NEW.gov_id_back_url is distinct from OLD.gov_id_back_url
    or NEW.proof_of_income_url is distinct from OLD.proof_of_income_url
    or NEW.proof_of_billing_url is distinct from OLD.proof_of_billing_url
    or NEW.nbi_clearance_url is distinct from OLD.nbi_clearance_url then
    raise exception 'Application documents cannot be changed after submitting.' using errcode = '23514';
  end if;

  return NEW;
end;
$$;

revoke all on function public.guard_rental_application_update() from public, anon, authenticated;

drop trigger if exists guard_rental_application_update on public.rental_application;
create trigger guard_rental_application_update
  before update on public.rental_application
  for each row
  execute function public.guard_rental_application_update();
