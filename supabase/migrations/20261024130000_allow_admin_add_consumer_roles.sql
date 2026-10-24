-- An admin who also owns property (or rents) needs a tenant/landlord role on the
-- same account. grant_user_role refused every admin, so only a database operator
-- could add one. Admins may now add 'tenant' or 'landlord' to themselves.
--
-- Unchanged: the role must be tenant/landlord (never admin, which stays an
-- operator-only promotion), the profile must be complete (mobile number), and
-- the call is idempotent. A mixed admin/tenant or admin/landlord profile is
-- already supported by the transaction guards, which key on the held roles.
create or replace function public.grant_user_role(new_role text)
returns text[]
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_profile public.users%rowtype;
begin
  if auth.uid() is null or new_role is null or new_role not in ('tenant', 'landlord') then
    raise exception 'Invalid role grant.';
  end if;

  select * into v_profile from public.users
  where user_id = auth.uid() for update;
  if not found then raise exception 'Profile not found.'; end if;
  if v_profile.mobile_number is null then
    raise exception 'Complete your profile before adding a role.';
  end if;

  if not new_role = any(v_profile.roles) then
    update public.users set roles = roles || new_role, updated_at = now()
    where id = v_profile.id
    returning roles into v_profile.roles;
  end if;
  return v_profile.roles;
end;
$$;
