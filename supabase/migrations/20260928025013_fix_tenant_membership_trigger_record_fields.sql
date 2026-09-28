-- The previous trigger function accessed payment.tenancy_id even on other
-- tables: SQL expressions need not short-circuit field access on trigger rows.
create or replace function public.require_tenant_membership_for_new_transaction()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_tenant_id uuid := new.tenant_id;
begin
  if tg_op = 'UPDATE' then
    if new.tenant_id is not distinct from old.tenant_id
      and (to_jsonb(new)->'apartment_id') is not distinct from (to_jsonb(old)->'apartment_id')
      and (to_jsonb(new)->'landlord_id') is not distinct from (to_jsonb(old)->'landlord_id')
      and (to_jsonb(new)->'tenancy_id') is not distinct from (to_jsonb(old)->'tenancy_id')
      and (to_jsonb(new)->'application_id') is not distinct from (to_jsonb(old)->'application_id') then
      return new;
    end if;
  end if;

  if tg_table_name = 'payment' then
    if v_tenant_id is null and (to_jsonb(new)->>'tenancy_id') is not null then
      select tenant_id into v_tenant_id from public.tenancies
      where id = (to_jsonb(new)->>'tenancy_id')::uuid;
    end if;
  end if;

  if v_tenant_id is not null and not exists (
    select 1 from public.users u
    where u.id = v_tenant_id
      and 'tenant' = any(u.roles)
      and not ('admin' = any(u.roles))
  ) then
    raise exception 'A current tenant role is required for new tenant transactions.'
      using errcode = '23514';
  end if;

  return new;
end;
$$;
