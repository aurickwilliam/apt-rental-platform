-- Allow admins to read every profile without recursing through users RLS.
-- Keep the privilege check outside exposed schemas and bind it to auth.uid().
create schema if not exists private;
revoke all on schema private from public, anon;
grant usage on schema private to authenticated;

create function private.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.users
    where user_id = (select auth.uid())
      and 'admin' = any (roles)
  );
$$;

revoke all on function private.is_admin() from public, anon;
grant execute on function private.is_admin() to authenticated;

create policy "Admins can read all users"
on public.users for select to authenticated
using ((select private.is_admin()));

create or replace function public.notify_verification_submitted()
returns trigger language plpgsql security definer set search_path = public as $$
declare r_admin record;
begin
  for r_admin in select id from public.users where 'admin' = any (roles) loop
    perform public.create_notification(
      r_admin.id, 'system', 'New account verification submitted',
      'A user submitted ID documents for verification.',
      jsonb_build_object('screen', 'verification', 'verificationId', new.id)
    );
  end loop;
  return new;
end;
$$;

create or replace function public.notify_apartment_verification_submitted()
returns trigger language plpgsql security definer set search_path = public as $$
declare r_admin record;
begin
  for r_admin in select id from public.users where 'admin' = any (roles) loop
    perform public.create_notification(
      r_admin.id, 'system', 'New apartment verification submitted',
      'A landlord submitted a property for verification.',
      jsonb_build_object('screen', 'verification', 'apartmentId', new.apartment_id)
    );
  end loop;
  return new;
end;
$$;

create or replace function public.sync_apartment_verification_review()
returns trigger language plpgsql security definer set search_path = public as $$
declare v_reviewer_id uuid;
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

  select id into v_reviewer_id from public.users
  where user_id = (select auth.uid()) and 'admin' = any (roles);
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
