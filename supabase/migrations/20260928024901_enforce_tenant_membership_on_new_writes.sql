-- A former tenant who is now admin owns legacy tenant-side rows. Preserve
-- history (including status-only updates), but never create new tenant-side
-- transactions for an identity without a current tenant membership.
-- Identity changes are checked too; ordinary status/payment updates are not.
create function public.require_tenant_membership_for_new_transaction()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_tenant_id uuid := new.tenant_id;
begin
  if tg_op = 'UPDATE'
    and new.tenant_id is not distinct from old.tenant_id
    and (to_jsonb(new)->'apartment_id') is not distinct from (to_jsonb(old)->'apartment_id')
    and (to_jsonb(new)->'landlord_id') is not distinct from (to_jsonb(old)->'landlord_id')
    and (to_jsonb(new)->'tenancy_id') is not distinct from (to_jsonb(old)->'tenancy_id')
    and (to_jsonb(new)->'application_id') is not distinct from (to_jsonb(old)->'application_id') then
    return new;
  end if;

  -- Payments may omit tenant_id but reference a tenancy. Do not allow a null
  -- tenant_id on the payment to bypass membership checks for that tenancy.
  if tg_table_name = 'payment' and v_tenant_id is null and new.tenancy_id is not null then
    select tenant_id into v_tenant_id from public.tenancies
    where id = new.tenancy_id;
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

revoke all on function public.require_tenant_membership_for_new_transaction()
  from public, anon, authenticated;

create trigger zzz_require_tenant_application
before insert or update of tenant_id, apartment_id on public.rental_application
for each row execute function public.require_tenant_membership_for_new_transaction();

create trigger zzz_require_tenant_visit
before insert or update of tenant_id, apartment_id, landlord_id, application_id on public.visit_request
for each row execute function public.require_tenant_membership_for_new_transaction();

create trigger zzz_require_tenant_favorite
before insert or update of tenant_id, apartment_id on public.favorites
for each row execute function public.require_tenant_membership_for_new_transaction();

create trigger zzz_require_tenant_tenancy
before insert or update of tenant_id, apartment_id, landlord_id on public.tenancies
for each row execute function public.require_tenant_membership_for_new_transaction();

create trigger zzz_require_tenant_payment
before insert or update of tenant_id, apartment_id, landlord_id, tenancy_id on public.payment
for each row execute function public.require_tenant_membership_for_new_transaction();

-- sync_review_tenancy_fields populates the tenant before this trigger runs.
create trigger zzz_require_tenant_review
before insert or update of tenant_id, apartment_id, tenancy_id on public.reviews
for each row execute function public.require_tenant_membership_for_new_transaction();
