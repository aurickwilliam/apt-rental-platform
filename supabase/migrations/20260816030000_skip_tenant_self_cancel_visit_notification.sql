-- Skip self-notification when a tenant cancels their own visit request.
--
-- notify_visit_request fires on any status change and always notifies the
-- tenant. A tenant cancelling their own visit would otherwise receive a
-- "Visit Cancelled" notification about their own action. auth.uid() resolves
-- to the acting user inside the PostgREST request session, so:
--   - tenant self-cancel  -> notification skipped
--   - landlord declines/cancels, or the server auto-cancels on application
--     approval (actor is the landlord) -> notification still sent

create or replace function public.notify_visit_request()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_landlord_id uuid;
  v_title text;
  v_message text;
begin
  if TG_OP = 'INSERT' then
    select a.landlord_id into v_landlord_id
    from public.apartments a
    where a.id = NEW.apartment_id;

    if v_landlord_id is not null then
      perform public.create_notification(
        v_landlord_id,
        'apartment',
        'New Visit Request',
        'A tenant wants to visit on ' || to_char(NEW.visit_date, 'Mon DD, YYYY') || '.',
        jsonb_build_object('screen', 'visitRequests', 'visitRequestId', NEW.id)
      );
    end if;

    return NEW;
  end if;

  if NEW.status is distinct from OLD.status then
    if NEW.status = 'cancelled'
      and auth.uid() is not null
      and auth.uid() = (select user_id from public.users where id = NEW.tenant_id) then
      return NEW;
    end if;

    v_title := case NEW.status
      when 'approved' then 'Visit Approved'
      when 'rejected' then 'Visit Rejected'
      when 'rescheduled' then 'Visit Rescheduled'
      when 'cancelled' then 'Visit Cancelled'
      else 'Visit Update'
    end;

    v_message := 'Your visit request on ' || to_char(NEW.visit_date, 'Mon DD, YYYY');
    if NEW.confirmed_visit_date is not null then
      v_message := v_message || ' has been moved to ' || to_char(NEW.confirmed_visit_date, 'Mon DD, YYYY');
    else
      v_message := v_message || ' was ' || NEW.status || '.';
    end if;

    perform public.create_notification(
      NEW.tenant_id,
      'apartment',
      v_title,
      v_message,
      jsonb_build_object('screen', 'visitRequests', 'visitRequestId', NEW.id)
    );
  end if;

  return NEW;
end;
$$;