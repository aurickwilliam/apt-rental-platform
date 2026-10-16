-- Tenant-owned, credential-free checkout preferences. These deliberately store payment method
-- names only: card numbers, CVVs, wallet accounts, and provider tokens never
-- enter APT's database.
create table if not exists public.payment_method_preferences (
  user_id uuid primary key references public.users(id) on delete cascade,
  saved_methods text[] not null default '{}',
  default_method text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint payment_method_preferences_supported_methods_check
    check (saved_methods <@ array['gcash', 'maya', 'qrph', 'card', 'cash']::text[]),
  constraint payment_method_preferences_default_is_saved_check
    check (default_method is null or default_method = any(saved_methods)),
  constraint payment_method_preferences_supported_default_check
    check (default_method is null or default_method = any(array['gcash', 'maya', 'qrph', 'card', 'cash']::text[]))
);

alter table public.payment_method_preferences enable row level security;

revoke all on public.payment_method_preferences from public, anon, authenticated;
grant select, delete on public.payment_method_preferences to authenticated;
grant insert (user_id, saved_methods, default_method) on public.payment_method_preferences to authenticated;
grant update (saved_methods, default_method, updated_at) on public.payment_method_preferences to authenticated;

create policy "Tenants can read their payment preferences"
  on public.payment_method_preferences for select to authenticated
  using (
    exists (
      select 1
      from public.users
      where id = payment_method_preferences.user_id
        and user_id = auth.uid()
        and is_suspended = false
    )
  );

create policy "Active tenants can create their payment preferences"
  on public.payment_method_preferences for insert to authenticated
  with check (
    exists (
      select 1
      from public.users
      where id = payment_method_preferences.user_id
        and user_id = auth.uid()
        and roles @> array['tenant']::text[]
        and not (roles @> array['admin']::text[])
        and is_suspended = false
    )
  );

create policy "Active tenants can update their payment preferences"
  on public.payment_method_preferences for update to authenticated
  using (
    exists (
      select 1
      from public.users
      where id = payment_method_preferences.user_id
        and user_id = auth.uid()
        and is_suspended = false
    )
  )
  with check (
    exists (
      select 1
      from public.users
      where id = payment_method_preferences.user_id
        and user_id = auth.uid()
        and roles @> array['tenant']::text[]
        and not (roles @> array['admin']::text[])
        and is_suspended = false
    )
  );

create policy "Tenants can delete their payment preferences"
  on public.payment_method_preferences for delete to authenticated
  using (
    exists (
      select 1
      from public.users
      where id = payment_method_preferences.user_id
        and user_id = auth.uid()
        and is_suspended = false
    )
  );
