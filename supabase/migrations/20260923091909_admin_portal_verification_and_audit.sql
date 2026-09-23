-- Admin portal: apartment verification workflow and append-only review audit.

create table public.apartment_verifications (
  id uuid primary key default gen_random_uuid(),
  apartment_id uuid not null references public.apartments (id) on delete cascade,
  landlord_id uuid not null references public.users (id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  rejection_reason text,
  submitted_at timestamptz not null default now(),
  reviewed_at timestamptz,
  reviewed_by uuid references public.users (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz
);

create index apartment_verifications_apartment_idx on public.apartment_verifications (apartment_id);
create index apartment_verifications_landlord_idx on public.apartment_verifications (landlord_id);
create index apartment_verifications_status_idx on public.apartment_verifications (status, submitted_at);
create unique index apartment_verifications_one_pending_per_apt
  on public.apartment_verifications (apartment_id) where status = 'pending';

revoke all on public.apartment_verifications from public, anon, authenticated;
grant select, insert on public.apartment_verifications to authenticated;
grant update (status, rejection_reason) on public.apartment_verifications to authenticated;
alter table public.apartment_verifications enable row level security;

create policy "Landlords read own apartment verifications"
  on public.apartment_verifications for select to authenticated
  using (landlord_id = (select id from public.users where user_id = (select auth.uid())));
create policy "Admins read apartment verifications"
  on public.apartment_verifications for select to authenticated
  using ((select role from public.users where user_id = (select auth.uid())) = 'admin');
create policy "Landlords submit own apartment verifications"
  on public.apartment_verifications for insert to authenticated
  with check (
    landlord_id = (select id from public.users where user_id = (select auth.uid()))
    and status = 'pending' and reviewed_by is null and reviewed_at is null
    and exists (
      select 1 from public.apartments a
      where a.id = apartment_id and a.landlord_id = landlord_id
    )
  );
create policy "Admins review apartment verifications"
  on public.apartment_verifications for update to authenticated
  using ((select role from public.users where user_id = (select auth.uid())) = 'admin')
  with check ((select role from public.users where user_id = (select auth.uid())) = 'admin');

create table public.admin_audit_logs (
  id uuid primary key default gen_random_uuid(),
  admin_id uuid not null references public.users (id),
  action text not null check (action in (
    'USER_VERIFICATION_APPROVED', 'USER_VERIFICATION_REJECTED',
    'PROPERTY_VERIFICATION_APPROVED', 'PROPERTY_VERIFICATION_REJECTED'
  )),
  target_type text not null check (target_type in ('user_verification', 'apartment_verification')),
  target_id uuid not null,
  reason text,
  created_at timestamptz not null default now()
);

create index admin_audit_logs_created_idx on public.admin_audit_logs (created_at desc);
create index admin_audit_logs_target_idx on public.admin_audit_logs (target_type, target_id);
revoke all on public.admin_audit_logs from public, anon, authenticated;
grant select on public.admin_audit_logs to authenticated;
alter table public.admin_audit_logs enable row level security;
create policy "Admins read audit logs"
  on public.admin_audit_logs for select to authenticated
  using ((select role from public.users where user_id = (select auth.uid())) = 'admin');

create or replace function public.reject_verified_apartment_resubmission()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if exists (select 1 from public.apartments where id = new.apartment_id and is_verified) then
    raise exception 'Verified apartments cannot be resubmitted for verification.';
  end if;
  return new;
end;
$$;
revoke execute on function public.reject_verified_apartment_resubmission() from public, anon, authenticated;
create trigger reject_verified_apartment_resubmission
  before insert on public.apartment_verifications
  for each row execute function public.reject_verified_apartment_resubmission();

create or replace function public.sync_apartment_verification_review()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_reviewer_id uuid;
begin
  if old.status <> 'pending' then
    raise exception 'Only pending apartment verifications can be reviewed.';
  end if;
  if new.status not in ('approved', 'rejected') then
    raise exception 'Apartment verification status must move to approved or rejected.';
  end if;
  if new.status = 'rejected' and (new.rejection_reason is null or btrim(new.rejection_reason) = '') then
    raise exception 'A rejection reason is required to reject an apartment verification.';
  end if;
  if new.status = 'approved' then new.rejection_reason := null; end if;

  select id into v_reviewer_id from public.users where user_id = auth.uid() and role = 'admin';
  if v_reviewer_id is null then raise exception 'An authenticated admin reviewer is required.'; end if;
  new.reviewed_by := v_reviewer_id;
  new.reviewed_at := now();
  new.updated_at := now();

  update public.apartments
  set is_verified = (new.status = 'approved'), updated_at = now()
  where id = new.apartment_id;
  return new;
end;
$$;
revoke execute on function public.sync_apartment_verification_review() from public, anon, authenticated;
create trigger sync_apartment_verification_review
  before update of status on public.apartment_verifications
  for each row execute function public.sync_apartment_verification_review();

create or replace function public.set_apartment_verification_submitted()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  update public.apartments set is_verified = false, updated_at = now() where id = new.apartment_id;
  return new;
end;
$$;
revoke execute on function public.set_apartment_verification_submitted() from public, anon, authenticated;
create trigger set_apartment_verification_submitted
  after insert on public.apartment_verifications
  for each row execute function public.set_apartment_verification_submitted();

create or replace function public.write_admin_verification_audit()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.status is distinct from old.status and new.status in ('approved', 'rejected') then
    insert into public.admin_audit_logs (admin_id, action, target_type, target_id, reason)
    values (
      new.reviewed_by,
      case when tg_table_name = 'user_verifications'
        then 'USER_VERIFICATION_' || upper(new.status)
        else 'PROPERTY_VERIFICATION_' || upper(new.status) end,
      case when tg_table_name = 'user_verifications' then 'user_verification' else 'apartment_verification' end,
      new.id,
      new.rejection_reason
    );
  end if;
  return new;
end;
$$;
revoke execute on function public.write_admin_verification_audit() from public, anon, authenticated;
create trigger audit_user_verification_review
  after update of status on public.user_verifications
  for each row execute function public.write_admin_verification_audit();
create trigger audit_apartment_verification_review
  after update of status on public.apartment_verifications
  for each row execute function public.write_admin_verification_audit();

create or replace function public.notify_apartment_verification_submitted()
returns trigger language plpgsql security definer set search_path = public as $$
declare r_admin record;
begin
  for r_admin in select id from public.users where role = 'admin' loop
    perform public.create_notification(
      r_admin.id, 'system', 'New apartment verification submitted',
      'A landlord submitted a property for verification.',
      jsonb_build_object('screen', 'verification', 'apartmentId', new.apartment_id)
    );
  end loop;
  return new;
end;
$$;
revoke execute on function public.notify_apartment_verification_submitted() from public, anon, authenticated;
create trigger notify_apartment_verification_submitted
  after insert on public.apartment_verifications
  for each row execute function public.notify_apartment_verification_submitted();

create or replace function public.notify_apartment_verification_reviewed()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.status is distinct from old.status and new.status in ('approved', 'rejected') then
    perform public.create_notification(
      new.landlord_id, 'system',
      case when new.status = 'approved' then 'Apartment verification approved' else 'Apartment verification rejected' end,
      case when new.status = 'approved' then 'Your apartment is now verified.' else coalesce(new.rejection_reason, 'Your apartment could not be verified.') end,
      jsonb_build_object('screen', 'verification', 'apartmentId', new.apartment_id)
    );
  end if;
  return new;
end;
$$;
revoke execute on function public.notify_apartment_verification_reviewed() from public, anon, authenticated;
create trigger notify_apartment_verification_reviewed
  after update of status on public.apartment_verifications
  for each row execute function public.notify_apartment_verification_reviewed();
