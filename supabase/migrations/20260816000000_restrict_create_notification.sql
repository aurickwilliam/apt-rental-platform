-- Restrict create_notification to the service role.
--
-- create_notification() is SECURITY DEFINER and inserts notification rows
-- (and fires push delivery) for any user_id. Granting execute to
-- authenticated let any signed-in client spam notifications and pushes for
-- arbitrary users. Clients never insert notification rows (see AGENTS.md);
-- triggers invoke it as the function owner, so this does not affect them.

revoke execute on function public.create_notification(uuid, text, text, text, jsonb) from authenticated;