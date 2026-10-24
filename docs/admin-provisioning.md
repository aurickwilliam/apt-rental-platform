# Admin account provisioning

Apply `supabase/migrations/20260923071226_harden_user_roles_and_onboarding.sql` and verify its database tests **before** provisioning any admin or releasing `/admin`. The migration is intentionally separate from the later portal migrations.

1. Create a normal, email-confirmed account through the existing tenant/landlord sign-up flow. Verify its identity out of band and record its `auth.users.id` securely.
2. As a trusted database operator (`postgres`), look up its profile by `user_id` and confirm exactly one row exists. Review its existing roles and verification history. Do not take an account identifier from a browser request or rely on a display email alone.
3. In a database transaction, promote the known profile ID with `UPDATE public.users SET roles = array(select distinct unnest(roles || 'admin')), updated_at = now() WHERE user_id = '<verified auth UUID>' AND not ('admin' = any(roles)) RETURNING id, roles;`. Confirm exactly one row was returned before committing. Promotion keeps the account's existing `tenant`/`landlord` role, and per `20261017070948_allow_mixed_role_tenant_transactions` a mixed admin/tenant profile keeps full tenant access (mixed admin/landlord keeps landlord access). For an admin-only operator account, replace the array instead: `SET roles = '{admin}'` — the account then has no consumer portal.
4. Confirm a normal account cannot update `roles`/`account_status` or insert an admin profile, and that the promoted account signs in on web through the existing sign-in tabs. To revoke admin access, use the same trusted connection to restore a normal role or roles and terminate that account's active sessions through Supabase Auth.

Never expose a database operator credential or service-role key to web/mobile clients. Do not use client-facing Server Actions or user-editable auth metadata to promote admins. Audit any pre-existing `admin` profiles before enabling the portal: they may have been created while client `users` writes were unrestricted.

## Two-step login (authenticator app)

Admin pages, server actions and route handlers go through `requireAdmin`, which asks for a verified second step (session level `aal2`) when `ADMIN_MFA_REQUIRED=true` is set on the web server. Anything but the exact string `true` leaves it off. Never turn it on before every admin has enrolled.

Roll-out, in order:

1. Deploy with the flag **off**. Each admin opens Settings → Security → Two-step login → **Set up authenticator app**, scans the QR code and enters the first code. Ask them to also add a **backup device** there. This applies to Google sign-in admins too.
2. As a database operator, confirm every admin has a verified device. The query must return no rows:
   ```sql
   select u.id, u.email from public.users u
   where 'admin' = any(u.roles)
     and not exists (select 1 from auth.mfa_factors f
                     where f.user_id = u.user_id and f.factor_type = 'totp' and f.status = 'verified');
   ```
3. Set `ADMIN_MFA_REQUIRED=true` and redeploy. Admins now enter a code after signing in.
4. Only after step 3 is live, apply `supabase/migrations/20261024140000_require_admin_second_step.sql`. Admin data then also needs `aal2` in the database (otherwise a stolen basic session could skip the page and call the database directly): `private.is_admin()`, the admin-only policies (audit logs, verifications, passport review, user-verification files) and the `admin_*` / `get_admin_*` functions all go through `private.has_admin_second_step()`. An admin who is also a tenant or landlord keeps normal access at `aal1`. An admin who has not enrolled can still reach `/two-step-login` (it needs only their own profile), so the migration cannot lock out enrolment.

Emergency switch-off (database only; the web flag is separate): redefine just the one function, then enrol or fix the problem and restore it from the migration.

```sql
create or replace function private.has_admin_second_step() returns boolean
language sql stable set search_path = '' as $$ select true; $$;
```

Lost device (and no backup): as a trusted operator, remove that admin's devices and end their sessions, then ask them to enrol again. Do this only after confirming their identity out of band.

```sql
delete from auth.mfa_factors where user_id = '<verified auth UUID>';
delete from auth.sessions where user_id = '<verified auth UUID>';
```

Enrolling or verifying a device ends the account's other sessions. Removing a verified device needs a code, and the last device cannot be removed from Settings.
