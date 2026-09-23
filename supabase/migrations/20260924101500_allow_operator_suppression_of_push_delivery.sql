-- Trusted database operators can suppress outbound delivery for transaction-
-- scoped integration tests while retaining the notification feed insert.
-- Client sessions cannot use this switch because their session user is not
-- postgres, even though this helper runs as SECURITY DEFINER.
create or replace function public.create_notification(
  p_user_id uuid,
  p_type text,
  p_title text,
  p_message text default '',
  p_data jsonb default '{}'::jsonb
) returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid;
begin
  insert into public.notifications (user_id, type, title, message, data)
  values (p_user_id, p_type, p_title, p_message, p_data)
  returning id into v_id;

  if session_user <> 'postgres'
    or current_setting('app.suppress_push_delivery', true) is distinct from 'true' then
    perform net.http_post(
      url := 'https://ezxirkpgfpripjydcqnt.supabase.co/functions/v1/push-notify',
      headers := jsonb_build_object('Content-Type', 'application/json'),
      body := jsonb_build_object(
        'notification_id', v_id,
        'user_id', p_user_id,
        'type', p_type,
        'title', p_title,
        'message', p_message,
        'data', p_data
      )
    );
  end if;

  return v_id;
end;
$$;
