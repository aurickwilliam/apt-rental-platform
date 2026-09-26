-- Explicitly remove inherited/default client privileges before re-granting the
-- narrow API surface used by RLS policies and review actions.

revoke all on public.apartment_verifications from public, anon, authenticated;
grant select, insert on public.apartment_verifications to authenticated;
grant update (status, rejection_reason) on public.apartment_verifications to authenticated;

revoke all on public.admin_audit_logs from public, anon, authenticated;
grant select on public.admin_audit_logs to authenticated;
