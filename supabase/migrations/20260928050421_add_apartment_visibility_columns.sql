-- Visibility columns for apartments (mirrors the column additions from the
-- Phase 2 admin operations batch, applied standalone for environments that
-- never received 20260926143751_phase2_admin_operations).
alter table public.apartments
  add column if not exists is_hidden_by_admin boolean not null default false,
  add column if not exists hidden_at timestamptz,
  add column if not exists hidden_by uuid references public.users(id),
  add column if not exists hidden_reason text;
