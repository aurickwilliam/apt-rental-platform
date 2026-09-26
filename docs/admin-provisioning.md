# Admin account provisioning

Apply `supabase/migrations/20260923071226_harden_user_roles_and_onboarding.sql` and verify its database tests **before** provisioning any admin or releasing `/admin`. The migration is intentionally separate from the later portal migrations.

1. Create a normal, email-confirmed account through the existing tenant/landlord sign-up flow. Verify its identity out of band and record its `auth.users.id` securely.
2. As a trusted database operator (`postgres`), look up its profile by `user_id` and confirm exactly one row exists. Review its existing role and verification history. Do not take an account identifier from a browser request or rely on a display email alone.
3. In a database transaction, promote the known profile ID with `UPDATE public.users SET role = 'admin', updated_at = now() WHERE user_id = '<verified auth UUID>' RETURNING id, role;`. Confirm exactly one row was returned before committing.
4. Confirm a normal account cannot update `role`/`account_status` or insert an admin profile, and that the promoted account signs in on web through the existing sign-in tabs. To revoke admin access, use the same trusted connection to restore a normal role and terminate that account's active sessions through Supabase Auth.

Never expose a database operator credential or service-role key to web/mobile clients. Do not use client-facing Server Actions or user-editable auth metadata to promote admins. Audit any pre-existing `admin` profiles before enabling the portal: they may have been created while client `users` writes were unrestricted.
