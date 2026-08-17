-- Include apartmentId in maintenance notification payloads.
--
-- The client deep-links maintenance notifications by role:
--   tenant   -> /tenant/maintenance-history?apartmentId=... (the history hook
--               is gated on apartmentId, so it is required)
--   landlord -> /landlord/maintenance-requests (list)
-- Both trigger paths know the apartment, so carry NEW.apartment_id in each
-- payload (the landlord ignores it).

create or replace function public.notify_maintenance_request()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_landlord_id uuid;
  v_title text;
begin
  if TG_OP = 'INSERT' then
    select a.landlord_id into v_landlord_id
    from public.apartments a
    where a.id = NEW.apartment_id;

    if v_landlord_id is not null then
      perform public.create_notification(
        v_landlord_id,
        'maintenance',
        'New Maintenance Request',
        NEW.title || ' (' || NEW.urgency || ' priority).',
        jsonb_build_object('screen', 'maintenance', 'maintenanceId', NEW.id, 'apartmentId', NEW.apartment_id)
      );
    end if;

    return NEW;
  end if;

  if NEW.status is distinct from OLD.status then
    v_title := case NEW.status
      when 'in_progress' then 'Maintenance In Progress'
      when 'resolved' then 'Maintenance Resolved'
      when 'cancelled' then 'Maintenance Cancelled'
      else 'Maintenance Update'
    end;

    perform public.create_notification(
      NEW.tenant_id,
      'maintenance',
      v_title,
      NEW.title,
      jsonb_build_object('screen', 'maintenance', 'maintenanceId', NEW.id, 'apartmentId', NEW.apartment_id)
    );
  end if;

  return NEW;
end;
$$;