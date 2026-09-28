-- All identities below use public.users.id, not auth.users.id. RLS alone only
-- checks ownership of the row being written, not the owner of its apartment.
create function public.prevent_self_apartment_transaction()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_row jsonb := to_jsonb(new);
  v_tenant_id uuid := (v_row->>'tenant_id')::uuid;
  v_apartment_id uuid := (v_row->>'apartment_id')::uuid;
  v_landlord_id uuid := (v_row->>'landlord_id')::uuid;
  v_owner_id uuid;
  v_related record;
begin
  if tg_table_name = 'payment' and (v_row->>'tenancy_id') is not null then
    select apartment_id, tenant_id, landlord_id into v_related
    from public.tenancies where id = (v_row->>'tenancy_id')::uuid;
    if found and (
      (v_tenant_id is not null and v_tenant_id <> v_related.tenant_id)
      or (v_apartment_id is not null and v_apartment_id <> v_related.apartment_id)
      or (v_landlord_id is not null and v_landlord_id is distinct from v_related.landlord_id)
    ) then
      raise exception 'Payment does not match its tenancy.' using errcode = '23514';
    end if;
    if found then
      v_tenant_id := coalesce(v_tenant_id, v_related.tenant_id);
      v_apartment_id := coalesce(v_apartment_id, v_related.apartment_id);
      v_landlord_id := coalesce(v_landlord_id, v_related.landlord_id);
    end if;
  end if;

  if tg_table_name = 'visit_request' and (v_row->>'application_id') is not null then
    select apartment_id, tenant_id into v_related
    from public.rental_application where id = (v_row->>'application_id')::uuid;
    if found and (v_apartment_id is distinct from v_related.apartment_id
      or v_tenant_id is distinct from v_related.tenant_id) then
      raise exception 'Visit request does not match its application.' using errcode = '23514';
    end if;
  end if;

  if v_tenant_id is not null and v_tenant_id = v_landlord_id then
    raise exception 'You cannot transact with your own property as a tenant.' using errcode = '23514';
  end if;

  if v_apartment_id is not null then
    -- Serialize with changes to apartment ownership.
    select landlord_id into v_owner_id from public.apartments
    where id = v_apartment_id for share;
    if found then
      if v_tenant_id = v_owner_id then
        raise exception 'You cannot transact with your own property as a tenant.' using errcode = '23514';
      end if;
      if v_landlord_id is not null and v_landlord_id <> v_owner_id then
        raise exception 'Landlord does not own this apartment.' using errcode = '23514';
      end if;
    end if;
  end if;

  return new;
end;
$$;

revoke all on function public.prevent_self_apartment_transaction() from public, anon, authenticated;

create trigger prevent_self_application
before insert or update of tenant_id, apartment_id on public.rental_application
for each row execute function public.prevent_self_apartment_transaction();

create trigger prevent_self_favorite
before insert or update of tenant_id, apartment_id on public.favorites
for each row execute function public.prevent_self_apartment_transaction();

create trigger prevent_self_visit
before insert or update of tenant_id, landlord_id, apartment_id, application_id on public.visit_request
for each row execute function public.prevent_self_apartment_transaction();

create trigger prevent_self_tenancy
before insert or update of tenant_id, landlord_id, apartment_id on public.tenancies
for each row execute function public.prevent_self_apartment_transaction();

create trigger prevent_self_payment
before insert or update of tenant_id, landlord_id, apartment_id, tenancy_id on public.payment
for each row execute function public.prevent_self_apartment_transaction();

-- Runs after sync_review_tenancy_fields so tenancy-derived identities are checked.
create trigger zz_prevent_self_review
before insert or update of tenant_id, apartment_id, tenancy_id on public.reviews
for each row execute function public.prevent_self_apartment_transaction();

-- A listing cannot be reassigned to a tenant who already has an active
-- relationship with it. Historical transactions are retained unchanged.
create function public.prevent_self_apartment_transfer()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.landlord_id is distinct from old.landlord_id and (
    exists (select 1 from public.rental_application where apartment_id = new.id
      and tenant_id = new.landlord_id and status in ('pending', 'approved'))
    or exists (select 1 from public.visit_request where apartment_id = new.id
      and tenant_id = new.landlord_id and status in ('pending', 'approved', 'rescheduled'))
    or exists (select 1 from public.tenancies where apartment_id = new.id
      and tenant_id = new.landlord_id and status = 'active')
  ) then
    raise exception 'The new owner is an active tenant of this apartment.' using errcode = '23514';
  end if;
  return new;
end;
$$;

revoke all on function public.prevent_self_apartment_transfer() from public, anon, authenticated;
create trigger prevent_self_apartment_transfer
before update of landlord_id on public.apartments
for each row execute function public.prevent_self_apartment_transfer();

-- Apartment-less chats may be general conversations; disallow only a user
-- messaging themselves. With an apartment, one party must be its landlord.
alter table public.chat add constraint chat_distinct_participants
  check (sender_id <> receiver_id);

create function public.guard_apartment_chat_participants()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.apartment_id is not null and not exists (
    select 1 from public.apartments a
    where a.id = new.apartment_id
      and a.landlord_id in (new.sender_id, new.receiver_id)
  ) then
    raise exception 'Apartment conversation must include its landlord.' using errcode = '23514';
  end if;
  return new;
end;
$$;

revoke all on function public.guard_apartment_chat_participants() from public, anon, authenticated;
create trigger guard_apartment_chat_participants
before insert or update of sender_id, receiver_id, apartment_id on public.chat
for each row execute function public.guard_apartment_chat_participants();

-- The existing RPC permits admin accounts to add normal memberships. Keep
-- role addition idempotent but never let admin identities enter user portals.
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
  if 'admin' = any(v_profile.roles) then
    raise exception 'Admin accounts cannot add tenant or landlord roles.';
  end if;
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
