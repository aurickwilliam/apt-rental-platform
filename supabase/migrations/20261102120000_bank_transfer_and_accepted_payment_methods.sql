-- Bank Transfer (simulated PayMongo online banking, test mode: no real money, no fee)
-- and the landlord's accepted payment methods.
--
-- 1. 'bank_transfer' becomes a valid payment method on payments and on tenant
--    payment preferences. Existing rows are untouched.
-- 2. A landlord can choose which methods tenants may use. Method names only: no
--    account numbers and no credentials. No row means every method is allowed, so
--    nothing is backfilled and existing tenancies keep working.
-- 3. The choice is enforced in the database for client inserts (a restrictive
--    policy on payment, which also covers cash) and by the `paymongo` edge function
--    for service-role inserts. It is a policy, not a trigger on `payment`, so the
--    demo-population trigger audit (which reviews payment triggers) is unaffected.

-- 1. Method names ------------------------------------------------------------

alter table public.payment drop constraint if exists payment_method_check;
alter table public.payment add constraint payment_method_check
  check (method in ('gcash', 'maya', 'card', 'cash', 'qrph', 'bank_transfer'));

alter table public.payment_method_preferences
  drop constraint if exists payment_method_preferences_supported_methods_check,
  drop constraint if exists payment_method_preferences_supported_default_check;
alter table public.payment_method_preferences
  add constraint payment_method_preferences_supported_methods_check
    check (saved_methods <@ array['gcash', 'maya', 'qrph', 'bank_transfer', 'card', 'cash']::text[]),
  add constraint payment_method_preferences_supported_default_check
    check (default_method is null or default_method = any(array['gcash', 'maya', 'qrph', 'bank_transfer', 'card', 'cash']::text[]));

-- 2. Landlord accepted methods -------------------------------------------------

create table if not exists public.landlord_payment_settings (
  landlord_id uuid primary key references public.users (id) on delete cascade,
  accepted_methods text[] not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint landlord_payment_settings_methods_check
    check (
      cardinality(accepted_methods) >= 1
      and accepted_methods <@ array['gcash', 'maya', 'qrph', 'bank_transfer', 'card', 'cash']::text[]
    )
);

alter table public.landlord_payment_settings enable row level security;

revoke all on public.landlord_payment_settings from public, anon, authenticated;
grant select on public.landlord_payment_settings to authenticated;
grant insert (landlord_id, accepted_methods) on public.landlord_payment_settings to authenticated;
grant update (accepted_methods, updated_at) on public.landlord_payment_settings to authenticated;

-- Tenants never read this table; they use get_landlord_accepted_methods() below.
create policy "Landlords can read their payment settings"
  on public.landlord_payment_settings for select to authenticated
  using (
    exists (
      select 1 from public.users
      where id = landlord_payment_settings.landlord_id
        and user_id = (select auth.uid())
        and 'landlord' = any(roles)
    )
  );

create policy "Landlords can create their payment settings"
  on public.landlord_payment_settings for insert to authenticated
  with check (
    exists (
      select 1 from public.users
      where id = landlord_payment_settings.landlord_id
        and user_id = (select auth.uid())
        and 'landlord' = any(roles)
    )
  );

create policy "Landlords can update their payment settings"
  on public.landlord_payment_settings for update to authenticated
  using (
    exists (
      select 1 from public.users
      where id = landlord_payment_settings.landlord_id
        and user_id = (select auth.uid())
        and 'landlord' = any(roles)
    )
  )
  with check (
    exists (
      select 1 from public.users
      where id = landlord_payment_settings.landlord_id
        and user_id = (select auth.uid())
        and 'landlord' = any(roles)
    )
  );

drop policy if exists "Active accounts only" on public.landlord_payment_settings;
create policy "Active accounts only" on public.landlord_payment_settings as restrictive
  for all to authenticated
  using ((select app_private.is_active_user()))
  with check ((select app_private.is_active_user()));

-- An unverified landlord cannot change landlord settings (same gate as every
-- other landlord-side table).
drop trigger if exists guard_verified_landlord_write on public.landlord_payment_settings;
create trigger guard_verified_landlord_write
  before insert or update or delete on public.landlord_payment_settings
  for each row execute function app_private.guard_verified_landlord_write('landlord_id');

-- True when the landlord has not limited methods, or allows this one. A null
-- landlord (no resolvable owner) never blocks a payment.
create or replace function app_private.landlord_accepts_payment_method(p_landlord_id uuid, p_method text)
returns boolean language sql stable security definer set search_path = '' as $$
  select coalesce(
    (select p_method = any(s.accepted_methods)
     from public.landlord_payment_settings s
     where s.landlord_id = p_landlord_id),
    true);
$$;
revoke all on function app_private.landlord_accepts_payment_method(uuid, text) from public, anon;
grant execute on function app_private.landlord_accepts_payment_method(uuid, text) to authenticated, service_role;

-- Tenant-side read: the methods the landlord of the caller's own tenancy accepts
-- (every method when none is saved; null when the caller is not part of the tenancy).
create or replace function public.get_landlord_accepted_methods(p_tenancy_id uuid)
returns text[] language sql stable security definer set search_path = '' as $$
  select coalesce(
    (select s.accepted_methods
     from public.landlord_payment_settings s
     where s.landlord_id = t.landlord_id),
    array['gcash', 'maya', 'qrph', 'bank_transfer', 'card', 'cash']::text[])
  from public.tenancies t
  join public.users u
    on u.id in (t.tenant_id, t.landlord_id)
   and u.user_id = (select auth.uid())
   and u.is_suspended = false
  where t.id = p_tenancy_id
  limit 1;
$$;
revoke all on function public.get_landlord_accepted_methods(uuid) from public, anon;
grant execute on function public.get_landlord_accepted_methods(uuid) to authenticated;

-- 3. Enforcement for client inserts --------------------------------------------

drop policy if exists "Accepted payment methods only" on public.payment;
create policy "Accepted payment methods only" on public.payment as restrictive
  for insert to authenticated
  with check ((select app_private.landlord_accepts_payment_method(landlord_id, method)));
