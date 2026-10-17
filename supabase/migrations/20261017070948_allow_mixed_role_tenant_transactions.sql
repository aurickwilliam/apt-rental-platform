-- Mixed admin/tenant profiles may create new tenant-side records, matching the
-- landlord-finance rule (20261017064029_allow_mixed_role_landlord_finances):
-- holding the consumer role permits its own-scoped actions, and admin
-- membership itself grants nothing.
--
-- Previously a "not admin" veto applied here, so a tenant later promoted to
-- admin (promotion keeps existing roles) could no longer apply, request a
-- visit, favorite, sign a tenancy, pay, or review. The tenant role is still
-- required - it is just no longer cancelled by admin - so admin-only profiles
-- keep zero consumer access.
--
-- The application guards also stop exempting admins: an admin+tenant applicant
-- passes the same verification, document and immutability checks as anyone
-- else. Service-role and operator paths (auth.uid() is null) stay unrestricted.
--
-- No data changes: inserts that were rejected before are now accepted.

create or replace function public.require_tenant_membership_for_new_transaction()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_tenant_id uuid := new.tenant_id;
begin
  if tg_op = 'UPDATE' then
    if new.tenant_id is not distinct from old.tenant_id
      and (to_jsonb(new)->'apartment_id') is not distinct from (to_jsonb(old)->'apartment_id')
      and (to_jsonb(new)->'landlord_id') is not distinct from (to_jsonb(old)->'landlord_id')
      and (to_jsonb(new)->'tenancy_id') is not distinct from (to_jsonb(old)->'tenancy_id')
      and (to_jsonb(new)->'application_id') is not distinct from (to_jsonb(old)->'application_id') then
      return new;
    end if;
  end if;

  if tg_table_name = 'payment' then
    if v_tenant_id is null and (to_jsonb(new)->>'tenancy_id') is not null then
      select tenant_id into v_tenant_id from public.tenancies
      where id = (to_jsonb(new)->>'tenancy_id')::uuid;
    end if;
  end if;

  if v_tenant_id is not null and not exists (
    select 1 from public.users u
    where u.id = v_tenant_id
      and 'tenant' = any(u.roles)
  ) then
    raise exception 'A current tenant role is required for new tenant transactions.'
      using errcode = '23514';
  end if;

  return new;
end;
$$;

revoke all on function public.require_tenant_membership_for_new_transaction() from public, anon, authenticated;

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
