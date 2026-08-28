-- Add tenant name to landlord payment notifications.
--
-- Previously the landlord "Payment Received" message was generic:
--   'A tenant paid ₱X.'
-- Pending cash already interpolated v_tenant_name but would render empty
-- if the name was null/blank.
--
-- This migration:
--   - Keeps the tenant's own "Payment Successful" as-is.
--   - Changes landlord "Payment Received" to '<Tenant> paid ₱X.' with
--     coalesce(nullif(v_tenant_name,''),'A tenant') fallback.
--   - Also fixes "Cash Payment Received" to use the same fallback.
--   - Adds tenantName to data (Option 2B) for future client use; deep-link
--     logic ignores extra keys.

create or replace function public.notify_payment_created()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_landlord_id uuid;
  v_tenant_name text;
begin
  if NEW.status = 'pending' and NEW.method = 'cash' then
    select a.landlord_id into v_landlord_id
    from public.apartments a
    where a.id = NEW.apartment_id;

    if v_landlord_id is not null then
      select trim(coalesce(first_name, '') || ' ' || coalesce(last_name, ''))
      into v_tenant_name
      from public.users
      where id = NEW.tenant_id;

      perform public.create_notification(
        v_landlord_id,
        'payment',
        'Cash Payment Received',
        coalesce(nullif(v_tenant_name, ''), 'A tenant') || ' paid ₱' || to_char(coalesce(NEW.amount,0), 'FM999,999,999.00') || ' in cash. Confirm to mark as paid.',
        jsonb_build_object('screen', 'payments', 'paymentId', NEW.id, 'apartmentId', NEW.apartment_id, 'tenantName', coalesce(nullif(v_tenant_name,''),'A tenant'))
      );
    end if;

    return NEW;
  end if;

  if NEW.status <> 'paid' then
    return NEW;
  end if;

  select a.landlord_id into v_landlord_id
  from public.apartments a
  where a.id = NEW.apartment_id;

  select trim(coalesce(first_name, '') || ' ' || coalesce(last_name, ''))
  into v_tenant_name
  from public.users
  where id = NEW.tenant_id;

  perform public.create_notification(
    NEW.tenant_id,
    'payment',
    'Payment Successful',
    'Your rent payment of ₱' || to_char(coalesce(NEW.amount,0), 'FM999,999,999.00') || ' was received.',
    jsonb_build_object('screen', 'payments', 'paymentId', NEW.id, 'apartmentId', NEW.apartment_id)
  );

  -- Skip the landlord when they confirm their own cash payment. auth.uid() is
  -- NULL for service_role webhook flips, so those still notify the landlord.
  -- v_landlord_id is public.users.id (internal), so resolve auth.uid() via users.user_id.
  if v_landlord_id is not null and (auth.uid() is null or (select id from public.users where user_id = auth.uid()) <> v_landlord_id) then
    perform public.create_notification(
      v_landlord_id,
      'payment',
      'Payment Received',
      coalesce(nullif(v_tenant_name, ''), 'A tenant') || ' paid ₱' || to_char(coalesce(NEW.amount,0), 'FM999,999,999.00') || '.',
      jsonb_build_object('screen', 'payments', 'paymentId', NEW.id, 'apartmentId', NEW.apartment_id, 'tenantName', coalesce(nullif(v_tenant_name,''),'A tenant'))
    );
  end if;

  return NEW;
end;
$$;

drop trigger if exists notify_payment_created on public.payment;

create trigger notify_payment_created
  after insert or update of status on public.payment
  for each row
  when (new.status in ('paid', 'pending'))
  execute function public.notify_payment_created();
