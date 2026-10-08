-- Notifications for (1) new rental applications and (2) admin passport review.
--
-- 1. Landlords are told when a tenant applies to one of their apartments.
--    Only approve/reject notified anyone before, so landlords had to open the
--    app to discover new applications. Uses the existing 'apartment' type, so
--    the recipient's apartment notification preference applies.
-- 2. The admin "new passport document" notification reused screen 'passport',
--    the key tenants' own-document notifications use, so an admin who also has
--    a tenant/landlord role was sent to a document page that is not theirs
--    ("Document not found"). It now carries its own screen key,
--    'passportReview', which the mobile app answers with a "review on the web
--    admin portal" toast. Existing rows are re-keyed.

create or replace function public.notify_application_submitted()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_landlord_id uuid;
  v_apartment_name text;
  v_tenant_name text;
begin
  select a.landlord_id, coalesce(a.name, 'your apartment')
  into v_landlord_id, v_apartment_name
  from public.apartments a
  where a.id = NEW.apartment_id;

  if v_landlord_id is null or v_landlord_id = NEW.tenant_id then
    return NEW;
  end if;

  select coalesce(nullif(btrim(concat_ws(' ', u.first_name, u.last_name)), ''), 'A tenant')
  into v_tenant_name
  from public.users u
  where u.id = NEW.tenant_id;

  perform public.create_notification(
    v_landlord_id,
    'apartment',
    'New Application',
    coalesce(v_tenant_name, 'A tenant') || ' applied for ' || v_apartment_name || '.',
    jsonb_build_object(
      'screen', 'application',
      'applicationId', NEW.id,
      'apartmentId', NEW.apartment_id
    )
  );

  return NEW;
end;
$$;

revoke all on function public.notify_application_submitted() from public, anon, authenticated;

drop trigger if exists notify_application_submitted on public.rental_application;
create trigger notify_application_submitted
  after insert on public.rental_application
  for each row
  execute function public.notify_application_submitted();

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
        jsonb_build_object('screen', 'passportReview', 'documentId', NEW.id)
      );
    end loop;
  end if;
  return NEW;
end;
$$;

update public.notifications
set data = jsonb_set(data, '{screen}', '"passportReview"')
where title = 'New passport document submitted'
  and data->>'screen' = 'passport';
