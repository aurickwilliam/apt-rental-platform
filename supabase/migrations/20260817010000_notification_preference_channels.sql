-- Split push and in-app delivery masters, and make chat-in-view toasts opt-in.
--
-- notifications_enabled: in-app banner master (toasts shown while using the app).
-- push_enabled: OS push master (Expo push delivery + token registration).
--   Per-type toggles stay shared across both channels.
-- show_chat_toasts: when true, message toasts are shown even for the chat that
--   is currently open (default false preserves the existing suppression).

alter table public.notification_preferences
  add column push_enabled boolean not null default true,
  add column show_chat_toasts boolean not null default false;

-- Preserve the "everything silenced" intent of existing rows: a user who turned
-- notifications off would otherwise start receiving OS push after this change.
update public.notification_preferences
  set push_enabled = notifications_enabled;