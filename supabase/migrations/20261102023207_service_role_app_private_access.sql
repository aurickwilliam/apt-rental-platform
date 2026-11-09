-- Let service_role fire the verified-account guards.
--
-- The `guard_verified_tenant_insert`, `guard_verified_landlord_write` and
-- `guard_verified_landlord_chat` triggers run as the caller (SECURITY INVOKER)
-- and call helpers in `app_private`. `authenticated` was granted schema USAGE
-- and EXECUTE on those helpers, but `service_role` never was, so every write
-- the edge functions make as service_role to a guarded table (payment checkout
-- reservations, webhook confirmations) failed with
-- "permission denied for schema app_private".
--
-- The helpers already treat service_role as exempt (identity comes from the
-- JWT), so only the privileges are missing. Grant exactly what the guards call.

grant usage on schema app_private to service_role;

grant execute on function app_private.unverified_tenant_id() to service_role;
grant execute on function app_private.unverified_landlord_id() to service_role;
grant execute on function app_private.tenant_has_active_tenancy(uuid, uuid) to service_role;
grant execute on function app_private.landlord_has_active_tenancy(uuid, uuid) to service_role;
grant execute on function app_private.row_landlord_id(jsonb, text) to service_role;
grant execute on function app_private.apartment_landlord_id(uuid) to service_role;
