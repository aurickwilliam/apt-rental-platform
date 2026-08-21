-- Relevance filter for the payout_destination fraud tripwire.
--
-- The trigger fired on every UPDATE, so a single save from the app (field
-- update + clear-old-default + set-new-default = 3 statements) produced 3
-- identical notifications and 3 push toasts. Notify only when something
-- meaningful happened:
--   - INSERT (new destination added), or
--   - a fraud-relevant field changed (type / bic / account_number /
--     account_name), or
--   - the row became the default (is_default false -> true).
-- Silent: no-op re-marks and the true -> false clearing step of a default
-- handoff.

create or replace function public.notify_payout_destination_changed()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if TG_OP = 'UPDATE'
    and OLD.type = NEW.type
    and OLD.bic = NEW.bic
    and OLD.account_number = NEW.account_number
    and OLD.account_name = NEW.account_name
    and not (NEW.is_default and not OLD.is_default)
  then
    return NEW;
  end if;

  perform public.create_notification(
    NEW.user_id,
    'payment',
    'Payout Destination Changed',
    'Your payout destination was ' || case when TG_OP = 'INSERT' then 'added' else 'changed' end
      || '. If this was not you, contact support immediately.',
    jsonb_build_object('screen', 'payouts', 'destinationId', NEW.id)
  );
  return NEW;
end;
$$;
