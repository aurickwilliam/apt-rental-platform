-- Security hardening of the legacy get_conversations(uuid) RPC.
--
-- Background: the function is SECURITY DEFINER and was created with the
-- default PUBLIC EXECUTE grant, so anonymous callers could invoke it with an
-- arbitrary internal public.users.id. This migration restricts execution to
-- authenticated (legacy mobile clients still call this function) and
-- service_role (server-side use only). The function's trusting-by-design body
-- is left untouched for old-client compatibility and is scheduled for removal
-- once no supported client uses the legacy path (see get_conversations_v2).
--
-- Gotcha (2026-08-13, live verification): Supabase dashboards and early
-- migrations grant EXECUTE to anon directly, which a plain `revoke ... from
-- public` does not remove. Revoke from anon explicitly (idempotent) — a
-- `has_function_privilege('anon', ...)` check caught the direct grant on the
-- hosted project.

revoke execute on function public.get_conversations(uuid) from public;
revoke execute on function public.get_conversations(uuid) from anon;

grant execute on function public.get_conversations(uuid) to authenticated, service_role;