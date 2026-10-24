-- Admin data needs a verified second step.
--
-- The web app already sends admins to /two-step-login (ADMIN_MFA_REQUIRED).
-- This repeats the check in the database, so a stolen sign-in that has not
-- passed the authenticator-app code (session level aal1) cannot call admin RPCs
-- or read admin-only rows directly.
--
-- Every admin check below goes through private.has_admin_second_step(). To
-- switch the requirement off in an emergency, redefine only that function to
-- `select true` (see docs/admin-provisioning.md).
--
-- Accounts that also hold tenant/landlord keep their normal access at aal1;
-- only the admin powers need the second step.

begin;

create or replace function private.has_admin_second_step()
returns boolean
language sql
stable
set search_path = ''
as $$
  select coalesce((select auth.jwt() ->> 'aal'), '') = 'aal2';
$$;

revoke all on function private.has_admin_second_step() from public, anon;
grant execute on function private.has_admin_second_step() to authenticated;

-- Used by the admin-only policies that already call private.is_admin().
create or replace function private.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select private.has_admin_second_step()
    and exists (
      select 1 from public.users
      where user_id = (select auth.uid()) and 'admin' = any (roles)
    );
$$;

-- Policies that checked the role inline now use the shared check. Those that
-- were granted to `public` are moved to `authenticated`: signed-out requests
-- have no auth.uid(), so they matched nothing before and still match nothing.
alter policy "Admins read audit logs" on public.admin_audit_logs
  using ((select private.is_admin()));

alter policy "Admins read apartment verifications" on public.apartment_verifications
  using ((select private.is_admin()));
alter policy "Admins review apartment verifications" on public.apartment_verifications
  using ((select private.is_admin()))
  with check ((select private.is_admin()));

alter policy passport_admin_select on public.passport_documents
  to authenticated
  using ((select private.is_admin()));

alter policy "Admins read verifications" on public.user_verifications
  to authenticated
  using ((select private.is_admin()));
alter policy "Admins review verifications" on public.user_verifications
  to authenticated
  using ((select private.is_admin()))
  with check ((select private.is_admin()));

alter policy "Admins read verification sessions" on public.verification_sessions
  to authenticated
  using ((select private.is_admin()));

alter policy "user-verification admin read" on storage.objects
  using (bucket_id = 'user-verification' and (select private.is_admin()));

-- Functions that checked the role inline: add the second step to that one
-- condition, leaving the rest of each body untouched. Each is expected to match
-- exactly once, so a changed body fails the migration instead of being skipped.
-- Not touched on purpose: the notify_* triggers (they pick admin recipients, not
-- the caller) and the target-account check inside admin_set_user_access.
do $migration$
declare
  -- Matches 'admin' = any(roles) or any(u.roles) and captures the column. The
  -- target-account check in admin_set_user_access (any(v_target.roles)) does not
  -- match: the column must follow the parenthesis directly.
  admin_check constant text := $re$'admin'\s*=\s*any\s*\(\s*((?:u\.)?roles)\s*\)$re$;
  signature text;
  definition text;
  matches integer;
begin
  foreach signature in array array[
    'public.admin_resolve_user_report(uuid,text,text)',
    'public.admin_set_apartment_visibility(uuid,boolean,text)',
    'public.admin_set_user_access(uuid,boolean,text)',
    'public.get_admin_analytics_start_date()',
    'public.get_admin_analytics_trends(date,date)',
    'public.get_admin_analytics(date,date)',
    'public.get_admin_application_status()',
    'public.get_admin_dashboard_trends(date,date)',
    'public.get_admin_listing_status()',
    'public.get_admin_listings_by_city()',
    'public.get_admin_rental_payment_trends(date,date)',
    'public.guard_passport_document_delete()',
    'public.guard_passport_document_insert()',
    'public.sync_apartment_verification_review()',
    'public.sync_passport_document_review()'
  ]
  loop
    definition := pg_get_functiondef(signature::regprocedure);
    select count(*) into matches from regexp_matches(definition, admin_check, 'g');
    if matches <> 1 then
      raise exception 'Expected one admin role check in %, found %', signature, matches;
    end if;
    execute regexp_replace(
      definition,
      admin_check,
      $rep$('admin' = any(\1) and private.has_admin_second_step())$rep$
    );
  end loop;
end
$migration$;

commit;
