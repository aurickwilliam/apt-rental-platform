-- Isolated PostgreSQL-only harness, NOT a migration. Never run against a hosted
-- project. Models existing dependencies so the new migration can be exercised
-- without Docker or replaying the project's historical, hosted-only schema.
\set ON_ERROR_STOP on
do $$ begin
  if not exists(select 1 from pg_roles where rolname='anon') then create role anon; end if;
  if not exists(select 1 from pg_roles where rolname='authenticated') then create role authenticated; end if;
end $$;
create schema auth;
create schema app_private;
create function auth.uid() returns uuid language sql stable as
  $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
create table public.users(id uuid primary key, user_id uuid unique, roles text[] not null,
  is_suspended boolean not null default false, first_name text, last_name text);
create function app_private.is_active_user() returns boolean language sql stable security definer set search_path='' as
  $$ select exists(select 1 from public.users where user_id=auth.uid() and not is_suspended) $$;
create table public.apartments(id uuid primary key,landlord_id uuid references public.users(id),
  name text not null,monthly_rent numeric,deleted_at timestamptz);
create table public.tenancies(id uuid primary key,apartment_id uuid references public.apartments(id),
  tenant_id uuid references public.users(id),lease_start date,lease_end date,monthly_rent numeric,
  rent_due_day int not null default 5,status text not null default 'active');
create table public.payment(id uuid primary key default gen_random_uuid(),apartment_id uuid references public.apartments(id),
  tenancy_id uuid references public.tenancies(id),date date not null,amount numeric,status text,
  period_start date);
grant usage on schema public,auth,app_private to anon,authenticated;
grant execute on function auth.uid(),app_private.is_active_user() to authenticated;
grant select on public.users,public.apartments,public.tenancies,public.payment to authenticated;
alter table public.users enable row level security;
create policy profiles on public.users for select to authenticated using (app_private.is_active_user());
alter table public.payment enable row level security;
create policy payments on public.payment for select to authenticated using (
  app_private.is_active_user() and apartment_id in(select id from public.apartments
    where landlord_id=(select id from public.users where user_id=auth.uid())));
\ir ../migrations/20261016163249_landlord_profit_planning.sql
\ir ../migrations/20261016163757_cache_landlord_finance_policy_identity.sql
\ir ../migrations/20261017064029_allow_mixed_role_landlord_finances.sql
\ir landlord-finances-regression.sql
