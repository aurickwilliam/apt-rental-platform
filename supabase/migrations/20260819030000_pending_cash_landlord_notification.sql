-- Notify the landlord when a tenant records a cash payment.
--
-- Cash payments are created client-side with status='pending' and stay
-- pending until the landlord confirms them ("Mark as Paid"). The old trigger
-- only fired on transitions to 'paid', so a pending cash payment notified
-- nobody and the landlord had no entry point to confirm it.
--
-- New behavior:
--   - INSERT/UPDATE with status='pending' and method='cash' -> notify the
--     landlord only ("confirm to mark as paid"), deep-linking to the
--     apartment payment-history screen.
--   - status='paid' -> existing behavior (tenant "Payment Successful" +
--     landlord "Payment Received"), plus a self-skip guard so the landlord
--     confirming their own cash payment isn't pinged about their own action
--     (auth.uid() is NULL for service_role webhook flips, so those still
--     notify the landlord).

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
        v_tenant_name || ' paid ₱' || to_char(NEW.amount, 'FM999,999,999.00') || ' in cash. Confirm to mark as paid.',
        jsonb_build_object('screen', 'payments', 'paymentId', NEW.id, 'apartmentId', NEW.apartment_id)
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

  perform public.create_notification(
    NEW.tenant_id,
    'payment',
    'Payment Successful',
    'Your rent payment of ₱' || to_char(NEW.amount, 'FM999,999,999.00') || ' was received.',
    jsonb_build_object('screen', 'payments', 'paymentId', NEW.id, 'apartmentId', NEW.apartment_id)
  );

  -- Skip the landlord when they confirm their own cash payment. auth.uid() is
  -- NULL for service_role webhook flips, so those still notify the landlord.
  if v_landlord_id is not null and (auth.uid() is null or auth.uid() <> v_landlord_id) then
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

drop trigger if exists notify_payment_created on public.payment;

create trigger notify_payment_created
  after insert or update of status on public.payment
  for each row
  when (new.status in ('paid', 'pending'))
  execute function public.notify_payment_created();