-- Include apartmentId in payment notification payloads.
--
-- The client deep-links payment notifications by role:
--   tenant  -> /tenant/payment/history/[paymentId]
--   landlord -> /landlord/manage-apartment/[apartmentId]/payment-history
-- The landlord link needs the apartment, so carry NEW.apartment_id in both
-- payloads (tenant ignores it; harmless).

create or replace function public.notify_payment_created()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_landlord_id uuid;
begin
  if NEW.status <> 'paid' then
    return NEW;
  end if;

  select a.landlord_id into v_landlord_id
  from public.apartments a
  where a.id = NEW.apartment_id;

  perform public.create_notification(
    NEW.tenant_id,
    'payment',
    'Payment Successful',
    'Your rent payment of ₱' || to_char(NEW.amount, 'FM999,999,999.00') || ' was received.',
    jsonb_build_object('screen', 'payments', 'paymentId', NEW.id, 'apartmentId', NEW.apartment_id)
  );

  if v_landlord_id is not null then
    perform public.create_notification(
      v_landlord_id,
      'payment',
      'Payment Received',
      'A tenant paid ₱' || to_char(NEW.amount, 'FM999,999,999.00') || '.',
      jsonb_build_object('screen', 'payments', 'paymentId', NEW.id, 'apartmentId', NEW.apartment_id)
    );
  end if;

  return NEW;
end;
$$;