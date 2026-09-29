-- Self-service profile writes (avatar/background uploads, contact & address
-- edits) always stamp updated_at alongside the edited columns. The
-- column-scoped UPDATE grants on public.users covered every self-editable
-- column except updated_at, so those writes failed with
-- "permission denied for table users". Grant it to match the existing pattern.
-- Server-managed columns (id, user_id, roles, account_status, created_at)
-- remain excluded.
grant update (updated_at) on public.users to authenticated;
