-- Notification triggers call net.http_post through create_notification().
-- Keep test and production environments aligned before enabling workflows
-- that emit verification notifications.
create extension if not exists pg_net;
